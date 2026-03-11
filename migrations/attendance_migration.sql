-- Attendance Table Migration
-- This migration creates the attendance tracking system for students

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  hours DECIMAL(5, 2) DEFAULT 0,
  attendance_type VARCHAR(20) NOT NULL DEFAULT 'logged' CHECK (attendance_type IN ('logged', 'detailed')),
  status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half-day')),
  login_time VARCHAR(5),
  logout_time VARCHAR(5),
  break_duration INTEGER DEFAULT 0, -- in minutes
  project_name VARCHAR(255),
  location VARCHAR(255),
  task_summary TEXT,
  productivity_level VARCHAR(20) CHECK (productivity_level IN ('high', 'medium', 'low')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure one entry per user per day
  UNIQUE(user_id, attendance_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can view their own attendance
DROP POLICY IF EXISTS "students_view_own_attendance" ON attendance;
CREATE POLICY "students_view_own_attendance"
ON attendance FOR SELECT
USING (auth.uid() = user_id);

-- Students can insert their own attendance
DROP POLICY IF EXISTS "students_insert_attendance" ON attendance;
CREATE POLICY "students_insert_attendance"
ON attendance FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can update their own attendance
DROP POLICY IF EXISTS "students_update_attendance" ON attendance;
CREATE POLICY "students_update_attendance"
ON attendance FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tutors can view attendance for reference
DROP POLICY IF EXISTS "tutors_view_attendance" ON attendance;
CREATE POLICY "tutors_view_attendance"
ON attendance FOR SELECT
USING (auth.uid()::text IN (SELECT id::text FROM profiles WHERE role = 'tutor'));

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update the updated_at field
DROP TRIGGER IF EXISTS update_attendance_timestamp ON attendance;
CREATE TRIGGER update_attendance_timestamp
BEFORE UPDATE ON attendance
FOR EACH ROW
EXECUTE FUNCTION update_attendance_updated_at();

-- View for monthly attendance summary
DROP VIEW IF EXISTS monthly_attendance_summary;
CREATE VIEW monthly_attendance_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', attendance_date)::DATE as month,
  COUNT(*) as total_days,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
  COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
  COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
  COUNT(CASE WHEN status = 'half-day' THEN 1 END) as half_days,
  ROUND(SUM(hours)::NUMERIC, 2) as total_hours,
  ROUND(AVG(CAST(hours AS NUMERIC)), 2) as avg_daily_hours,
  ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL * 100), 2) as attendance_rate
FROM attendance
GROUP BY user_id, DATE_TRUNC('month', attendance_date);

-- View for today's attendance status
DROP VIEW IF EXISTS today_attendance;
CREATE VIEW today_attendance AS
SELECT
  a.id,
  a.user_id,
  a.attendance_date,
  a.status,
  a.hours,
  a.login_time,
  a.logout_time,
  a.project_name,
  a.task_summary
FROM attendance a
WHERE a.attendance_date = CURRENT_DATE;

-- View for attendance history (last 30 days)
DROP VIEW IF EXISTS attendance_history;
CREATE VIEW attendance_history AS
SELECT
  id,
  user_id,
  attendance_date,
  hours,
  status,
  attendance_type,
  login_time,
  logout_time,
  project_name,
  location,
  task_summary,
  productivity_level,
  notes,
  created_at
FROM attendance
WHERE attendance_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY attendance_date DESC;

-- Comment for documentation
COMMENT ON TABLE attendance IS 'Student attendance records with flexible logging options (quick and detailed)';
COMMENT ON VIEW monthly_attendance_summary IS 'Monthly aggregated attendance statistics per student';
COMMENT ON VIEW today_attendance IS 'Today''s attendance records with student profile information';
COMMENT ON VIEW attendance_history IS 'Last 30 days of attendance records for reporting';
