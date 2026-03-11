-- Progress Log Enhancement Migration
-- This migration adds foreign key constraint to allow fetching tutor profile data

-- Add named foreign key constraint from reviewed_by to profiles table
-- This allows us to join with profiles to get tutor name and email
ALTER TABLE learning_submissions 
DROP CONSTRAINT IF EXISTS learning_submissions_reviewed_by_fkey;

ALTER TABLE learning_submissions
ADD CONSTRAINT learning_submissions_reviewed_by_fkey 
FOREIGN KEY (reviewed_by) 
REFERENCES profiles(id) 
ON DELETE SET NULL;

-- Create index for reviewed_by to speed up profile lookups
CREATE INDEX IF NOT EXISTS idx_learning_submissions_reviewed_by ON learning_submissions(reviewed_by);

-- Ensure profiles table has proper foreign key to auth.users
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;
