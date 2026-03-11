-- Emergency fix: Disable RLS temporarily to diagnose
-- Run ONLY in Supabase if you need to debug

-- Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('learning_submissions', 'profiles', 'monthly_leaderboards');

-- If RLS is causing issues, temporarily disable it for testing
-- ALTER TABLE learning_submissions DISABLE ROW LEVEL SECURITY;

-- Then run your query
-- SELECT * FROM learning_submissions;

-- After testing, re-enable it
-- ALTER TABLE learning_submissions ENABLE ROW LEVEL SECURITY;

-- ===== ACTUAL DIAGNOSTIC STEPS =====

-- STEP 1: Check if table has ANY data
SELECT COUNT(*) as total_count FROM learning_submissions;

-- STEP 2: If count > 0, check what's in it
SELECT 
  id, 
  student_id, 
  title, 
  status, 
  submitted_at,
  submission_type
FROM learning_submissions 
LIMIT 10;

-- STEP 3: Get your auth user ID
SELECT 
  u.id,
  u.email,
  p.id as profile_id,
  p.email as profile_email,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.email = p.email
WHERE u.email IS NOT NULL
LIMIT 5;

-- STEP 4: Check if YOUR submissions exist
-- Replace 'YOUR_AUTH_UUID' with the UUID from STEP 3
SELECT id, title, status 
FROM learning_submissions 
WHERE student_id = 'YOUR_AUTH_UUID';

-- STEP 5: Verify RLS policy is correct
SELECT 
  policyname,
  permissive,
  qual as policy_condition
FROM pg_policies
WHERE tablename = 'learning_submissions' 
AND cmd = 'SELECT';

-- STEP 6: Drop and recreate RLS policy to ensure it's correct
DROP POLICY IF EXISTS "students_view_own_submissions" ON learning_submissions;
CREATE POLICY "students_view_own_submissions"
ON learning_submissions FOR SELECT
USING (student_id = auth.uid());

-- STEP 7: Test the query again as authenticated user
SELECT id, title, status FROM learning_submissions 
WHERE student_id = auth.uid()
ORDER BY submitted_at DESC;
