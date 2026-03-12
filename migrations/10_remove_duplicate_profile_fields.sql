-- Remove duplicated email and name from profiles table
-- These fields are already in auth.users and should be accessed via JOIN

-- Step 1: Drop dependent foreign key constraints
ALTER TABLE IF EXISTS organization_admins 
DROP CONSTRAINT IF EXISTS organization_admins_user_id_fkey;

ALTER TABLE IF EXISTS learning_submissions 
DROP CONSTRAINT IF EXISTS learning_submissions_student_id_fkey;

-- Step 2: Remove duplicated columns from profiles
ALTER TABLE IF EXISTS profiles 
DROP COLUMN IF EXISTS email;

ALTER TABLE IF EXISTS profiles 
DROP COLUMN IF EXISTS name;

-- Step 3: Re-add foreign key constraints
ALTER TABLE IF EXISTS organization_admins
ADD CONSTRAINT organization_admins_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS learning_submissions
ADD CONSTRAINT learning_submissions_student_id_fkey
FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 4: Verify profiles table structure
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Expected columns: id, role, organization_id, enrolled_at, created_at, updated_at, total_points
-- (NO email, NO name)
