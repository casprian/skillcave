-- Learning Submissions Table
-- This table stores all learning log submissions from students to tutors

CREATE TABLE IF NOT EXISTS learning_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submission_type VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (submission_type IN ('open', 'specific')),
  submitted_to_tutor UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tutor_feedback TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_learning_submissions_student_id ON learning_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_submissions_submitted_to_tutor ON learning_submissions(submitted_to_tutor);
CREATE INDEX IF NOT EXISTS idx_learning_submissions_status ON learning_submissions(status);
CREATE INDEX IF NOT EXISTS idx_learning_submissions_submitted_at ON learning_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_submissions_submission_type ON learning_submissions(submission_type);

-- Enable Row Level Security (RLS)
ALTER TABLE learning_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Students can view their own submissions
DROP POLICY IF EXISTS "students_view_own_submissions" ON learning_submissions;
CREATE POLICY "students_view_own_submissions"
ON learning_submissions FOR SELECT
USING (auth.uid() = student_id);

-- Policy 2: Tutors can view submissions sent to them or open submissions
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
CREATE POLICY "tutors_view_submissions"
ON learning_submissions FOR SELECT
USING (
  auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor') AND
  (auth.uid() = submitted_to_tutor OR submission_type = 'open')
);

-- Policy 3: Students can insert their own submissions
DROP POLICY IF EXISTS "students_insert_submissions" ON learning_submissions;
CREATE POLICY "students_insert_submissions"
ON learning_submissions FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Policy 4: Tutors can update submissions (to add feedback and approval)
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;
CREATE POLICY "tutors_update_submissions"
ON learning_submissions FOR UPDATE
USING (
  auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor') AND
  (auth.uid() = submitted_to_tutor OR submission_type = 'open')
)
WITH CHECK (
  auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor') AND
  (auth.uid() = submitted_to_tutor OR submission_type = 'open')
);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_learning_submissions_timestamp ON learning_submissions;
CREATE TRIGGER update_learning_submissions_timestamp
BEFORE UPDATE ON learning_submissions
FOR EACH ROW
EXECUTE FUNCTION update_learning_submissions_updated_at();
