-- FINAL FIX: Correct RLS Policies for learning_submissions
-- This handles all cases: student viewing own, tutors viewing assigned/open, etc.

-- ===== FIX 1: Drop all problematic policies =====
DROP POLICY IF EXISTS "students_view_own_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_insert_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;

-- ===== FIX 2: Recreate with CORRECT logic =====

-- Policy 1: Students can view only their own submissions
CREATE POLICY "students_view_own_submissions"
ON learning_submissions
FOR SELECT
USING (
  -- Allow student to view their own submissions
  student_id = auth.uid()
);

-- Policy 2: Tutors can view submissions assigned to them or open pending submissions
CREATE POLICY "tutors_view_submissions"
ON learning_submissions
FOR SELECT
USING (
  -- Check if user is a tutor
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id::text = auth.uid()::text 
    AND role = 'tutor'
  )
  AND (
    -- Tutor can see submissions specifically assigned to them
    submitted_to_tutor = auth.uid()
    OR
    -- Tutor can see open submissions that are pending and have NO specific tutor assigned
    (
      submission_type = 'open' 
      AND status = 'pending'
      AND submitted_to_tutor IS NULL
    )
  )
);

-- Policy 3: Students can insert their own submissions
CREATE POLICY "students_insert_submissions"
ON learning_submissions
FOR INSERT
WITH CHECK (
  student_id = auth.uid()
);

-- Policy 4: Tutors can update submissions they can view
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

-- ===== FIX 3: Verify RLS is enabled =====
ALTER TABLE learning_submissions ENABLE ROW LEVEL SECURITY;

-- ===== FIX 4: Test the RLS policies =====
-- After running the above, test with:
SELECT id, title, status FROM learning_submissions 
WHERE student_id = auth.uid();

-- If this returns your 7 rows, RLS is now fixed!
-- If still empty, the issue is elsewhere (see DIAGNOSE_RLS_ISSUE.sql)
