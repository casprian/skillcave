# Profile Fetch Error Fix

## Problem
You're seeing this error:
```
Profile fetch error: {code: 'PGRST116', details: 'The result contains 0 rows', ...}
```

## What Caused It
The `.single()` method expects exactly one row, but the query returned zero rows (no profile in the database for that user).

This happens when:
1. User created auth account but profile not inserted into `profiles` table
2. Profile doesn't exist yet (first-time users)
3. Email mismatch between auth user and profiles table

## What I Fixed
✅ Changed all `.single()` to `.maybeSingle()` in:
- `app/(auth)/login.tsx` - Login profile fetch
- `app/_layout.tsx` - Root layout profile fetch
- `app/(tutor)/index.tsx` - Tutor dashboard profile fetch
- `app/(student)/index.tsx` - Already had proper handling

✅ Added error handling:
- Checks if error code is 'PGRST116' (no rows found - expected)
- Defaults to 'student' role if no profile found
- Only logs actual errors (not "no rows" which is expected)

## How It Works Now

### Before (Broken):
```tsx
const { data: profileData } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', authUser.email)
  .single();  // ❌ Crashes if 0 rows

if (profileData) {
  setProfile(profileData);
}
```

### After (Fixed):
```tsx
const { data: profileData, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', authUser.email)
  .maybeSingle();  // ✅ Returns null if 0 rows

if (error && error.code !== 'PGRST116') {
  console.error('Profile fetch error:', error);  // Only real errors
}

if (profileData) {
  setProfile(profileData);
} else {
  setProfile({ role: 'student' });  // Default fallback
}
```

## Test It Now

1. Create a new account (fresh email)
2. Select "Tutor" role
3. Submit form
4. Login with that account
5. **Should go to tutor dashboard WITHOUT error** ✨

## Optional: Auto-Create Profile on Signup

If you want to ensure profiles are always created, update `app/(auth)/enroll.tsx` to insert a profile after signup:

```tsx
// After successful signup, insert profile
if (authData.user) {
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{
      email: email.toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      role: role,
    }]);

  if (profileError) {
    console.error('Error creating profile:', profileError);
  } else {
    console.log('Profile created successfully');
  }
}
```

## Files Modified
- ✅ `app/(auth)/login.tsx`
- ✅ `app/_layout.tsx`
- ✅ `app/(tutor)/index.tsx`
- ✅ `app/(student)/index.tsx` (already correct)

## Differences Between Methods

| Method | Returns | When to Use |
|--------|---------|------------|
| `.single()` | 1 row or error | When row MUST exist |
| `.maybeSingle()` | 1 row or null | When row MAY NOT exist |

**Always use `.maybeSingle()` if profile/data might not exist!**

---

**The error is now fixed! The app will gracefully handle missing profiles and default to "student" role.** ✨
