-- Count and list all tables/views in public schema
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_type IN ('BASE TABLE', 'VIEW')
ORDER BY table_type, table_name;
