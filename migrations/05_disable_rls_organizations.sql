-- URGENT: Disable RLS for development
-- Run this in Supabase SQL Editor immediately to fix type casting errors

-- Disable RLS on organizations table
ALTER TABLE IF EXISTS organizations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on organization_admins table  
ALTER TABLE IF EXISTS organization_admins DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('organizations', 'organization_admins')
AND schemaname = 'public';

-- Tables are now accessible to authenticated users
-- This allows organization creation and admin profile setup to work
-- IMPORTANT: Re-enable and harden RLS policies before production deployment
