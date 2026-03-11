-- Complete RLS Policy Fix for Tutors on learning_submissions
-- This fixes the issue where tutors cannot see ANY submissions due to incorrect policies

-- Step 1: Drop existing tutor policies (if they exist)
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutor_can_view_submissions" ON learning_submissions;

-- Step 2: Enable RLS on learning_submissions (if not already enabled)
ALTER TABLE learning_submissions ENABLE ROW LEVEL SECURITY;

-- Step 3: Create new tutor SELECT policy
-- Tutors can see:
-- 1. Submissions assigned to them: submitted_to_tutor = auth.uid()
-- 2. Pending open submissions not assigned to anyone: submission_type='open' AND status='pending' AND submitted_to_tutor IS NULL
CREATE POLICY "tutors_view_submissions" ON learning_submissions
FOR SELECT
USING (
  -- Check if user is a tutor using auth_id (UUID) not id (BIGINT)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'tutor'
  )
  AND
  -- Can see submissions assigned to them OR pending open submissions
  (
    submitted_to_tutor = auth.uid()
    OR
    (
      submission_type = 'open' 
      AND status = 'pending' 
      AND submitted_to_tutor IS NULL
    )
  )
);

-- Step 4: Create new tutor UPDATE policy
-- Tutors can only update submissions they can see
CREATE POLICY "tutors_update_submissions" ON learning_submissions
FOR UPDATE
USING (
  -- Check if user is a tutor using auth_id (UUID) not id (BIGINT)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'tutor'
  )
  AND
  -- Can update submissions assigned to them OR pending open submissions
  (
    submitted_to_tutor = auth.uid()
    OR
    (
      submission_type = 'open' 
      AND status = 'pending' 
      AND submitted_to_tutor IS NULL
    )
  )
)
WITH CHECK (
  -- On update, maintain the same access rules
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid()
    AND profiles.role = 'tutor'
  )
  AND
  (
    submitted_to_tutor = auth.uid()
    OR
    (
      submission_type = 'open' 
      AND status = 'pending' 
      AND submitted_to_tutor IS NULL
    )
  )
);

-- Step 5: Test query to verify
-- Run this to see what tutors can access:
-- SELECT id, title, status, submission_type, submitted_to_tutor FROM learning_submissions LIMIT 5;
