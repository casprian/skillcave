-- ==========================================
-- SkillCave - Assignments Table Setup
-- Copy & Paste into Supabase SQL Editor
-- ==========================================

-- Step 1: Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  tutor_comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for faster queries
CREATE INDEX idx_assignments_status ON assignments(status);

-- Step 3: Enable Row Level Security
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policy for public access (for testing)
-- NOTE: In production, restrict this to authenticated users only
CREATE POLICY "public_access" ON assignments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Step 5: Insert sample assignments for testing
INSERT INTO assignments (student_name, title, description) VALUES
  ('John Doe', 'React Basics Assignment', 'Complete a React component with hooks and state management'),
  ('Jane Smith', 'JavaScript ES6 Features', 'Write code demonstrating all ES6 features like destructuring, spread operator, etc.'),
  ('Mike Johnson', 'Database Design Project', 'Design a normalized database schema for an e-commerce platform'),
  ('Sarah Williams', 'API Development', 'Build a REST API with Express.js and MongoDB'),
  ('Tom Brown', 'Mobile App UI', 'Create a mobile app interface using React Native with proper styling');

-- Step 6: Verify data was inserted
SELECT * FROM assignments WHERE status = 'pending';

-- ==========================================
-- Optional: Add role column to profiles table
-- (Only if it doesn't exist yet)
-- ==========================================

-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';
-- CREATE INDEX idx_profiles_role ON profiles(role);

-- ==========================================
-- Useful Queries for Testing
-- ==========================================

-- View all pending assignments
-- SELECT * FROM assignments WHERE status = 'pending';

-- View approved assignments
-- SELECT * FROM assignments WHERE status = 'approved';

-- View all assignments by status
-- SELECT status, COUNT(*) as count FROM assignments GROUP BY status;

-- Update assignment status (for manual testing)
-- UPDATE assignments SET status = 'approved', tutor_comments = 'Great work!' 
-- WHERE id = 1;

-- Delete all assignments (use with caution!)
-- DELETE FROM assignments;
