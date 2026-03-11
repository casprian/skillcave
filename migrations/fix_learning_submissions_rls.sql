-- Fix learning_submissions RLS policy to ensure proper UUID type handling
-- This migration improves the SELECT policy with explicit type casting

-- Drop and recreate the policy with type safety
DROP POLICY IF EXISTS "students_view_own_submissions" ON learning_submissions;
CREATE POLICY "students_view_own_submissions"
ON learning_submissions FOR SELECT
USING (auth.uid()::text = student_id::text);

-- Re-apply the tutors policy with consistent type casting
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
CREATE POLICY "tutors_view_submissions"
ON learning_submissions FOR SELECT
USING (
  auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor') AND
  (auth.uid()::text = submitted_to_tutor::text OR submission_type = 'open')
);

-- Also ensure the INSERT policy is consistent
DROP POLICY IF EXISTS "students_insert_submissions" ON learning_submissions;
CREATE POLICY "students_insert_submissions"
ON learning_submissions FOR INSERT
WITH CHECK (auth.uid()::text = student_id::text);

-- Ensure UPDATE policy has consistent type casting
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;
CREATE POLICY "tutors_update_submissions"
ON learning_submissions FOR UPDATE
USING (
  auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor') AND
  (auth.uid()::text = submitted_to_tutor::text OR submission_type = 'open')
)
WITH CHECK (
  auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor') AND
  (auth.uid()::text = submitted_to_tutor::text OR submission_type = 'open')
);

-- Verify student_id column exists and has correct type
-- student_id should be UUID
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'learning_submissions' 
AND column_name = 'student_id';

-- Count submissions by student (for debugging)
-- Run this query to verify data exists
SELECT student_id, COUNT(*) as submission_count 
FROM learning_submissions 
GROUP BY student_id 
LIMIT 10;

-- Check if any submissions have NULL student_id (shouldn't happen but good to verify)
SELECT COUNT(*) as null_student_id_count 
FROM learning_submissions 
WHERE student_id IS NULL;
