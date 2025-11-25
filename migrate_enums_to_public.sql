-- Migration: Move only enums/types from app schema to public schema
-- Tables are already in public schema, only enums need to be moved

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Move all types/enums from app to public
    FOR r IN (
        SELECT t.typname
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE n.nspname = 'app' AND t.typtype = 'e'
    )
    LOOP
        BEGIN
            EXECUTE format('ALTER TYPE app.%I SET SCHEMA public', r.typname);
            RAISE NOTICE 'Moved type: app.% to public.%', r.typname, r.typname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to move type app.%: %', r.typname, SQLERRM;
        END;
    END LOOP;

    -- Drop app schema if it's now empty
    IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'app') THEN
        BEGIN
            DROP SCHEMA app CASCADE;
            RAISE NOTICE 'Dropped app schema';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop app schema: %', SQLERRM;
        END;
    END IF;
END $$;

-- Verify migration - should show all enums in public schema
SELECT
    'TYPE' as object_type,
    n.nspname as schemaname,
    t.typname as object_name
FROM pg_type t
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname IN ('public', 'app') AND t.typtype = 'e'
ORDER BY n.nspname, t.typname;
