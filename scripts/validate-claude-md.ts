/**
 * Validate CLAUDE.md - Verify documentation accuracy against database types
 *
 * Parses /CLAUDE.md for table references and checks if they exist in database.types.ts
 * Also checks for incorrect schema references (should use public schema, no .schema('app'))
 *
 * Exit 0 if accurate, exit 1 if issues found
 */

import * as fs from 'fs'
import * as path from 'path'

interface Issue {
  type: 'table_not_found' | 'wrong_table_name' | 'wrong_schema' | 'outdated_reference'
  description: string
  line?: number
  suggestion?: string
}

// Known table name mappings (old name -> correct name)
const TABLE_NAME_CORRECTIONS: Record<string, string> = {
  'profiles': 'user_profiles',
  'organization_members': 'user_memberships',
  'chat_rooms': 'conversations',  // if this mapping exists
  'chat_messages': 'messages',    // if this mapping exists
}

function extractTableNames(databaseTypesContent: string): Set<string> {
  const tables = new Set<string>()

  // Match table definitions in the public schema
  const tableRegex = /public:\s*\{[\s\S]*?Tables:\s*\{([\s\S]*?)\n\s*\}\s*Views:/
  const match = databaseTypesContent.match(tableRegex)

  if (match) {
    // Find all table names (they appear as keys before the first {)
    const tableBlockRegex = /^\s+(\w+):\s*\{/gm
    let tableMatch
    while ((tableMatch = tableBlockRegex.exec(databaseTypesContent)) !== null) {
      // Only include if it's a real table (has Row, Insert, Update)
      const tableName = tableMatch[1]
      if (tableName !== 'Tables' && tableName !== 'Views' && tableName !== 'Functions' &&
          tableName !== 'Enums' && tableName !== 'CompositeTypes' && tableName !== 'Row' &&
          tableName !== 'Insert' && tableName !== 'Update' && tableName !== 'Relationships' &&
          tableName !== 'Args' && tableName !== 'Returns' && tableName !== 'graphql_public' &&
          tableName !== 'public' && tableName !== '__InternalSupabase') {
        tables.add(tableName)
      }
    }
  }

  return tables
}

function extractViewNames(databaseTypesContent: string): Set<string> {
  const views = new Set<string>()

  // Look for views section
  const viewsRegex = /Views:\s*\{([\s\S]*?)\}\s*Functions:/
  const match = databaseTypesContent.match(viewsRegex)

  if (match) {
    const viewBlockRegex = /^\s{6}(\w+):\s*\{/gm
    let viewMatch
    while ((viewMatch = viewBlockRegex.exec(match[1])) !== null) {
      views.add(viewMatch[1])
    }
  }

  return views
}

function checkClaudeMd(claudeMdContent: string, tables: Set<string>, views: Set<string>): Issue[] {
  const issues: Issue[] = []
  const lines = claudeMdContent.split('\n')

  lines.forEach((line, index) => {
    const lineNum = index + 1

    // Check for .schema('app') references - should not be used
    if (line.includes(".schema('app')") || line.includes('.schema("app")')) {
      issues.push({
        type: 'wrong_schema',
        description: `Line ${lineNum}: Uses .schema('app') but project uses public schema`,
        line: lineNum,
        suggestion: 'Remove .schema() call - use default public schema'
      })
    }

    // Check for old table name references
    for (const [oldName, correctName] of Object.entries(TABLE_NAME_CORRECTIONS)) {
      // Look for table references in code blocks or queries
      const patterns = [
        new RegExp(`\\.from\\(['"]${oldName}['"]\\)`, 'g'),
        new RegExp(`from\\s+${oldName}[^_]`, 'g'),
        new RegExp(`\\['${oldName}'\\]`, 'g'),
        new RegExp(`- \`${oldName}\``, 'g'),
        new RegExp(`\\b${oldName}\\b.*table`, 'gi'),
      ]

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          // Check if the correct table actually exists
          if (tables.has(correctName)) {
            issues.push({
              type: 'wrong_table_name',
              description: `Line ${lineNum}: References '${oldName}' but should be '${correctName}'`,
              line: lineNum,
              suggestion: `Change '${oldName}' to '${correctName}'`
            })
          }
          break
        }
      }
    }

    // Check for table references that don't exist
    const fromPattern = /\.from\(['"](\w+)['"]\)/g
    let match
    while ((match = fromPattern.exec(line)) !== null) {
      const tableName = match[1]
      if (!tables.has(tableName) && !views.has(tableName)) {
        // Check if it's an old name
        if (!TABLE_NAME_CORRECTIONS[tableName]) {
          issues.push({
            type: 'table_not_found',
            description: `Line ${lineNum}: References table '${tableName}' which doesn't exist`,
            line: lineNum,
            suggestion: `Verify table name exists in database.types.ts`
          })
        }
      }
    }
  })

  return issues
}

function main() {
  console.log('='.repeat(60))
  console.log('VALIDATE CLAUDE.MD')
  console.log('Checking documentation accuracy against database types')
  console.log('='.repeat(60))
  console.log('')

  const claudeMdPath = path.join(process.cwd(), 'CLAUDE.md')
  const databaseTypesPath = path.join(process.cwd(), 'src', 'lib', 'database.types.ts')

  // Check files exist
  if (!fs.existsSync(claudeMdPath)) {
    console.error('Error: CLAUDE.md not found')
    process.exit(1)
  }

  if (!fs.existsSync(databaseTypesPath)) {
    console.error('Error: src/lib/database.types.ts not found')
    process.exit(1)
  }

  // Read files
  const claudeMdContent = fs.readFileSync(claudeMdPath, 'utf-8')
  const databaseTypesContent = fs.readFileSync(databaseTypesPath, 'utf-8')

  console.log('Extracting table and view names from database.types.ts...')

  // Extract actual table names from database.types.ts
  const tables = extractTableNames(databaseTypesContent)
  const views = extractViewNames(databaseTypesContent)

  console.log(`Found ${tables.size} tables and ${views.size} views`)
  console.log('')
  console.log('Tables:', Array.from(tables).sort().join(', '))
  console.log('')
  console.log('Views:', Array.from(views).sort().join(', '))
  console.log('')

  // Check CLAUDE.md
  console.log('Checking CLAUDE.md for accuracy...')
  console.log('')

  const issues = checkClaudeMd(claudeMdContent, tables, views)

  if (issues.length === 0) {
    console.log('No inaccuracies found.')
    console.log('')
    console.log('='.repeat(60))
    console.log('RESULT: PASS')
    console.log('='.repeat(60))
    process.exit(0)
  }

  console.log(`Found ${issues.length} issue(s):`)
  console.log('')

  for (const issue of issues) {
    console.log(`  [${issue.type.toUpperCase()}] ${issue.description}`)
    if (issue.suggestion) {
      console.log(`    Suggestion: ${issue.suggestion}`)
    }
    console.log('')
  }

  console.log('='.repeat(60))
  console.log('RESULT: FAIL - Documentation inaccuracies found')
  console.log('='.repeat(60))
  process.exit(1)
}

main()
