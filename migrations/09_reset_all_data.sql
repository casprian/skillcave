-- RESET ALL DATA
-- This script deletes all data from all tables while preserving the schema
-- Use this in development/testing to start fresh
-- WARNING: This is destructive and cannot be undone!

-- Step 1: Delete data in correct order (respecting foreign keys)
-- Delete from leaf tables first (those with no dependencies), then work up to root tables

-- Delete from core tables
DELETE FROM attendance;
DELETE FROM learning_submissions;
DELETE FROM organization_admins;
DELETE FROM profiles;
DELETE FROM organizations;

-- Step 2: Verify - count records in core tables
SELECT 
  'organizations' as table_name, COUNT(*) as record_count FROM organizations
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'organization_admins', COUNT(*) FROM organization_admins
UNION ALL
SELECT 'learning_submissions', COUNT(*) FROM learning_submissions
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
ORDER BY table_name;

-- Expected result: All tables should show 0 records
