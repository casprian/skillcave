-- Update attendance table to support professional logging fields
-- This migration adds comprehensive fields for detailed work logging

-- First, let's check and potentially add new columns to the attendance table
-- (Run only the ADD COLUMN statements if columns don't exist)

-- Add new columns for professional logging if they don't exist
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS login_time VARCHAR(5);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS logout_time VARCHAR(5);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS break_duration INTEGER DEFAULT 60;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS location VARCHAR(100) DEFAULT 'Office';
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS task_summary TEXT;
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS productivity_level VARCHAR(20) DEFAULT 'medium'; -- high, medium, low
ALTER TABLE public.attendance ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for faster queries on frequently accessed columns
CREATE INDEX IF NOT EXISTS idx_attendance_project ON public.attendance(project_name);
CREATE INDEX IF NOT EXISTS idx_attendance_location ON public.attendance(location);
CREATE INDEX IF NOT EXISTS idx_attendance_productivity ON public.attendance(productivity_level);

-- Optional: Create a view for detailed analytics
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
  user_id,
  DATE(attendance_date) as date,
  COUNT(*) as total_entries,
  SUM(hours) as total_hours,
  AVG(hours) as avg_hours,
  COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
  COUNT(CASE WHEN productivity_level = 'high' THEN 1 END) as high_productivity_days,
  COUNT(CASE WHEN project_name IS NOT NULL THEN 1 END) as projects_worked,
  STRING_AGG(DISTINCT project_name, ', ') as projects_list
FROM public.attendance
GROUP BY user_id, DATE(attendance_date);

-- Grant permissions if needed
GRANT SELECT ON public.attendance_summary TO authenticated;
