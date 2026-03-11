# SkillCave Authentication System - Complete Setup

## Overview
The authentication system has been successfully updated to support persistent user sessions with password-based login. Users no longer need to re-enroll after their initial signup.

## Authentication Flow

### 1. **User Enrollment (First Time)**
- User visits `/(auth)/enroll` 
- Fills in: Name, Email, Phone, Password, Confirm Password
- System validates:
  - All fields required
  - Valid email format
  - Password minimum 6 characters
  - Passwords match
- On success:
  - Creates auth user via `supabase.auth.signUp()`
  - Saves profile to `profiles` table with role='student'
  - Stores: id, name, email, phone, role, enrolled_at
  - Redirects to `/(auth)/login`

### 2. **User Login (Subsequent Times)**
- User visits `/(auth)/login`
- Enters: Email, Password
- System authenticates via `supabase.auth.signInWithPassword()`
- On success:
  - Session created in Supabase Auth
  - Redirected to appropriate dashboard based on role

### 3. **App Startup (Session Persistence)**
- App loads and checks `app/_layout.tsx`
- `useEffect` runs `checkAuth()`:
  - Calls `supabase.auth.getSession()` to check for existing session
  - If session exists:
    - Queries `profiles` table for user role
    - Routes to appropriate dashboard:
      - `/(student)` - for student role
      - `/(tutor)` - for tutor role
      - `/(admin)` - for admin/management roles
  - If no session:
    - Routes to `/(auth)/enroll`
- Sets up `onAuthStateChange` listener to monitor session changes
- Shows loading screen while checking auth

### 4. **Logout**
- User taps "Logout" button on dashboard
- Calls `supabase.auth.signOut()`
- Clears session
- Routes back to `/(auth)/enroll`

## Key Files

### `/app/_layout.tsx` - Root Authentication Gate
- Checks session on app startup
- Routes users based on stored role in profiles table
- Handles auth state changes
- Shows loading indicator while checking auth

### `/app/(auth)/_layout.tsx` - Auth Routes Container
- Stack navigator for auth pages
- Routes: `/enroll`, `/login`

### `/app/(auth)/enroll.tsx` - User Registration
- Password-based signup form
- Creates Supabase auth user
- Saves user profile to database
- Routes to login after success

### `/app/(auth)/login.tsx` - User Login
- Email/password authentication
- Session creation
- Routes to student dashboard on success

### `/app/(student)/index.tsx` - Student Dashboard
- Displays user email via `supabase.auth.getUser()`
- Logout button clears session and returns to auth screen

### `/lib/supabase.ts` - Supabase Client
- Configured with AsyncStorage for React Native
- Handles platform detection (web vs native)
- Session persistence enabled

## Database Schema

### `profiles` Table
```
- id (UUID, PRIMARY KEY, FK to auth.users.id)
- name (TEXT)
- email (TEXT)
- phone (TEXT)
- role (TEXT) - values: 'student', 'tutor', 'admin', 'management'
- enrolled_at (TIMESTAMP)
```

## Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://tgdgvxkhkhrswgwrqoro.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gn957uGDqcSkt6TDtfWRaw_Vh2kYJaY
```

## Security Notes

- Passwords stored securely by Supabase Auth (never in database)
- Session tokens managed by Supabase Auth
- AsyncStorage used for React Native session persistence
- Email validation before signup
- Password confirmation validation
- Minimum 6 character password requirement

## Testing the Flow

### Enroll New User
1. Open app
2. Go to `/(auth)/enroll`
3. Fill form with:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Phone: "1234567890"
   - Password: "password123"
   - Confirm: "password123"
4. Tap "Create Account"
5. Should redirect to login page

### Login Existing User
1. On login page
2. Enter email and password
3. Tap "Login"
4. Should redirect to `/(student)` dashboard
5. Email displayed in welcome section

### Session Persistence
1. Log in successfully
2. Close and reopen app
3. App should automatically route to `/(student)` dashboard
4. No need to log in again

### Logout
1. On dashboard
2. Tap "Logout" button
3. Should return to enrollment screen

## Future Enhancements

- [ ] Password reset functionality (placeholder exists)
- [ ] Email verification
- [ ] Social login (Google, GitHub)
- [ ] Two-factor authentication
- [ ] Profile editing page
- [ ] Account deletion

## Troubleshooting

**Issue: User stuck on enrollment screen after login**
- Solution: Check if `profiles` table has correct role value
- Check if auth state listener is working

**Issue: Session not persisting after close**
- Solution: Verify AsyncStorage is installed and imported
- Check Supabase auth options have persistSession: true

**Issue: Profile query fails**
- Solution: Ensure `profiles` table exists with correct schema
- Check foreign key constraint from auth.users

**Issue: Routes to wrong dashboard**
- Solution: Verify profile.role value matches expected values (student/tutor/admin/management)
