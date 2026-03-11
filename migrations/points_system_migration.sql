-- Points System Migration
-- This migration adds points tracking for student submissions and achievements
-- Points awarded: 1 point for submission, 10 additional points if approved

-- Add points column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- Create points_log table to track all point transactions
CREATE TABLE IF NOT EXISTS points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES learning_submissions(id) ON DELETE SET NULL,
  points_awarded INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (points_awarded > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_points_log_student_id ON points_log(student_id);
CREATE INDEX IF NOT EXISTS idx_points_log_submission_id ON points_log(submission_id);
CREATE INDEX IF NOT EXISTS idx_points_log_created_at ON points_log(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE points_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own points log
DROP POLICY IF EXISTS "students_view_own_points_log" ON points_log;
CREATE POLICY "students_view_own_points_log"
ON points_log FOR SELECT
USING (auth.uid() = student_id);

-- Tutors can view points log for reference (no sensitive data)
DROP POLICY IF EXISTS "tutors_view_points_log" ON points_log;
CREATE POLICY "tutors_view_points_log"
ON points_log FOR SELECT
USING (auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor'));

-- System can insert into points_log (for triggers)
DROP POLICY IF EXISTS "system_insert_points_log" ON points_log;
CREATE POLICY "system_insert_points_log"
ON points_log FOR INSERT
WITH CHECK (true);

-- Function to award points for new submissions (1 point)
CREATE OR REPLACE FUNCTION award_submission_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Award 1 point for submission
  INSERT INTO points_log (student_id, submission_id, points_awarded, reason)
  VALUES (NEW.student_id, NEW.id, 1, 'Learning submission');

  -- Update total_points in profiles
  UPDATE profiles SET total_points = total_points + 1
  WHERE id::text = NEW.student_id::text;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to award points for approved submissions (10 additional points)
CREATE OR REPLACE FUNCTION award_approval_points()
RETURNS TRIGGER AS $$
BEGIN
  -- Only award if status changed to 'approved' and wasn't before
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Award 10 additional points for approval
    INSERT INTO points_log (student_id, submission_id, points_awarded, reason)
    VALUES (NEW.student_id, NEW.id, 10, 'Submission approved');

    -- Update total_points in profiles
    UPDATE profiles SET total_points = total_points + 10
    WHERE id::text = NEW.student_id::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to award points on submission creation
DROP TRIGGER IF EXISTS award_submission_points_trigger ON learning_submissions;
CREATE TRIGGER award_submission_points_trigger
AFTER INSERT ON learning_submissions
FOR EACH ROW
EXECUTE FUNCTION award_submission_points();

-- Trigger to award points on approval
DROP TRIGGER IF EXISTS award_approval_points_trigger ON learning_submissions;
CREATE TRIGGER award_approval_points_trigger
AFTER UPDATE ON learning_submissions
FOR EACH ROW
EXECUTE FUNCTION award_approval_points();

-- View for leaderboard rankings
CREATE OR REPLACE VIEW leaderboard_rankings AS
SELECT
  p.id,
  p.name,
  p.email,
  p.total_points,
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC) as rank,
  COUNT(ls.id) as submission_count,
  COUNT(CASE WHEN ls.status = 'approved' THEN 1 END) as approved_count
FROM profiles p
LEFT JOIN learning_submissions ls ON p.id::text = ls.student_id::text
WHERE p.role = 'student'
GROUP BY p.id, p.name, p.email, p.total_points
ORDER BY p.total_points DESC;

-- Create index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_total_points ON profiles(total_points DESC);
