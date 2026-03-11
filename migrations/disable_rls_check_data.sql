-- Step 1: Disable RLS completely to see raw data
ALTER TABLE learning_submissions DISABLE ROW LEVEL SECURITY;

-- Step 2: Check what submissions exist
SELECT 
  COUNT(*) as total_submissions
FROM learning_submissions;

-- Step 3: Show all submissions
SELECT 
  id,
  title,
  status,
  submission_type,
  submitted_to_tutor,
  student_id
FROM learning_submissions
LIMIT 20;

-- Step 4: Show tutors
SELECT 
  id,
  auth_id,
  name,
  role
FROM profiles
WHERE role = 'tutor'
LIMIT 5;
