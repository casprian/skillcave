-- Populate auth_id for all profiles by matching email
UPDATE profiles
SET auth_id = au.id
FROM auth.users au
WHERE profiles.email = au.email
AND profiles.auth_id IS NULL;

-- Verify it worked
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN auth_id IS NOT NULL THEN 1 END) as profiles_with_auth_id,
  COUNT(CASE WHEN auth_id IS NULL THEN 1 END) as profiles_missing_auth_id
FROM profiles;

-- Show all tutor profiles now with auth_id
SELECT 
  id,
  auth_id,
  email,
  name,
  role
FROM profiles
WHERE role = 'tutor'
LIMIT 10;
