-- TEMPORARY: Disable RLS for organizations tables (Development)
-- This is a workaround for type mismatch issues during development
-- In production, re-enable RLS and use proper type casting

ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_admins DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'organization_admins')
AND schemaname = 'public';
