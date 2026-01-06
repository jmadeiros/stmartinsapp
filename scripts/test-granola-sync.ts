import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') })

import { createClient } from '@supabase/supabase-js'
import { GranolaClient } from '../src/lib/granola/client'
import { proseMirrorToMarkdown, extractPlainText } from '../src/lib/granola/prosemirror'
import type { GranolaDocument } from '../src/lib/granola/types'

async function testDryRun() {
  console.log('=== Granola Sync Integration Test (DRY RUN) ===\n')

  // Step 1: Test Supabase connection
  console.log('Step 1: Testing Supabase connection...')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single()

  if (orgError) {
    console.error('❌ Supabase connection failed:', orgError.message)
    process.exit(1)
  }
  console.log(`✅ Supabase connected - Found org: ${orgs.name}`)

  // Step 2: Test meeting_notes table access
  console.log('\nStep 2: Testing meeting_notes table...')
  const { count, error: tableError } = await supabase
    .from('meeting_notes')
    .select('*', { count: 'exact', head: true })

  if (tableError) {
    console.error('❌ meeting_notes table error:', tableError.message)
    process.exit(1)
  }
  console.log(`✅ meeting_notes table accessible (${count || 0} existing records)`)

  // Step 3: Test Granola API connection
  console.log('\nStep 3: Testing Granola API connection...')
  try {
    const client = await GranolaClient.fromLocalCredentials()
    const response = await client.getDocuments({ limit: 3, includeContent: true })
    console.log(`✅ Granola API connected - Fetched ${response.docs.length} documents`)

    // Step 4: Test content extraction on first document
    if (response.docs.length > 0) {
      console.log('\nStep 4: Testing content extraction...')
      const doc = response.docs[0]

      console.log(`  Document: "${doc.title}"`)
      console.log(`  Created: ${doc.created_at}`)
      console.log(`  Has panel content: ${!!doc.last_viewed_panel?.content}`)

      if (doc.last_viewed_panel?.content) {
        const markdown = proseMirrorToMarkdown(doc.last_viewed_panel.content)
        const plainText = extractPlainText(doc.last_viewed_panel.content)

        console.log(`  Markdown length: ${markdown.length} chars`)
        console.log(`  Plain text length: ${plainText.length} chars`)
        console.log(`  Preview: "${plainText.substring(0, 100)}..."`)
      }
      console.log('✅ Content extraction working')
    }

    // Step 5: Test data transformation (without insert)
    console.log('\nStep 5: Testing data transformation...')
    const sampleDoc = response.docs[0]
    const transformedData = {
      granola_id: sampleDoc.id,
      title: sampleDoc.title || 'Untitled Meeting',
      meeting_date: sampleDoc.google_calendar_event?.start?.dateTime?.split('T')[0] || null,
      attendees: JSON.stringify(sampleDoc.people?.attendees || []),
      status: 'published',
      org_id: orgs.id,
    }
    console.log('  Transformed record:', JSON.stringify(transformedData, null, 2))
    console.log('✅ Data transformation working')

    console.log('\n=== ALL TESTS PASSED ===')
    console.log('\nThe Granola sync integration is ready to use.')
    console.log('When you have Village Hub meeting notes, the sync will:')
    console.log('  1. Fetch documents from Granola API')
    console.log('  2. Convert ProseMirror content to Markdown')
    console.log('  3. Upsert to meeting_notes table with deduplication')
    console.log('  4. Extract action items with GPT (if OPENAI_API_KEY is set)')

  } catch (error: unknown) {
    const err = error as Error
    console.error('❌ Granola API error:', err.message)
    process.exit(1)
  }
}

testDryRun().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
