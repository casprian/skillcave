-- CRITICAL FIX: Recreate profiles table with UUID id
-- The existing bigint id cannot be cast to UUID
-- We need to start fresh with the correct schema

-- Step 1: Drop all dependent foreign keys
ALTER TABLE IF EXISTS organization_admins 
DROP CONSTRAINT IF EXISTS organization_admins_user_id_fkey;

ALTER TABLE IF EXISTS learning_submissions
DROP CONSTRAINT IF EXISTS learning_submissions_student_id_fkey;

-- Step 2: Drop the entire old profiles table (bigint id cannot be converted)
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Create new profiles table with correct UUID schema
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'student',
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  total_points INTEGER DEFAULT 0
);

-- Step 4: Restore foreign key relationships
-- For organization_admins -> profiles
ALTER TABLE IF EXISTS organization_admins
ADD CONSTRAINT organization_admins_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- For learning_submissions -> profiles (if exists)
ALTER TABLE IF EXISTS learning_submissions
ADD CONSTRAINT learning_submissions_student_id_fkey
FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Step 6: VERIFICATION - Check that id is now UUID
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Expected: id column should be 'uuid' type
