-- Ensure all auth users have profiles
-- This creates missing profile records for users who exist in auth.users but not in profiles

-- Step 1: Create missing profiles for all auth users
INSERT INTO profiles (id, role)
SELECT 
  u.id,
  'student' -- default role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT DO NOTHING;

-- Step 2: Verify profile count matches auth user count
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles;

-- If the numbers match, all users have profiles now
