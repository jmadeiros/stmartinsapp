/**
 * Validate As Any - Count `as any` casts in the codebase
 *
 * Searches all .ts/.tsx files in src/ for occurrences of `as any`
 * Groups by file with counts
 *
 * Exit 0 always (informational only)
 */

import * as fs from 'fs'
import * as path from 'path'

interface AsAnyOccurrence {
  file: string
  line: number
  content: string
}

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

function findAsAnyCasts(filePath: string): AsAnyOccurrence[] {
  const results: AsAnyOccurrence[] = []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  // Pattern to match `as any` - be careful not to match `as anything_else`
  const asAnyPattern = /\bas\s+any\b/g

  lines.forEach((line, index) => {
    // Skip lines that are comments
    const trimmedLine = line.trim()
    if (trimmedLine.startsWith('//') || trimmedLine.startsWith('*') || trimmedLine.startsWith('/*')) {
      return
    }

    // Find all occurrences in the line
    let match
    while ((match = asAnyPattern.exec(line)) !== null) {
      results.push({
        file: filePath,
        line: index + 1,
        content: trimmedLine
      })
    }
    // Reset regex lastIndex for next line
    asAnyPattern.lastIndex = 0
  })

  return results
}

function main() {
  console.log('='.repeat(60))
  console.log('VALIDATE AS ANY')
  console.log('Counting `as any` casts in src/')
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

  const allOccurrences: AsAnyOccurrence[] = []

  for (const file of files) {
    const occurrences = findAsAnyCasts(file)
    allOccurrences.push(...occurrences)
  }

  console.log(`Total \`as any\` casts found: ${allOccurrences.length}`)
  console.log('')

  if (allOccurrences.length === 0) {
    console.log('No `as any` casts found - excellent type safety!')
    console.log('')
    console.log('='.repeat(60))
    console.log('RESULT: INFORMATIONAL - 0 casts')
    console.log('='.repeat(60))
    process.exit(0)
  }

  // Group by file
  const byFile = new Map<string, AsAnyOccurrence[]>()
  for (const occurrence of allOccurrences) {
    const existing = byFile.get(occurrence.file) || []
    existing.push(occurrence)
    byFile.set(occurrence.file, existing)
  }

  // Sort files by count (descending)
  const sortedFiles = Array.from(byFile.entries()).sort((a, b) => b[1].length - a[1].length)

  console.log('Breakdown by file:')
  console.log('')

  for (const [file, occurrences] of sortedFiles) {
    const relativePath = path.relative(process.cwd(), file)
    console.log(`  ${relativePath}: ${occurrences.length}`)
  }

  console.log('')

  // Show top offenders with details
  const topOffenders = sortedFiles.slice(0, 5)
  if (topOffenders.length > 0) {
    console.log('Top files with `as any` (details):')
    console.log('')

    for (const [file, occurrences] of topOffenders) {
      const relativePath = path.relative(process.cwd(), file)
      console.log(`  ${relativePath}:`)

      // Show first 3 occurrences
      const showOccurrences = occurrences.slice(0, 3)
      for (const occ of showOccurrences) {
        const preview = occ.content.substring(0, 60)
        console.log(`    Line ${occ.line}: ${preview}${occ.content.length > 60 ? '...' : ''}`)
      }
      if (occurrences.length > 3) {
        console.log(`    ... and ${occurrences.length - 3} more`)
      }
      console.log('')
    }
  }

  console.log('='.repeat(60))
  console.log(`RESULT: INFORMATIONAL - ${allOccurrences.length} total casts in ${byFile.size} files`)
  console.log('='.repeat(60))
  console.log('')
  console.log('Note: While `as any` bypasses type checking, it is sometimes')
  console.log('necessary for complex types or third-party library integrations.')
  console.log('Review each usage to ensure it is justified.')

  // Always exit 0 - this is informational only
  process.exit(0)
}

main()
