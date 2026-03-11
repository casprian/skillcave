-- 1. Check all tutors and their auth_id
SELECT 
  id,
  auth_id,
  email,
  name,
  role,
  auth_id IS NULL as "auth_id_is_null"
FROM profiles
WHERE role = 'tutor'
LIMIT 10;

-- 2. Check the current RLS policies
SELECT 
  policyname,
  cmd,
  SUBSTRING(qual FROM 1 FOR 200) as policy_condition
FROM pg_policies
WHERE tablename = 'learning_submissions' AND policyname LIKE '%tutor%'
ORDER BY policyname;

-- 3. Check learning_submissions data
SELECT 
  id,
  title,
  status,
  submission_type,
  submitted_to_tutor,
  student_id
FROM learning_submissions
LIMIT 10;

-- 4. Test the policy logic manually - what tutor CAN see
-- (Replace UUID with actual tutor auth_id from first query)
SELECT 
  id,
  title,
  status,
  submission_type,
  submitted_to_tutor,
  student_id
FROM learning_submissions
WHERE (
  submitted_to_tutor = 'REPLACE_WITH_TUTOR_UUID'
  OR
  (submission_type = 'open' AND status = 'pending' AND submitted_to_tutor IS NULL)
);

-- 5. Verify tutor profile with current user session
-- Run as authenticated tutor user to see who they are
SELECT 
  auth.uid() as current_user_uuid,
  (SELECT COUNT(*) FROM profiles WHERE auth_id = auth.uid()) as profile_count,
  (SELECT role FROM profiles WHERE auth_id = auth.uid()) as user_role;
