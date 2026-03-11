-- Create attendance table for tracking student attendance records
CREATE TABLE IF NOT EXISTS public.attendance (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  hours DECIMAL(5, 2) NOT NULL DEFAULT 8,
  attendance_type VARCHAR(20) NOT NULL DEFAULT 'full', -- full, half, quarter, custom
  status VARCHAR(20) NOT NULL DEFAULT 'present', -- present, absent, late
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, attendance_date)
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policy so users can only see their own attendance
CREATE POLICY "Users can view their own attendance"
ON public.attendance
FOR SELECT
USING (auth.uid() = user_id);

-- Create RLS policy so users can only insert their own attendance
CREATE POLICY "Users can insert their own attendance"
ON public.attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RLS policy so users can only update their own attendance
CREATE POLICY "Users can update their own attendance"
ON public.attendance
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON public.attendance(user_id, attendance_date);
