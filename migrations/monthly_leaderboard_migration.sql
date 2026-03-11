-- Monthly Leaderboard System Migration
-- This migration adds monthly competition tracking for the leaderboard
-- Each month resets, and previous months are archived

-- Add monthly_leaderboard table to track monthly competitions
CREATE TABLE IF NOT EXISTS monthly_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First day of the month
  total_points INTEGER DEFAULT 0,
  submission_count INTEGER DEFAULT 0,
  approved_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure one entry per student per month
  UNIQUE(student_id, month_year)
);

-- Add monthly_points_log to track points earned in each month
CREATE TABLE IF NOT EXISTS monthly_points_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES learning_submissions(id) ON DELETE SET NULL,
  month_year DATE NOT NULL, -- First day of the month
  points_awarded INTEGER NOT NULL,
  reason VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CHECK (points_awarded > 0)
);

-- Add month_year tracking to learning_submissions (nullable for now, triggers will populate)
ALTER TABLE learning_submissions ADD COLUMN IF NOT EXISTS month_year DATE;

-- Function to calculate month_year (first day of month for a given date)
CREATE OR REPLACE FUNCTION get_month_year(date_value TIMESTAMP WITH TIME ZONE)
RETURNS DATE AS $$
BEGIN
  RETURN DATE_TRUNC('month', date_value)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Update existing submissions with month_year (with safe default for NULL submitted_at)
UPDATE learning_submissions 
SET month_year = DATE_TRUNC('month', COALESCE(submitted_at, CURRENT_TIMESTAMP))::DATE
WHERE month_year IS NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboards_month_year 
  ON monthly_leaderboards(month_year DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboards_student_id 
  ON monthly_leaderboards(student_id);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboards_total_points 
  ON monthly_leaderboards(month_year, total_points DESC);

CREATE INDEX IF NOT EXISTS idx_monthly_points_log_month_year 
  ON monthly_points_log(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_points_log_student_id 
  ON monthly_points_log(student_id);

CREATE INDEX IF NOT EXISTS idx_learning_submissions_month_year 
  ON learning_submissions(month_year);

-- Enable Row Level Security (RLS)
ALTER TABLE monthly_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_points_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for monthly_leaderboards
DROP POLICY IF EXISTS "students_view_monthly_leaderboards" ON monthly_leaderboards;
CREATE POLICY "students_view_monthly_leaderboards"
ON monthly_leaderboards FOR SELECT
USING (true); -- Public view - everyone can see rankings

DROP POLICY IF EXISTS "system_update_monthly_leaderboards" ON monthly_leaderboards;
CREATE POLICY "system_update_monthly_leaderboards"
ON monthly_leaderboards FOR UPDATE
USING (true)
WITH CHECK (true); -- System triggers will handle updates

DROP POLICY IF EXISTS "system_insert_monthly_leaderboards" ON monthly_leaderboards;
CREATE POLICY "system_insert_monthly_leaderboards"
ON monthly_leaderboards FOR INSERT
WITH CHECK (true); -- Allow triggers to insert

-- RLS Policies for monthly_points_log
DROP POLICY IF EXISTS "students_view_own_monthly_points" ON monthly_points_log;
CREATE POLICY "students_view_own_monthly_points"
ON monthly_points_log FOR SELECT
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "tutors_view_monthly_points" ON monthly_points_log;
CREATE POLICY "tutors_view_monthly_points"
ON monthly_points_log FOR SELECT
USING (auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor'));

DROP POLICY IF EXISTS "system_insert_monthly_points" ON monthly_points_log;
CREATE POLICY "system_insert_monthly_points"
ON monthly_points_log FOR INSERT
WITH CHECK (true); -- Allow triggers to insert

-- Function to set month_year on submission
CREATE OR REPLACE FUNCTION set_submission_month_year()
RETURNS TRIGGER AS $$
BEGIN
  -- Set month_year before insert
  IF NEW.month_year IS NULL THEN
    NEW.month_year := get_month_year(NEW.submitted_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to award monthly points on submission (AFTER INSERT for foreign keys)
CREATE OR REPLACE FUNCTION award_monthly_submission_points_after()
RETURNS TRIGGER AS $$
DECLARE
  current_month_year DATE;
BEGIN
  -- Get the month-year of submission
  current_month_year := get_month_year(NEW.submitted_at);

  -- Insert into monthly_points_log
  INSERT INTO monthly_points_log (student_id, submission_id, month_year, points_awarded, reason)
  VALUES (NEW.student_id, NEW.id, current_month_year, 1, 'Monthly submission');

  -- Update or insert monthly leaderboard entry
  INSERT INTO monthly_leaderboards (student_id, month_year, total_points, submission_count)
  VALUES (NEW.student_id, current_month_year, 1, 1)
  ON CONFLICT (student_id, month_year)
  DO UPDATE SET 
    total_points = monthly_leaderboards.total_points + 1,
    submission_count = monthly_leaderboards.submission_count + 1,
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to award monthly approval bonus (AFTER UPDATE)
CREATE OR REPLACE FUNCTION award_monthly_approval_points_after()
RETURNS TRIGGER AS $$
DECLARE
  current_month_year DATE;
BEGIN
  -- Only award if status changed to 'approved' and wasn't before
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Get the month-year of submission
    current_month_year := get_month_year(NEW.submitted_at);

    -- Insert into monthly_points_log
    INSERT INTO monthly_points_log (student_id, submission_id, month_year, points_awarded, reason)
    VALUES (NEW.student_id, NEW.id, current_month_year, 10, 'Monthly submission approved');

    -- Update monthly leaderboard entry
    UPDATE monthly_leaderboards 
    SET 
      total_points = monthly_leaderboards.total_points + 10,
      approved_count = monthly_leaderboards.approved_count + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE student_id = NEW.student_id AND month_year = current_month_year;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- BEFORE INSERT trigger to set month_year
DROP TRIGGER IF EXISTS set_submission_month_year_trigger ON learning_submissions;
CREATE TRIGGER set_submission_month_year_trigger
BEFORE INSERT ON learning_submissions
FOR EACH ROW
EXECUTE FUNCTION set_submission_month_year();

-- AFTER INSERT trigger to award monthly points
DROP TRIGGER IF EXISTS award_monthly_submission_points_trigger ON learning_submissions;
CREATE TRIGGER award_monthly_submission_points_trigger
AFTER INSERT ON learning_submissions
FOR EACH ROW
EXECUTE FUNCTION award_monthly_submission_points_after();

-- AFTER UPDATE trigger to award monthly approval bonus
DROP TRIGGER IF EXISTS award_monthly_approval_points_trigger ON learning_submissions;
CREATE TRIGGER award_monthly_approval_points_trigger
AFTER UPDATE ON learning_submissions
FOR EACH ROW
EXECUTE FUNCTION award_monthly_approval_points_after();

-- View for current month leaderboard rankings
CREATE OR REPLACE VIEW current_month_leaderboard AS
SELECT
  ml.id,
  ml.student_id,
  p.name,
  p.email,
  ml.total_points,
  ml.submission_count,
  ml.approved_count,
  ml.month_year,
  ROW_NUMBER() OVER (ORDER BY ml.total_points DESC) as rank,
  (SELECT COUNT(DISTINCT student_id) 
   FROM monthly_leaderboards 
   WHERE month_year = DATE_TRUNC('month', CURRENT_DATE)::DATE
   AND total_points > 0) as total_participants
FROM monthly_leaderboards ml
LEFT JOIN profiles p ON ml.student_id::text = p.id::text
WHERE ml.month_year = DATE_TRUNC('month', CURRENT_DATE)::DATE
ORDER BY ml.total_points DESC;

-- View for all monthly leaderboards (for archives)
CREATE OR REPLACE VIEW all_monthly_leaderboards AS
SELECT
  ml.id,
  ml.student_id,
  p.name,
  p.email,
  ml.total_points,
  ml.submission_count,
  ml.approved_count,
  ml.month_year,
  TO_CHAR(ml.month_year, 'Month YYYY') as month_display,
  ROW_NUMBER() OVER (PARTITION BY ml.month_year ORDER BY ml.total_points DESC) as rank,
  CASE 
    WHEN ml.month_year = DATE_TRUNC('month', CURRENT_DATE)::DATE THEN 'current'
    WHEN ml.month_year < DATE_TRUNC('month', CURRENT_DATE)::DATE THEN 'archived'
    ELSE 'future'
  END as month_status
FROM monthly_leaderboards ml
LEFT JOIN profiles p ON ml.student_id::text = p.id::text
ORDER BY ml.month_year DESC, ml.total_points DESC;

-- View for top 3 current month performers (for dashboard)
CREATE OR REPLACE VIEW current_month_top_performers AS
SELECT
  rank,
  student_id,
  name,
  email,
  total_points,
  submission_count,
  approved_count,
  month_year
FROM current_month_leaderboard
LIMIT 3;

-- Create index for faster current month queries
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboards_current_month 
  ON monthly_leaderboards(month_year DESC, total_points DESC);

-- Function to handle month-end archival (for future use)
CREATE OR REPLACE FUNCTION archive_completed_months()
RETURNS void AS $$
DECLARE
  completed_month DATE;
BEGIN
  -- Get all months that are older than current month
  FOR completed_month IN
    SELECT DISTINCT month_year
    FROM monthly_leaderboards
    WHERE month_year < DATE_TRUNC('month', CURRENT_DATE)::DATE
  LOOP
    -- Could add archival logic here (mark as locked, etc.)
    -- For now, data is automatically preserved
    NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON TABLE monthly_leaderboards IS 'Monthly leaderboard rankings - resets each month for fair competition';
COMMENT ON TABLE monthly_points_log IS 'Audit trail of points earned each month - permanent record';
COMMENT ON VIEW current_month_leaderboard IS 'Current month leaderboard with rankings - auto-updates daily';
COMMENT ON VIEW all_monthly_leaderboards IS 'All monthly leaderboards including archives for historical view';
COMMENT ON FUNCTION award_monthly_submission_points IS 'Automatically awards 1 point for monthly submissions';
COMMENT ON FUNCTION award_monthly_approval_points IS 'Automatically awards 10 bonus points for monthly approval';
