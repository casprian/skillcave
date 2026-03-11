-- DIAGNOSIS: Why Direct Query Works But App Returns Empty

-- Problem: 7 rows exist, but app gets []
-- Cause: RLS policies are blocking the authenticated app user

-- ====== STEP 1: Check current RLS policies ======
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'learning_submissions'
ORDER BY policyname;

-- ====== STEP 2: See if auth.uid() matches any student_id ======
SELECT 
  auth.uid() as current_auth_id,
  COUNT(DISTINCT ls.student_id) as unique_student_ids,
  COUNT(CASE WHEN ls.student_id = auth.uid() THEN 1 END) as rows_matching_auth,
  COUNT(*) as total_rows
FROM learning_submissions ls;

-- ====== STEP 3: See WHO is the student for those 7 rows ======
SELECT 
  student_id,
  COUNT(*) as submission_count
FROM learning_submissions
GROUP BY student_id;

-- ====== STEP 4: Compare student_ids with auth.users ======
SELECT 
  ls.student_id,
  au.email,
  au.id as auth_id,
  COUNT(ls.id) as submission_count,
  CASE 
    WHEN ls.student_id = au.id THEN 'MATCH ✓'
    ELSE 'MISMATCH ✗'
  END as match_status
FROM learning_submissions ls
LEFT JOIN auth.users au ON ls.student_id = au.id
GROUP BY ls.student_id, au.email, au.id;

-- ====== STEP 5: Test RLS policy logic directly ======
-- This simulates what the RLS policy is checking
SELECT 
  id,
  student_id,
  title,
  (student_id = auth.uid()) as passes_rls_check
FROM learning_submissions;

-- ====== STEP 6: What user is authenticated in the app? ======
-- Run this in the app console to see:
-- console.log('Authenticated user:', user);
-- console.log('Auth ID:', user?.id);

-- Then run this query with that ID:
SELECT id, title, student_id FROM learning_submissions 
WHERE student_id = 'PASTE_APP_USER_ID_HERE';
