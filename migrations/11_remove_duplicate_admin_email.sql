-- Remove duplicated admin_email from organizations table
-- This email should be fetched from auth.users via the created_by foreign key

-- Step 1: Remove the admin_email column
ALTER TABLE IF EXISTS organizations 
DROP COLUMN IF EXISTS admin_email;

-- Step 2: Verify organizations table structure
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
ORDER BY ordinal_position;

-- Expected columns: id, name, description, created_by, created_at, updated_at, settings, is_active, organization_code
-- (NO admin_email)
