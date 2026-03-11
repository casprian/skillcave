-- Migration: Update RLS policies for open submissions visibility
-- Feature: Allow all tutors to see pending open submissions (not assigned to any specific tutor)

-- Drop existing tutor policies
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;

-- ===== NEW LOGIC =====
-- Policy: Tutors can view:
--   1. Submissions specifically assigned to them (submitted_to_tutor = auth.uid())
--   2. All pending open submissions that have NO specific tutor assigned
--
-- This allows any tutor to pick up pending unassigned work

CREATE POLICY "tutors_view_submissions"
ON learning_submissions
FOR SELECT
USING (
  -- User must be a tutor
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::text = auth.uid()::text 
    AND role = 'tutor'
  )
  AND (
    -- Case 1: Submission is assigned to this specific tutor
    submitted_to_tutor = auth.uid()
    OR
    -- Case 2: Submission is open, pending, and NOT assigned to anyone
    (
      submission_type = 'open' 
      AND status = 'pending'
      AND submitted_to_tutor IS NULL
    )
  )
);

CREATE POLICY "tutors_update_submissions"
ON learning_submissions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::text = auth.uid()::text 
    AND role = 'tutor'
  )
  AND (
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
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::text = auth.uid()::text 
    AND role = 'tutor'
  )
  AND (
    submitted_to_tutor = auth.uid()
    OR
    (
      submission_type = 'open' 
      AND status = 'pending'
      AND submitted_to_tutor IS NULL
    )
  )
);

-- Test query - should show pending open submissions for all tutors
-- SELECT id, title, submission_type, status, submitted_to_tutor 
-- FROM learning_submissions
-- WHERE submission_type = 'open' 
-- AND status = 'pending'
-- AND submitted_to_tutor IS NULL;
