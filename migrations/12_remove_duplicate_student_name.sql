-- Remove duplicated student_name from assignments table
-- This name should be fetched from auth.users via the student_id foreign key

-- Step 1: Remove the student_name column
ALTER TABLE IF EXISTS assignments 
DROP COLUMN IF EXISTS student_name;

-- Step 2: Verify assignments table structure
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'assignments' 
ORDER BY ordinal_position;

-- Expected columns: id, student_id, title, description, status, tutor_comments, reviewed_at, reviewed_by, created_at, updated_at
-- (NO student_name)
