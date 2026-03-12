-- CRITICAL: Disable RLS on profiles table
-- Run this in Supabase SQL Editor to fix profile fetching errors

-- Disable RLS on profiles table
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;

-- Verify profiles RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- Disable RLS on organizations table
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organization_admins table  
ALTER TABLE IF EXISTS organization_admins DISABLE ROW LEVEL SECURITY;

-- Verify all are disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'organizations', 'organization_admins')
AND schemaname = 'public';
