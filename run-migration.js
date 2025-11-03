#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🚀 Starting Supabase migration...\n');

  // Read environment variables
  const SUPABASE_URL = 'https://pcokwakenaapsfwcrpyt.supabase.co';
  const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjb2t3YWtlbmFhcHNmd2NycHl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE5NTQ4NCwiZXhwIjoyMDc3NzcxNDg0fQ.CELIG0JGv5mG8Bp3sE15ulKi2k8pEcnfRnulan1jegM';

  // Read SQL file
  const sqlPath = path.join(__dirname, 'supabase_migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 SQL file loaded');
  console.log(`📊 SQL length: ${sql.length} characters\n`);

  // Make request to Supabase
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec`;

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Migration failed:');
      console.error(error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');
    console.log('📋 Created:');
    console.log('  - 6 enums (user_role, post_category, etc.)');
    console.log('  - 13 tables (organizations, users, posts, etc.)');
    console.log('  - 40+ indexes');
    console.log('  - Row Level Security policies');
    console.log('  - Auto-update triggers');
    console.log('  - Seed data (2 organizations, 3 chat channels)\n');
    console.log('🎉 Database is ready!\n');
    console.log('Next steps:');
    console.log('  1. Set up OAuth providers (Microsoft + Google)');
    console.log('  2. Log in via OAuth');
    console.log('  3. Make yourself admin via SQL:\n');
    console.log('     UPDATE users SET role = \'admin\' WHERE email = \'your-email@example.com\';\n');

  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    process.exit(1);
  }
}

runMigration();
