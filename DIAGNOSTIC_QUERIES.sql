-- Temporary diagnostic queries to check learning_submissions table
-- Run these in Supabase SQL Editor to diagnose the empty data issue

-- Query 1: Check if table exists and has data
SELECT 
  COUNT(*) as total_submissions,
  COUNT(DISTINCT student_id) as unique_students
FROM learning_submissions;

-- Query 2: Show ALL submissions (ignore RLS for diagnosis)
SELECT id, student_id, title, status, submitted_at FROM learning_submissions;

-- Query 3: Check student IDs - do they exist in auth.users?
SELECT 
  ls.student_id,
  au.id as auth_id,
  au.email,
  COUNT(ls.id) as submission_count
FROM learning_submissions ls
LEFT JOIN auth.users au ON ls.student_id = au.id
GROUP BY ls.student_id, au.id, au.email;

-- Query 4: Check RLS policy status
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'learning_submissions';

-- Query 5: List current RLS policies
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies WHERE tablename = 'learning_submissions';

-- Query 6: Check if you can see YOUR submissions as authenticated user
SELECT id, title, status FROM learning_submissions 
WHERE student_id = auth.uid();

-- Query 7: Check auth.uid() returns valid value
SELECT auth.uid() as current_user_id;

-- Query 8: What's in profiles table?
SELECT id, email, role FROM profiles WHERE role = 'student' LIMIT 5;

-- Query 9: Try querying WITHOUT RLS (direct table access)
-- This will only work if you're admin/superuser
SELECT COUNT(*) FROM public.learning_submissions;

-- Query 10: Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'learning_submissions' 
ORDER BY ordinal_position;
