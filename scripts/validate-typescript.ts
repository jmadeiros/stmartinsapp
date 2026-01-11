/**
 * Validate TypeScript - Run type-check and count errors
 *
 * Executes: npm run type-check
 * Parses output for error count and lists error files
 *
 * Exit 0 if no errors, exit 1 if errors
 */

import { execSync } from 'child_process'
import * as path from 'path'

interface ErrorInfo {
  file: string
  line: number
  column: number
  message: string
}

function parseTypeScriptOutput(output: string): { errors: ErrorInfo[], totalCount: number } {
  const errors: ErrorInfo[] = []
  const lines = output.split('\n')

  // TypeScript error format: path/to/file.ts(line,col): error TS####: message
  // Or: path/to/file.ts:line:col - error TS####: message
  const errorRegex1 = /^(.+?)\((\d+),(\d+)\):\s*error\s+TS\d+:\s*(.+)$/
  const errorRegex2 = /^(.+?):(\d+):(\d+)\s*-\s*error\s+TS\d+:\s*(.+)$/

  for (const line of lines) {
    let match = line.match(errorRegex1) || line.match(errorRegex2)
    if (match) {
      errors.push({
        file: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        message: match[4]
      })
    }
  }

  // Try to find the error count from the summary line
  // "Found X error(s)."
  const countMatch = output.match(/Found\s+(\d+)\s+error/)
  const totalCount = countMatch ? parseInt(countMatch[1], 10) : errors.length

  return { errors, totalCount }
}

function main() {
  console.log('='.repeat(60))
  console.log('VALIDATE TYPESCRIPT')
  console.log('Running type-check and counting errors')
  console.log('='.repeat(60))
  console.log('')

  console.log('Executing: npm run type-check')
  console.log('')

  let output = ''
  let hasErrors = false

  try {
    output = execSync('npm run type-check', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
  } catch (error: any) {
    // TypeScript exits with non-zero when there are errors
    hasErrors = true
    output = error.stdout || ''
    if (error.stderr) {
      output += '\n' + error.stderr
    }
  }

  const { errors, totalCount } = parseTypeScriptOutput(output)

  if (!hasErrors && errors.length === 0) {
    console.log('No TypeScript errors found.')
    console.log('')
    console.log('='.repeat(60))
    console.log('RESULT: PASS')
    console.log('='.repeat(60))
    process.exit(0)
  }

  console.log(`Total TypeScript errors: ${totalCount}`)
  console.log('')

  if (errors.length > 0) {
    // Group by file
    const byFile = new Map<string, ErrorInfo[]>()
    for (const error of errors) {
      const existing = byFile.get(error.file) || []
      existing.push(error)
      byFile.set(error.file, existing)
    }

    console.log('Errors by file:')
    console.log('')

    for (const [file, fileErrors] of byFile) {
      const relativePath = file.startsWith('/') ? path.relative(process.cwd(), file) : file
      console.log(`  ${relativePath}: ${fileErrors.length} error(s)`)

      // Show first 3 errors per file
      const showErrors = fileErrors.slice(0, 3)
      for (const err of showErrors) {
        console.log(`    Line ${err.line}: ${err.message.substring(0, 70)}${err.message.length > 70 ? '...' : ''}`)
      }
      if (fileErrors.length > 3) {
        console.log(`    ... and ${fileErrors.length - 3} more error(s)`)
      }
      console.log('')
    }

    console.log(`Files with errors: ${byFile.size}`)
  } else {
    // If we couldn't parse errors but know there are some, show raw output
    console.log('TypeScript output:')
    console.log(output)
  }

  console.log('')
  console.log('='.repeat(60))
  console.log(`RESULT: FAIL - ${totalCount} TypeScript error(s)`)
  console.log('='.repeat(60))
  process.exit(1)
}

main()
