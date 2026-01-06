#!/usr/bin/env python3
"""
Granola Meeting Notes Auto-Import

Watches for Granola exports and automatically imports them into Supabase.
No Zapier needed - runs as a local background service.

Setup:
    1. pip install openai supabase python-dotenv watchdog
    2. Set environment variables in .env.local:
       - NEXT_PUBLIC_SUPABASE_URL
       - SUPABASE_SERVICE_ROLE_KEY
       - OPENAI_API_KEY
       - MEETING_NOTES_ORG_ID (your organization ID)
       - MEETING_NOTES_WATCH_DIR (default: ~/Documents/Granola)

    3. Configure Granola to export to the watch folder

Usage:
    python import-meeting-notes.py watch

The watcher will:
    - Monitor the folder for new Granola exports (.txt, .md, .json)
    - Extract action items using GPT
    - Import into Supabase meeting_notes table
    - Move processed files to 'processed/' subfolder
"""

import os
import sys
import json
import time
import shutil
import argparse
from datetime import datetime
from pathlib import Path

try:
    from openai import OpenAI
    from supabase import create_client, Client
    from dotenv import load_dotenv
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError as e:
    print("Missing dependencies. Install with:")
    print("  pip install openai supabase python-dotenv watchdog")
    print(f"\nMissing: {e}")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEFAULT_ORG_ID = os.getenv("MEETING_NOTES_ORG_ID")
WATCH_DIR = os.getenv("MEETING_NOTES_WATCH_DIR", str(Path.home() / "Documents" / "Granola"))

# Granola export file extensions
SUPPORTED_EXTENSIONS = {".txt", ".md", ".json"}

def get_supabase_client() -> Client:
    """Create Supabase client with service role key."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_openai_client() -> OpenAI:
    """Create OpenAI client."""
    if not OPENAI_API_KEY:
        raise ValueError("Missing OPENAI_API_KEY in environment")
    return OpenAI(api_key=OPENAI_API_KEY)

def parse_granola_export(client: OpenAI, content: str, filename: str) -> dict:
    """Parse Granola export and extract structured data using GPT."""
    print("Parsing Granola export and extracting action items...")

    system_prompt = """You are parsing a Granola meeting notes export. Analyze the content and output a JSON object with:
{
    "title": "Meeting title (extract from content or generate from context)",
    "summary": "The full meeting notes content, cleaned up and formatted as markdown",
    "action_items": [
        {
            "title": "Action item title",
            "description": "Optional details",
            "assignee_name": "Person's name if mentioned, or null"
        }
    ],
    "tags": ["relevant", "topic", "tags"]
}

Guidelines:
- Keep the original summary content - don't over-summarize
- Extract ALL action items, tasks, follow-ups, to-dos mentioned
- Include assignee names exactly as written if mentioned
- Tags should reflect main topics discussed (2-5 tags)
- If there's a clear title in the export, use it; otherwise derive from content"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",  # Cheaper model since Granola already did the heavy lifting
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Filename: {filename}\n\nContent:\n{content}"}
        ],
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)
    print(f"Extracted {len(result.get('action_items', []))} action items")
    return result

def import_to_supabase(
    supabase: Client,
    summary: dict,
    org_id: str,
    author_id: str | None = None,
    meeting_date: str | None = None
) -> dict:
    """Insert meeting note and action items into Supabase."""
    print("Importing to Supabase...")

    # Create meeting note
    note_data = {
        "title": summary["title"],
        "content": summary["summary"],
        "meeting_date": meeting_date or datetime.now().isoformat(),
        "org_id": org_id,
        "tags": summary.get("tags", []),
        "status": "published"
    }

    if author_id:
        note_data["author_id"] = author_id

    result = supabase.table("meeting_notes").insert(note_data).execute()

    if not result.data:
        raise Exception("Failed to create meeting note")

    note_id = result.data[0]["id"]
    print(f"Created meeting note: {note_id}")

    # Create action items
    action_items = summary.get("action_items", [])
    if action_items:
        items_data = [
            {
                "note_id": note_id,
                "title": item["title"],
                "description": item.get("description"),
                "status": "open"
            }
            for item in action_items
        ]

        supabase.table("action_items").insert(items_data).execute()
        print(f"Created {len(items_data)} action items")

    return {
        "note_id": note_id,
        "title": summary["title"],
        "action_items_count": len(action_items)
    }

def process_granola_file(file_path: Path, org_id: str) -> dict | None:
    """Process a Granola export file and import to Supabase."""
    suffix = file_path.suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        return None

    supabase = get_supabase_client()
    openai_client = get_openai_client()

    # Read the file content
    content = file_path.read_text(encoding='utf-8')

    # Handle JSON exports (Granola may export structured data)
    if suffix == ".json":
        try:
            data = json.loads(content)
            # Granola JSON might have different structures
            content = data.get("transcript") or data.get("content") or data.get("notes") or json.dumps(data, indent=2)
        except json.JSONDecodeError:
            pass  # Treat as plain text

    # Extract date from filename (e.g., "2024-01-15 Team Standup.md")
    meeting_date = None
    filename = file_path.stem
    if len(filename) >= 10 and filename[:4].isdigit():
        try:
            date_part = filename[:10]
            datetime.strptime(date_part, "%Y-%m-%d")
            meeting_date = f"{date_part}T09:00:00"
        except ValueError:
            pass

    # Parse with GPT to extract action items
    parsed = parse_granola_export(openai_client, content, file_path.name)

    # Import to Supabase
    return import_to_supabase(supabase, parsed, org_id, meeting_date=meeting_date)


class GranolaWatcher(FileSystemEventHandler):
    """Watches for new Granola exports and imports them automatically."""

    def __init__(self, org_id: str, watch_dir: Path):
        self.org_id = org_id
        self.watch_dir = watch_dir
        self.processed_dir = watch_dir / "processed"
        self.processed_dir.mkdir(exist_ok=True)
        self.processing = set()

    def on_created(self, event):
        if event.is_directory:
            return

        file_path = Path(event.src_path)

        # Skip files in processed folder
        if "processed" in str(file_path):
            return

        # Skip unsupported files
        suffix = file_path.suffix.lower()
        if suffix not in SUPPORTED_EXTENSIONS:
            return

        # Skip if already processing
        if str(file_path) in self.processing:
            return

        # Wait for file to finish writing
        self._wait_for_file_complete(file_path)
        self._process_file(file_path)

    def _wait_for_file_complete(self, file_path: Path, timeout: int = 30):
        """Wait for file to finish writing."""
        last_size = -1
        stable_count = 0
        start = time.time()

        while time.time() - start < timeout:
            try:
                current_size = file_path.stat().st_size
                if current_size == last_size and current_size > 0:
                    stable_count += 1
                    if stable_count >= 2:
                        return
                else:
                    stable_count = 0
                last_size = current_size
            except FileNotFoundError:
                return
            time.sleep(1)

    def _process_file(self, file_path: Path):
        """Process a Granola export and move to processed folder."""
        self.processing.add(str(file_path))

        try:
            print(f"\n📄 New Granola export: {file_path.name}")
            result = process_granola_file(file_path, self.org_id)

            if result:
                print(f"✅ Imported: {result['title']}")
                print(f"   Note ID: {result['note_id']}")
                print(f"   Action Items: {result['action_items_count']}")

                # Move to processed folder
                dest = self.processed_dir / file_path.name
                shutil.move(str(file_path), str(dest))
                print(f"   Moved to: processed/")
            else:
                print(f"⚠️  Skipped (unsupported format)")

        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            self.processing.discard(str(file_path))

    def process_existing_files(self):
        """Process any existing files in the watch directory."""
        print(f"\n🔍 Checking for existing files...")

        for file_path in self.watch_dir.iterdir():
            if file_path.is_file() and not file_path.name.startswith('.'):
                suffix = file_path.suffix.lower()
                if suffix in SUPPORTED_EXTENSIONS:
                    self._process_file(file_path)


def start_watcher(org_id: str, watch_dir: str):
    """Start the Granola folder watcher."""
    watch_path = Path(watch_dir)
    watch_path.mkdir(parents=True, exist_ok=True)

    print("=" * 50)
    print("  Granola → Village Hub Auto-Import")
    print("=" * 50)
    print(f"\n📂 Watching: {watch_path}")
    print(f"📝 Formats:  {', '.join(SUPPORTED_EXTENSIONS)}")
    print(f"\nWaiting for Granola exports...")
    print("Press Ctrl+C to stop\n")

    handler = GranolaWatcher(org_id, watch_path)

    # Process any existing files first
    handler.process_existing_files()

    # Start watching
    observer = Observer()
    observer.schedule(handler, str(watch_path), recursive=False)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping...")
        observer.stop()

    observer.join()


def main():
    parser = argparse.ArgumentParser(
        description="Granola → Village Hub Auto-Import"
    )
    parser.add_argument(
        "--org-id",
        default=DEFAULT_ORG_ID,
        help="Organization ID (or set MEETING_NOTES_ORG_ID env var)"
    )
    parser.add_argument(
        "--dir",
        default=WATCH_DIR,
        help="Directory to watch (or set MEETING_NOTES_WATCH_DIR env var)"
    )

    args = parser.parse_args()

    # Validate org_id
    if not args.org_id:
        print("Error: Organization ID required")
        print("Set MEETING_NOTES_ORG_ID in your .env.local file")
        sys.exit(1)

    # Validate credentials
    try:
        get_supabase_client()
        get_openai_client()
    except ValueError as e:
        print(f"Configuration error: {e}")
        print("\nMake sure .env.local contains:")
        print("  NEXT_PUBLIC_SUPABASE_URL=...")
        print("  SUPABASE_SERVICE_ROLE_KEY=...")
        print("  OPENAI_API_KEY=...")
        print("  MEETING_NOTES_ORG_ID=...")
        sys.exit(1)

    start_watcher(args.org_id, args.dir)


if __name__ == "__main__":
    main()
