#!/usr/bin/env tsx

/**
 * Check foreign keys on messages table
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkForeignKeys() {
  console.log('🔍 Checking Foreign Keys on messages Table')
  console.log('='.repeat(60))
  console.log()

  // Query pg_constraint to get foreign keys
  const { data: fks, error } = await supabase.rpc('run_sql', {
    query: `
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confrelid::regclass AS foreign_table_name,
        af.attname AS foreign_column_name
      FROM pg_constraint
      JOIN pg_attribute a ON a.attnum = ANY(conkey) AND a.attrelid = conrelid
      JOIN pg_attribute af ON af.attnum = ANY(confkey) AND af.attrelid = confrelid
      WHERE contype = 'f'
        AND conrelid = 'messages'::regclass
      ORDER BY conname;
    `
  })

  if (error) {
    console.error('❌ Error:', error.message)
    console.log()
    console.log('Trying alternative query...')

    // Try a simpler query
    const result = await supabase.rpc('run_sql', {
      query: `
        SELECT
          conname,
          pg_get_constraintdef(oid) as definition
        FROM pg_constraint
        WHERE conrelid = 'messages'::regclass
          AND contype = 'f';
      `
    })

    if (result.error) {
      console.error('❌ Alternative query also failed:', result.error.message)
    } else {
      console.log('Foreign Keys:', JSON.stringify(result.data, null, 2))
    }
  } else {
    console.log('Foreign Keys:', JSON.stringify(fks, null, 2))
  }
}

checkForeignKeys().catch(console.error)
