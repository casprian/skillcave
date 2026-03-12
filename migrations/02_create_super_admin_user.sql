-- Create Super Admin User (Test Account)
-- Email: superadmin@skillcave.com
-- Password: SuperAdmin123!

-- This script should be run manually in Supabase SQL Editor
-- The user will be created via auth.users, and a profile will be inserted

-- To manually create a super admin user:
-- 1. Go to Authentication > Users in Supabase Dashboard
-- 2. Click "Create User"
-- 3. Email: superadmin@skillcave.com
-- 4. Password: SuperAdmin123!
-- 5. Run the SQL below to create the profile:

INSERT INTO public.profiles (id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',  -- Replace with actual auth user ID
  'superadmin@skillcave.com',
  'Super Admin',
  'super_admin'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'super_admin';

-- Alternative: If you have the user ID from auth, use this format:
-- INSERT INTO public.profiles (id, email, name, role)
-- VALUES (auth_user_id_here, 'superadmin@skillcave.com', 'Super Admin', 'super_admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- Verify the super admin was created:
SELECT id, email, name, role FROM public.profiles WHERE role = 'super_admin';
