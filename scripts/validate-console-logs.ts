/**
 * Validate Console Logs - Find placeholder console.log statements
 *
 * Searches src/ for console.log statements that appear to be placeholders
 * (e.g., console.log("Edit post"), console.log("Navigate to"), console.log("Share"))
 *
 * Excludes console.error and console.warn as those are legitimate logging.
 *
 * Exit 0 if no placeholder logs found, exit 1 if found
 */

import * as fs from 'fs'
import * as path from 'path'

interface PlaceholderLog {
  file: string
  line: number
  content: string
}

// Patterns that indicate placeholder console.logs
const PLACEHOLDER_PATTERNS = [
  /console\.log\s*\(\s*["']Edit/i,
  /console\.log\s*\(\s*["']Navigate/i,
  /console\.log\s*\(\s*["']Share/i,
  /console\.log\s*\(\s*["']Delete/i,
  /console\.log\s*\(\s*["']Save/i,
  /console\.log\s*\(\s*["']Submit/i,
  /console\.log\s*\(\s*["']Click/i,
  /console\.log\s*\(\s*["']Open/i,
  /console\.log\s*\(\s*["']Close/i,
  /console\.log\s*\(\s*["']Handle/i,
  /console\.log\s*\(\s*["']TODO/i,
  /console\.log\s*\(\s*["']FIXME/i,
  /console\.log\s*\(\s*["']TEST/i,
  /console\.log\s*\(\s*["']Debug/i,
]

function getAllTsFiles(dir: string): string[] {
  const files: string[] = []

  function walkDir(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walkDir(fullPath)
        }
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        files.push(fullPath)
      }
    }
  }

  walkDir(dir)
  return files
}

function findPlaceholderLogs(filePath: string): PlaceholderLog[] {
  const results: PlaceholderLog[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    // Skip lines that are comments
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*')) {
      return
    }

    // Check for placeholder patterns
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(line)) {
        results.push({
          file: filePath,
          line: index + 1,
          content: trimmedLine
        })
        break // Only report once per line
      }
    }
  })

  return results
}

function main() {
  console.log('='.repeat(60))
  console.log('VALIDATE CONSOLE LOGS')
  console.log('Finding placeholder console.log statements in src/')
  console.log('='.repeat(60))
  console.log('')

  const srcDir = path.join(process.cwd(), 'src')

  if (!fs.existsSync(srcDir)) {
    console.error('Error: src/ directory not found')
    process.exit(1)
  }

  const files = getAllTsFiles(srcDir)
  console.log(`Scanning ${files.length} TypeScript files...`)
  console.log('')

  const allPlaceholders: PlaceholderLog[] = []

  for (const file of files) {
    const placeholders = findPlaceholderLogs(file)
    allPlaceholders.push(...placeholders)
  }

  if (allPlaceholders.length === 0) {
    console.log('No placeholder console.log statements found.')
    console.log('')
    console.log('='.repeat(60))
    console.log('RESULT: PASS')
    console.log('='.repeat(60))
    process.exit(0)
  }

  console.log(`Found ${allPlaceholders.length} placeholder console.log statement(s):`)
  console.log('')

  // Group by file
  const byFile = new Map<string, PlaceholderLog[]>()
  for (const log of allPlaceholders) {
    const existing = byFile.get(log.file) || []
    existing.push(log)
    byFile.set(log.file, existing)
  }

  for (const [file, logs] of byFile) {
    const relativePath = path.relative(process.cwd(), file)
    console.log(`  ${relativePath}:`)
    for (const log of logs) {
      console.log(`    Line ${log.line}: ${log.content.substring(0, 80)}${log.content.length > 80 ? '...' : ''}`)
    }
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('RESULT: FAIL - Placeholder console.logs found')
  console.log('='.repeat(60))
  process.exit(1)
}

main()
