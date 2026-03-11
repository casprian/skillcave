# Database Setup Instructions

## Create Assignments Table

Run this SQL in your Supabase SQL Editor to create the assignments table:

```sql
-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  student_id UUID,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  tutor_comments TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for status and submitted_at for faster queries
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_submitted_at ON assignments(submitted_at DESC);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow tutors to view all assignments
CREATE POLICY "tutors_can_view_assignments" ON assignments
  FOR SELECT
  USING (true);

-- Create policy to allow tutors to update assignments (for approve/reject)
CREATE POLICY "tutors_can_update_assignments" ON assignments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policy to allow students to insert assignments
CREATE POLICY "students_can_insert_assignments" ON assignments
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow students to view their own assignments
CREATE POLICY "students_can_view_own_assignments" ON assignments
  FOR SELECT
  USING (auth.uid()::text = student_id::text OR true);
```

## Sample Data for Testing

Insert some sample assignments for testing:

```sql
-- Insert sample assignments
INSERT INTO assignments (student_name, title, description, status) VALUES
  ('John Doe', 'React Basics Assignment', 'Complete a React component with hooks and state management', 'pending'),
  ('Jane Smith', 'JavaScript ES6 Features', 'Write code demonstrating all ES6 features', 'pending'),
  ('Mike Johnson', 'Database Design Project', 'Design a normalized database schema for an e-commerce platform', 'pending'),
  ('Sarah Williams', 'API Development', 'Build a REST API with Express.js and MongoDB', 'pending'),
  ('Tom Brown', 'Mobile App UI', 'Create a mobile app interface using React Native', 'pending');
```

## Update Profiles Table (if needed)

Ensure your profiles table has the role column:

```sql
-- If role column doesn't exist, add it
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

## Notes

- The `status` field can be: `pending`, `approved`, or `rejected`
- The `tutor_comments` field stores the feedback provided by tutors
- The `reviewed_by` field stores the UUID of the tutor who reviewed it
- The `reviewed_at` field stores the timestamp of when it was reviewed
- RLS policies are set to allow public access for testing. In production, you may want to restrict access based on user roles.
