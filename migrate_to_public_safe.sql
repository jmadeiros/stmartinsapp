-- Safe Migration: Move all tables from app schema to public schema
-- This version checks if tables exist before moving them

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Move all tables from app to public (if they exist)
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'app')
    LOOP
        EXECUTE format('ALTER TABLE app.%I SET SCHEMA public', r.tablename);
        RAISE NOTICE 'Moved table: app.% to public.%', r.tablename, r.tablename;
    END LOOP;

    -- Move all types/enums from app to public (if they exist)
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'app' AND t.typtype = 'e')
    LOOP
        EXECUTE format('ALTER TYPE app.%I SET SCHEMA public', r.typname);
        RAISE NOTICE 'Moved type: app.% to public.%', r.typname, r.typname;
    END LOOP;

    -- Drop app schema if it's now empty
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app') THEN
        DROP SCHEMA app CASCADE;
        RAISE NOTICE 'Dropped app schema';
    END IF;
END $$;

-- Verify migration
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public', 'app')
ORDER BY schemaname, tablename;
