-- Diagnostic query to see what's actually in the app schema
-- Run this in Supabase SQL Editor to see all tables and types

-- List all tables in app schema
SELECT
    'TABLE' as object_type,
    schemaname,
    tablename as object_name
FROM pg_tables
WHERE schemaname = 'app'
ORDER BY tablename;

-- List all types/enums in app schema
SELECT
    'TYPE' as object_type,
    n.nspname as schemaname,
    t.typname as object_name
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'app' AND t.typtype = 'e'
ORDER BY t.typname;

-- Also check public schema to see what's there
SELECT
    'TABLE (public)' as object_type,
    schemaname,
    tablename as object_name
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
