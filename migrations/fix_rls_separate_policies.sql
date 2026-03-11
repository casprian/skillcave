-- Drop ALL policies on learning_submissions to start fresh
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutor_can_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_insert_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_update_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_view_own_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_insert_own_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "students_update_own_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_view_assigned" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_view_open_pending" ON learning_submissions;

-- Enable RLS (if not already)
ALTER TABLE learning_submissions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can view their own submissions
CREATE POLICY "students_view_own_submissions" ON learning_submissions
FOR SELECT
USING (student_id = auth.uid());

-- Policy 2: Students can insert their own submissions
CREATE POLICY "students_insert_own_submissions" ON learning_submissions
FOR INSERT
WITH CHECK (student_id = auth.uid());

-- Policy 3: Students can update their own pending submissions
CREATE POLICY "students_update_own_submissions" ON learning_submissions
FOR UPDATE
USING (student_id = auth.uid() AND status = 'pending')
WITH CHECK (student_id = auth.uid() AND status = 'pending');

-- Policy 4: Tutors can view submissions assigned to them
CREATE POLICY "tutors_view_assigned" ON learning_submissions
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND role = 'tutor')
  AND submitted_to_tutor = auth.uid()
);

-- Policy 5: Tutors can view pending open submissions (not assigned)
CREATE POLICY "tutors_view_open_pending" ON learning_submissions
FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND role = 'tutor')
  AND submission_type = 'open'
  AND status = 'pending'
  AND submitted_to_tutor IS NULL
);

-- Policy 6: Tutors can update submissions they're viewing
CREATE POLICY "tutors_update_submissions" ON learning_submissions
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND role = 'tutor')
  AND (submitted_to_tutor = auth.uid() OR (submission_type = 'open' AND status = 'pending' AND submitted_to_tutor IS NULL))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.auth_id = auth.uid() AND role = 'tutor')
);

-- Test: Show all policies on learning_submissions
SELECT policyname, cmd, SUBSTRING(qual FROM 1 FOR 150) as condition
FROM pg_policies
WHERE tablename = 'learning_submissions'
ORDER BY policyname;
