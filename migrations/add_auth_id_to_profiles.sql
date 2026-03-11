-- Add auth_id column to profiles table to store the auth.users UUID
-- This allows proper foreign key references from other tables

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID;

-- For existing tutors, try to match their email with auth.users
UPDATE profiles 
SET auth_id = au.id 
FROM auth.users au 
WHERE profiles.email = au.email 
AND profiles.auth_id IS NULL;

-- Make auth_id not null for new records after this migration
-- Existing records might be null, but new ones will be required when inserting via RLS
ALTER TABLE profiles ALTER COLUMN auth_id DROP NOT NULL;

-- Create index on auth_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.auth_id IS 'UUID reference to auth.users table for proper UUID foreign key relationships';
