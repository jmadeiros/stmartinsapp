#!/bin/bash

# Apply RLS fix migration to Supabase database

echo "Applying RLS fix for notifications table..."

# Read the SQL file
SQL_FILE="supabase/migrations/20251212_fix_notifications_rls.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Error: Migration file not found: $SQL_FILE"
  exit 1
fi

# Get the database URL from environment
source .env.local

# Extract connection details from Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | grep -oP 'https://\K[^.]+')
DB_HOST="db.${PROJECT_ID}.supabase.co"

echo "Connecting to: $DB_HOST"
echo ""

# Execute the SQL using psql
# You'll need to enter the database password when prompted
PGPASSWORD="" psql \
  -h "$DB_HOST" \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ RLS policies applied successfully!"
  echo ""
  echo "You can now test comment notifications:"
  echo "1. Login as Sarah and create a post"
  echo "2. Login as James and add a comment"
  echo "3. Login back as Sarah - you should see a notification!"
else
  echo ""
  echo "❌ Failed to apply migration"
  echo ""
  echo "Alternative: Copy and paste the SQL directly in Supabase Dashboard:"
  echo "https://supabase.com/dashboard/project/$PROJECT_ID/sql/new"
fi
