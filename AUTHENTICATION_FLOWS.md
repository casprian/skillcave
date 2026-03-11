# SkillCave Authentication - Visual Flow Diagrams

## Complete Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         APP STARTUP FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  App Opens                                                              │
│    ↓                                                                    │
│  Root Layout (app/_layout.tsx)                                         │
│    ↓                                                                    │
│  useEffect Hook Runs                                                    │
│    ↓                                                                    │
│  checkAuth() Function Executes                                         │
│    ↓                                                                    │
│  Query: supabase.auth.getSession()                                     │
│    ├─ No Session Found?  →  Route to /(auth)/enroll  [FIRST TIME]      │
│    └─ Session Found?                                                   │
│        ↓                                                                │
│        Query: profiles table for user role                             │
│        ↓                                                                │
│        Route Based on Role:                                            │
│        ├─ role='student'    →  /(student)                              │
│        ├─ role='tutor'      →  /(tutor)                                │
│        ├─ role='admin'      →  /(admin)                                │
│        └─ role='management' →  /(admin)                                │
│                                                                          │
│  Setup: onAuthStateChange() Listener                                   │
│    └─ Detects logout → Route back to /(auth)/enroll                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## First-Time User: Enrollment Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    NEW USER SIGNUP PROCESS                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Start: Enrollment Page (app/(auth)/enroll.tsx)                    │
│    ↓                                                                │
│  User Fills Form:                                                  │
│    ├─ Full Name: "John Doe"                                        │
│    ├─ Email: "john@example.com"                                    │
│    ├─ Phone: "9876543210"                                          │
│    ├─ Password: "password123"                                      │
│    └─ Confirm: "password123"                                       │
│    ↓                                                                │
│  Client Validation:                                                │
│    ├─ All fields required? ✓                                       │
│    ├─ Email format valid? (regex check) ✓                          │
│    ├─ Password length ≥ 6? ✓                                       │
│    ├─ Passwords match? ✓                                           │
│    └─ Ready to submit? ✓                                           │
│    ↓                                                                │
│  supabase.auth.signUp({email, password})                           │
│    ├─ Supabase creates auth.users record                           │
│    ├─ Generates session token                                      │
│    └─ Returns user.id                                              │
│    ↓                                                                │
│  Insert to profiles table:                                         │
│    ├─ id: (from auth.users)                                        │
│    ├─ name: "John Doe"                                             │
│    ├─ email: "john@example.com"                                    │
│    ├─ phone: "9876543210"                                          │
│    ├─ role: "student"                                              │
│    └─ enrolled_at: (current timestamp)                             │
│    ↓                                                                │
│  Success!                                                          │
│    ├─ Show: "Account created successfully!"                        │
│    └─ Redirect: router.replace('/(auth)/login')                    │
│    ↓                                                                │
│  Result:                                                           │
│    ├─ ✓ Auth user created                                          │
│    ├─ ✓ Profile saved to database                                  │
│    ├─ ✓ User can now login                                         │
│    └─ ✓ User will NOT re-enroll again                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Returning User: Login Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    EXISTING USER LOGIN PROCESS                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Start: Login Page (app/(auth)/login.tsx)                           │
│    ↓                                                                │
│  User Enters:                                                      │
│    ├─ Email: "john@example.com"                                    │
│    └─ Password: "password123"                                      │
│    ↓                                                                │
│  Client Validation:                                                │
│    ├─ Email entered? ✓                                             │
│    ├─ Password entered? ✓                                          │
│    └─ Ready to submit? ✓                                           │
│    ↓                                                                │
│  supabase.auth.signInWithPassword({email, password})               │
│    ├─ Supabase checks auth.users                                   │
│    ├─ Verifies password (encrypted)                                │
│    ├─ Creates session token                                        │
│    ├─ Stores in AsyncStorage (React Native)                        │
│    │  OR localStorage (Web)                                        │
│    └─ Returns user data                                            │
│    ↓                                                                │
│  Check Result:                                                     │
│    ├─ Error? Show error message                                    │
│    └─ Success? Continue...                                         │
│    ↓                                                                │
│  router.replace('/(student)')                                      │
│    ├─ Root layout gets triggered                                   │
│    ├─ Session exists → Query profiles                              │
│    ├─ Get role='student'                                           │
│    └─ Navigate to student dashboard                                │
│    ↓                                                                │
│  Result:                                                           │
│    ├─ ✓ Session active                                             │
│    ├─ ✓ User logged in                                             │
│    ├─ ✓ On dashboard                                               │
│    ├─ ✓ Email visible in UI                                        │
│    └─ ✓ Session persisted locally                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Session Persistence: The Magic Part

```
┌──────────────────────────────────────────────────────────────────────┐
│              SESSION PERSISTENCE (CLOSE & REOPEN APP)               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BEFORE (Old System):                                              │
│  └─ Close app  →  All data lost  →  Reopen  →  Must re-enroll ❌  │
│                                                                      │
│  AFTER (New System):                                               │
│  │                                                                  │
│  Session Created After Login:                                      │
│    ├─ Browser: localStorage stores session token                   │
│    └─ React Native: AsyncStorage stores session token              │
│    ↓                                                                │
│  User Closes App                                                   │
│    ├─ Session token remains in storage                             │
│    └─ Nothing lost                                                 │
│    ↓                                                                │
│  User Reopens App                                                  │
│    ↓                                                                │
│  Root Layout Runs Again                                            │
│    ↓                                                                │
│  checkAuth() Calls getSession()                                    │
│    ├─ Checks AsyncStorage / localStorage                           │
│    ├─ Session token found!  ✓                                      │
│    └─ Session is VALID (not expired)                               │
│    ↓                                                                │
│  Query Profiles Table:                                             │
│    ├─ Get user's role                                              │
│    └─ Found: role='student'                                        │
│    ↓                                                                │
│  Route to Dashboard:                                               │
│    ├─ Skip login page                                              │
│    └─ Go directly to /(student)                                    │
│    ↓                                                                │
│  Result:                                                           │
│    ├─ ✓ User sees dashboard immediately                            │
│    ├─ ✓ No login needed                                            │
│    ├─ ✓ Email still shows                                          │
│    ├─ ✓ Session active  ✓                                          │
│    └─ ✓ NEVER RE-ENROLL AGAIN  ✓✓✓                                 │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Logout Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                         LOGOUT PROCESS                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  On Dashboard                                                      │
│    ↓                                                                │
│  User Taps "Logout" Button                                         │
│    ↓                                                                │
│  handleLogout() Function Runs:                                     │
│    ├─ supabase.auth.signOut()                                      │
│    │  ├─ Invalidate session token                                  │
│    │  ├─ Clear AsyncStorage / localStorage                         │
│    │  └─ Backend session invalidated                               │
│    ├─ router.replace('/(auth)/enroll')                             │
│    │  └─ Navigate back to enrollment page                          │
│    └─ Return                                                       │
│    ↓                                                                │
│  Auth State Change Detected:                                       │
│    ├─ Root layout listener: onAuthStateChange()                    │
│    ├─ Event: SIGNED_OUT                                            │
│    ├─ Session: null                                                │
│    └─ Triggers redirect to /(auth)/enroll (if needed)              │
│    ↓                                                                │
│  Result:                                                           │
│    ├─ ✓ Session token destroyed                                    │
│    ├─ ✓ Local storage cleared                                      │
│    ├─ ✓ On enrollment page                                         │
│    ├─ ✓ Must login again to access dashboard                       │
│    └─ ✓ Fresh start                                                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Where Everything Lives

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA STORAGE LOCATIONS                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SUPABASE (Cloud Database):                                         │
│  ├─ auth.users (managed by Supabase Auth)                          │
│  │  ├─ id: UUID                                                    │
│  │  ├─ email: "john@example.com"                                   │
│  │  ├─ encrypted_password: (hashed)                                │
│  │  ├─ session_tokens: (current active sessions)                   │
│  │  └─ ...other auth metadata                                      │
│  │                                                                  │
│  └─ profiles (our custom table)                                    │
│     ├─ id: UUID (FK → auth.users.id)                               │
│     ├─ name: "John Doe"                                            │
│     ├─ email: "john@example.com"                                   │
│     ├─ phone: "9876543210"                                         │
│     ├─ role: "student"                                             │
│     └─ enrolled_at: timestamp                                      │
│                                                                     │
│  LOCAL DEVICE STORAGE:                                             │
│  ├─ React Native (AsyncStorage):                                   │
│  │  └─ @supabase.auth.token: "eyJ..." (JWT token)                  │
│  │                                                                  │
│  └─ Web (localStorage):                                            │
│     └─ supabase.auth.token: "eyJ..." (JWT token)                   │
│                                                                     │
│  APP MEMORY (temporary):                                           │
│  ├─ user state (email, id)                                         │
│  ├─ loading state                                                  │
│  └─ form inputs (cleared after submit)                             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COMPONENT HIERARCHY                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  app/_layout.tsx (ROOT)                                            │
│  ├─ Checks session → Routes user                                   │
│  ├─ Sets up auth listener                                          │
│  └─ Shows loading or <Slot />                                      │
│      ├─ When logged in:                                            │
│      │  ├─ app/(student)/_layout.tsx                               │
│      │  │  └─ app/(student)/index.tsx (Dashboard)                  │
│      │  │     └─ app/(student)/attendance.tsx                      │
│      │  │     └─ app/(student)/learning-log.tsx                    │
│      │  │     └─ app/(student)/progress.tsx                        │
│      │  │     └─ ... other feature pages                           │
│      │  │                                                           │
│      │  ├─ app/(tutor)/_layout.tsx                                 │
│      │  │  └─ app/(tutor)/index.tsx                                │
│      │  │                                                           │
│      │  └─ app/(admin)/_layout.tsx                                 │
│      │     └─ app/(admin)/index.tsx                                │
│      │                                                              │
│      └─ When not logged in:                                        │
│         app/(auth)/_layout.tsx                                     │
│         ├─ app/(auth)/enroll.tsx (Signup)                          │
│         └─ app/(auth)/login.tsx (Login)                            │
│                                                                     │
│  Utility Functions:                                                │
│  └─ lib/supabase.ts (Client initialization)                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Timeline: User Experience

```
TIME 0: First App Open
├─ App loads
├─ Checks session: NONE
└─ Shows: Enrollment Page

TIME 1-2: User Enrolls
├─ Fills form
├─ Creates account
├─ Saves profile
└─ Redirects to: Login Page

TIME 3: User Logs In
├─ Enters credentials
├─ Supabase authenticates
├─ Session created
└─ Shows: Student Dashboard

TIME 4: User Closes App
├─ Session saved to device
├─ Everything still exists
└─ No data lost

TIME 5: User Reopens App (NEXT DAY/WEEK/MONTH)
├─ App loads
├─ Checks session: FOUND! ✓
├─ Queries profile for role
├─ Routes to: Student Dashboard IMMEDIATELY
└─ User sees: Dashboard (no login needed!)

TIME 6: User Taps Logout
├─ Session cleared
├─ Local storage wiped
└─ Shows: Enrollment Page

TIME 7: User Never Re-Enrolls Again
├─ If user logs in again: Just needs email + password
├─ No need to go through enrollment
└─ Perfect! ✓
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR SCENARIOS & RECOVERY                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ENROLLMENT ERRORS:                                                │
│  ├─ Empty field                                                    │
│  │  └─ Alert: "Please fill all fields"                             │
│  ├─ Invalid email                                                  │
│  │  └─ Alert: "Please enter a valid email"                         │
│  ├─ Password < 6 chars                                             │
│  │  └─ Alert: "Password must be at least 6 characters"             │
│  ├─ Passwords don't match                                          │
│  │  └─ Alert: "Passwords do not match"                             │
│  ├─ Duplicate email                                                │
│  │  └─ Alert: "User already exists" (from Supabase)                │
│  └─ Network error                                                  │
│     └─ Alert: "Failed to create account"                           │
│                                                                     │
│  LOGIN ERRORS:                                                     │
│  ├─ Empty email/password                                           │
│  │  └─ Alert: "Please fill all fields"                             │
│  ├─ Wrong email/password                                           │
│  │  └─ Alert: "Invalid login credentials"                          │
│  └─ Network error                                                  │
│     └─ Alert: "Login failed"                                       │
│                                                                     │
│  SESSION ERRORS:                                                   │
│  ├─ Session expired                                                │
│  │  └─ Route to: Login page                                        │
│  ├─ Profile not found                                              │
│  │  └─ Default role: 'student'                                     │
│  └─ Network unreachable                                            │
│     └─ Retry or show offline message                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

**Key Takeaway**: This architecture ensures users are **never asked to enroll twice**. The session persists across app closes, and the auth listener keeps everything in sync! 🎉
