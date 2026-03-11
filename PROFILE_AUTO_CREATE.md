# Profile Auto-Creation on Signup

## What Changed
Updated enrollment to automatically create a profile in the database when user signs up.

## How It Works

When user clicks "Create Account":

1. **Auth user created** in Supabase auth system
2. **Profile inserted** into profiles table with:
   - email
   - name
   - phone
   - role (student, tutor, management, admin)
3. User redirected to login

### Code Added
```tsx
// After successful auth signup:
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .insert([
    {
      email: email.toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      role: role,
    }
  ])
  .select();

if (profileError) {
  console.error('Profile creation error:', profileError);
  // Signup still succeeds even if profile creation fails
}
```

## What Gets Stored

### In `auth.users` (Supabase managed):
- email
- password (hashed)
- user ID (UUID)

### In `profiles` table (your custom table):
- id (auto-generated bigint)
- email (indexed for quick lookup)
- name
- phone
- role (student/tutor/management/admin)
- enrolled_at (auto timestamp)
- created_at (auto timestamp)

## Test It

1. Open enrollment page
2. Fill form completely
3. Select role: "Tutor" (or any role)
4. Click "Create Account"
5. Check Supabase dashboard → profiles table
6. **You should see the new profile with all fields populated!** ✨

## Features

✅ Profile created immediately on signup
✅ Email verified for uniqueness (by auth system)
✅ Role is set during signup
✅ All user data saved atomically
✅ Signup succeeds even if profile creation fails (graceful)
✅ Detailed console logging for debugging

## Troubleshooting

### "Profile not appearing in database?"
- Check Supabase dashboard → profiles table
- Check console for "Profile creation error" logs
- Verify RLS policies allow insert

### "Getting constraint error?"
- Check if email already exists (try different email)
- Check profiles table schema has all columns
- Try clearing browser cache and auth state

### "Wrong role showing?"
- Check role was selected in dropdown before signup
- Check profiles table has correct role value
- Check console log shows selected role

---

**Now profiles are automatically created on signup! No manual insertion needed.** ✨
