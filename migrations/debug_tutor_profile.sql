-- Debug: Check if tutor profile exists
SELECT 
  id,
  auth_id,
  email,
  name,
  role,
  'Profile ID type: ' || pg_typeof(id) as id_type,
  'Auth ID type: ' || pg_typeof(auth_id) as auth_id_type
FROM profiles
WHERE role = 'tutor'
LIMIT 5;

-- Debug: Check auth users
SELECT 
  id,
  email,
  'Auth ID type: ' || pg_typeof(id) as id_type
FROM auth.users
LIMIT 5;

-- Debug: Check learning_submissions
SELECT 
  id,
  title,
  student_id,
  submitted_to_tutor,
  status,
  submission_type,
  'student_id type: ' || pg_typeof(student_id) as student_id_type,
  'submitted_to_tutor type: ' || pg_typeof(submitted_to_tutor) as submitted_to_tutor_type
FROM learning_submissions
LIMIT 5;

-- Debug: Check RLS policies on learning_submissions
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'learning_submissions'
ORDER BY policyname;
