# Quick Reference: SkillCave Authentication

## 📍 Key Files Location

```
SkillCaveApp/
├── app/
│   ├── _layout.tsx ..................... Root auth gateway
│   ├── (auth)/
│   │   ├── _layout.tsx ................ Auth routes container
│   │   ├── enroll.tsx ................. Sign up page
│   │   └── login.tsx .................. Login page
│   ├── (student)/
│   │   └── index.tsx .................. Student dashboard (with logout)
│   ├── (tutor)/
│   │   └── index.tsx .................. Tutor dashboard
│   └── (admin)/
│       └── index.tsx .................. Admin dashboard
├── lib/
│   └── supabase.ts ..................... Supabase client
├── .env ............................... Credentials
└── (Documentation files created)
    ├── AUTH_SETUP.md
    ├── AUTHENTICATION_SUMMARY.md
    ├── AUTHENTICATION_CHECKLIST.md
    └── AUTHENTICATION_FLOWS.md
```

## 🔑 Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://tgdgvxkhkhrswgwrqoro.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_gn957uGDqcSkt6TDtfWRaw_Vh2kYJaY
```

## 📊 Database Schema (Profiles Table)

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  role text DEFAULT 'student',
  enrolled_at timestamp DEFAULT now()
);
```

## 🎯 Routes

| Route | Purpose | When Shown |
|-------|---------|-----------|
| `/(auth)/enroll` | Sign up new user | First app open, no session |
| `/(auth)/login` | Login existing user | After enrollment, user has credentials |
| `/(student)` | Student dashboard | After login, if role='student' |
| `/(tutor)` | Tutor dashboard | After login, if role='tutor' |
| `/(admin)` | Admin dashboard | After login, if role='admin' or 'management' |

## 🔄 Main Flow in 4 Steps

```
1. APP OPENS
   → Root layout checks session
   → No session? → Show /(auth)/enroll
   → Session exists? → Show appropriate dashboard

2. USER ENROLLS
   → Form: name, email, phone, password
   → Create auth user (supabase.auth.signUp)
   → Save profile to database
   → Redirect to /(auth)/login

3. USER LOGS IN
   → Form: email, password
   → Authenticate (supabase.auth.signInWithPassword)
   → Session saved locally
   → Redirect to /(student)

4. SESSION PERSISTS
   → Close app
   → Session stays in local storage
   → Reopen app
   → Gets session from storage
   → Shows dashboard immediately
   → NO RE-LOGIN NEEDED ✓
```

## 💾 What Gets Saved Where

| Data | Where | When | Persists |
|------|-------|------|----------|
| Email/Password | Supabase auth.users | Signup | Forever |
| User Profile | Supabase profiles table | Signup | Forever |
| Session Token | AsyncStorage / localStorage | Login | Until logout |
| Form Data | App memory | While typing | During session only |

## 🧪 Quick Test

```javascript
// Test Signup
Email: test@example.com
Password: password123
Confirm: password123
Result: Should create account and go to login page

// Test Login
Email: test@example.com
Password: password123
Result: Should go to dashboard

// Test Persistence
1. Close app
2. Reopen
3. Should show dashboard (not login page)
4. ✓ Still logged in!

// Test Logout
1. Tap logout button
2. Should return to enrollment page
```

## 🔍 Validation Rules

### Enrollment Form
- **Name**: Required, any text
- **Email**: Required, valid email format
- **Phone**: Required, any format
- **Password**: Required, minimum 6 characters
- **Confirm**: Must match Password exactly

### Login Form
- **Email**: Required
- **Password**: Required

## ⚡ Key Functions

```typescript
// In app/_layout.tsx
checkAuth() 
  → supabase.auth.getSession()
  → Query profiles table
  → Route based on role

onAuthStateChange()
  → Listens for logout
  → Routes back to enroll on logout

// In app/(auth)/enroll.tsx
handleEnroll()
  → Validate inputs
  → supabase.auth.signUp()
  → Insert to profiles table
  → Redirect to login

// In app/(auth)/login.tsx
handleLogin()
  → supabase.auth.signInWithPassword()
  → Redirect to student dashboard

// In app/(student)/index.tsx
handleLogout()
  → supabase.auth.signOut()
  → Redirect to enroll
```

## 📱 User Journey Map

```
FIRST TIME USER:
Enroll.tsx (fill form)
    ↓
Login.tsx (enter credentials)
    ↓
Student Dashboard
    ↓
[Close App]
    ↓
Student Dashboard (opens automatically!)
    ↓
[Tap Logout]
    ↓
Enroll.tsx (session cleared)

RETURNING USER:
Login.tsx (enter credentials)
    ↓
Student Dashboard
    ↓
[Close App]
    ↓
Student Dashboard (opens automatically!)
```

## 🚀 Status: COMPLETE ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Enrollment Page | ✅ Done | Password-based signup |
| Login Page | ✅ Done | Email/password auth |
| Root Auth Gate | ✅ Done | Session checking |
| Database | ✅ Done | Profiles table ready |
| Session Persistence | ✅ Done | AsyncStorage + auth state |
| Logout | ✅ Done | Clear session + redirect |
| Role-Based Routing | ✅ Done | Student/Tutor/Admin |
| Error Handling | ✅ Done | User-friendly alerts |
| Professional UI | ✅ Done | Consistent styling |

## 📖 Documentation

| File | Purpose |
|------|---------|
| `AUTHENTICATION_SUMMARY.md` | Overview and testing guide |
| `AUTH_SETUP.md` | Detailed technical documentation |
| `AUTHENTICATION_CHECKLIST.md` | Implementation checklist |
| `AUTHENTICATION_FLOWS.md` | Visual flow diagrams |
| `QUICK_REFERENCE.md` | This file |

## 🎓 Learning Points

1. **Session Persistence**: Tokens stored locally survive app restart
2. **Role-Based Access**: Profiles table determines which dashboard user sees
3. **Auth State Listener**: Real-time sync between app and Supabase
4. **Graceful Fallbacks**: Default role='student' if profile missing
5. **User Experience**: No more re-enrollments = happy users! 🎉

## ⚠️ Common Issues & Solutions

**Issue**: User redirected to enroll after login
- **Solution**: Check if profiles table has user's role

**Issue**: Session not persisting
- **Solution**: Verify AsyncStorage installed for React Native

**Issue**: Profile query fails
- **Solution**: Check profiles table exists and foreign key is correct

**Issue**: Routes to wrong dashboard
- **Solution**: Verify profile.role value (student/tutor/admin/management)

---

## 🎯 Bottom Line

**User Experience Before**: 
- Enroll → Close app → Reopen → Forced to re-enroll 😞

**User Experience Now**:
- Enroll → Close app → Reopen → Already logged in 😊✓

**Problem Solved**: Users are NEVER asked to re-enroll!
