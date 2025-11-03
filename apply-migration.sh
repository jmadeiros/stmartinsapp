#!/bin/bash

echo "🚀 Applying Supabase migration..."
echo ""

# Your Supabase credentials
SUPABASE_URL="https://pcokwakenaapsfwcrpyt.supabase.co"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjb2t3YWtlbmFhcHNmd2NycHl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjE5NTQ4NCwiZXhwIjoyMDc3NzcxNDg0fQ.CELIG0JGv5mG8Bp3sE15ulKi2k8pEcnfRnulan1jegM"

# Read SQL file
SQL=$(cat supabase_migration.sql)

# Execute via psql connection string (safest method)
echo "📊 Attempting to apply migration via Supabase SQL..."
echo ""
echo "⚠️  This requires Supabase CLI. If you don't have it installed:"
echo "    npm install -g supabase"
echo ""
echo "Then run:"
echo "    supabase db push --db-url 'postgresql://postgres:[YOUR-DB-PASSWORD]@db.pcokwakenaapsfwcrpyt.supabase.co:5432/postgres' --file supabase_migration.sql"
echo ""
echo "🔑 Get your database password from:"
echo "    Supabase Dashboard → Settings → Database → Connection String"
echo ""
