# Session Persistence Debugging - Complete Summary

## Problem Statement
- **Mobile Device**: After login, user is redirected to student dashboard but sees "user not found" error
- **Browser**: Everything works smoothly
- **Root Cause**: Session not persisting from AsyncStorage on mobile device

## Root Causes Identified

### 1. **Platform Detection Issue**
- Original detection: `typeof navigator === 'undefined' && typeof window === 'undefined'`
- Problem: May not accurately detect Expo/React Native in all environments
- Fixed: Enhanced detection to check for Expo-specific conditions

### 2. **AsyncStorage Not Properly Initialized**
- Supabase client needs to use AsyncStorage for React Native apps
- Session persists to AsyncStorage during login
- But on app restart, AsyncStorage may not be fully initialized when getSession() is called
- Fixed: Added better initialization logging and error handling

### 3. **Session Timing Issues**
- getSession() may be called before AsyncStorage is ready
- No retry mechanism on initial app load
- Fixed: Added 3-attempt retry logic with 1-second delays

### 4. **Missing Visibility Into Flow**
- No way to see what's happening during auth
- Debug text shown but no console output visible
- Fixed: Added comprehensive logging at every step

## Files Modified

### 1. **lib/supabase.ts** - Supabase Client Initialization
**Key Changes:**
- Improved platform detection for Expo/React Native
- Added logging for AsyncStorage initialization
- Logs when client is created with proper storage option

**New Logs:**
```
✅ [Supabase] AsyncStorage loaded for React Native
ℹ️ [Supabase] Web platform detected - using localStorage
📡 [Supabase] Initializing client (Platform: React Native/Web)
⚠️ [Supabase] React Native detected but AsyncStorage not available
💥 [Supabase] Failed to initialize Supabase client
```

### 2. **app/_layout.tsx** - Root Layout
**Key Changes:**
- Enhanced auth check logging
- Shows user email and session expiration
- Logs detailed errors from getSession()

**New Logs:**
```
🔐 [RootLayout] Starting auth check...
✅ [RootLayout] Auth check complete - User found: user@email.com
   - User ID: 12345
   - Session expires: 2026-01-15T10:30:45.000Z
📭 [RootLayout] Auth check complete - No user session
```

### 3. **app/index.tsx** - Entry Point Routing
**Key Changes:**
- Retry logic: 3 attempts with 1-second delays between attempts
- Shows debug text on screen while checking
- Logs each attempt with detailed info

**New Logs:**
```
🔐 [Index] Starting auth check...
🔄 [Index] Attempt 1/3...
✅ [Index] Session found (attempt 1):
   - User ID: 12345
   - Email: user@email.com
   - Auth method: default
👤 [Index] User authenticated: user@email.com
✅ [Index] Redirecting to student dashboard

OR (if fails):

📭 [Index] No session found (attempt 1)
⏳ [Index] Waiting 1s before retry...
🚫 [Index] No session found after 3 attempts
```

### 4. **app/(auth)/login.tsx** - Login Screen
**Key Changes:**
- Logs session data after successful login
- Verifies session was saved with getSession() immediately after login
- Shows what data is present in session

**New Logs:**
```
✅ Login successful for: user@email.com
User ID: 12345
📦 Session data:
  sessionToken: ✅ Present
  sessionExpires: 2026-01-15T10:30:45.000Z
  accessToken: ✅ Present
📝 [Login] Verifying session save:
   ✅ Session saved for: user@email.com
🔄 Navigating to dashboard: /(student)
```

### 5. **app/(student)/index.tsx** - Dashboard
**Key Changes:**
- Enhanced error logging for getUser()
- Shows troubleshooting checklist
- Helps identify where session is lost

**New Logs:**
```
✅ [Dashboard] User found: user@email.com
OR:
❌ [Dashboard] getUser() error: <error message>
❌ [Dashboard] User not found - authUser is null
💡 [Dashboard] Check:
   1. Is session persisted in AsyncStorage?
   2. Did user complete login successfully?
   3. Is user still authenticated at app/index.tsx level?
```

## Testing Instructions

### Step 1: Start Expo
```bash
cd /Users/kashifdelvi/Desktop/GIT_PROJECTS/react_native/SkillCaveApp
npx expo start --clear --no-dev-client
```
- Press `s` to switch to Expo Go

### Step 2: Scan QR Code
- Open Expo Go on Android device
- Scan the QR code shown in terminal

### Step 3: Wait for App to Load
- Watch both the terminal output and the phone screen
- Note the sequence of log messages

### Step 4: Try to Login
- Use test credentials: `casprian3@gmail.com` / password
- Or any valid credentials from your test database

### Step 5: Analyze Console Output
Use the following flowchart to debug:

```
START: App loads on mobile

EXPECT TO SEE:
  1. "✅ [Supabase] AsyncStorage loaded for React Native" OR
     "⚠️ [Supabase] React Native detected but AsyncStorage not available"
     → If warning: AsyncStorage package may not be installed/working

  2. "🔐 [RootLayout] Starting auth check..."
  3. "✅ [RootLayout] Auth check complete - User found: ..." OR
     "📭 [RootLayout] Auth check complete - No user session"
     → If no user found: Session not in AsyncStorage from previous login

  4. "✅ [RootLayout] Ready to render"
  5. "🔐 [Index] Starting auth check..."
  6. "✅ [Index] Session found (attempt 1): ..." OR
     "📭 [Index] No session found (attempt 1)"
     → If not found: Retry will try 2 more times

  7. IF RETRY NEEDED:
     "⏳ [Index] Waiting 1s before retry..."
     "🔄 [Index] Attempt 2/3..."
     (may repeat up to 3 times)

  8. IF SESSION FOUND:
     "✅ [Index] Redirecting to student dashboard"
     "📊 Loading dashboard..."
     "✅ [Dashboard] User found: user@email.com"
     ✅ DASHBOARD SHOULD SHOW

  9. IF SESSION NOT FOUND:
     "🚫 [Index] No session found after 3 attempts"
     "🔄 [Index] Redirecting to login"
     → Go back to step "Try to Login"
```

## Troubleshooting Guide

### Issue 1: "React Native detected but AsyncStorage not available"
**Cause**: AsyncStorage package not properly imported
**Solution**:
1. Verify package is installed: `npm list @react-native-async-storage/async-storage`
2. If missing, install: `npm install @react-native-async-storage/async-storage`
3. Rebuild Expo: `npx expo start --clear`

### Issue 2: "No user session" in RootLayout but "Session found" in Index
**Cause**: Session not fully persisted yet or timing issue
**Solution**:
- This is actually okay - the retry mechanism in index.tsx will handle it
- Increase delay in root layout if still seeing issues

### Issue 3: "Session found" in Index but "User not found" in Dashboard
**Cause**: Session exists but getUser() fails
**Solution**:
1. Check if Supabase credentials are correct
2. Check if user actually exists in Supabase auth table
3. May need to add better error handling in dashboard

### Issue 4: Login screen shows "Session saved" but then "user not found"
**Cause**: Session saved but not readable on next load
**Solution**:
1. Session may be expiring: check expiration time in logs
2. AsyncStorage may not be persisting properly
3. May need to implement session refresh logic

### Issue 5: Only see spinner, no debug text
**Cause**: Debug text may be white on white background or cut off
**Solution**:
1. Look at terminal - all logs should show there
2. Verify text is visible on phone screen
3. May need to adjust Text styling

## Expected Console Output - Good Case

```
ℹ️ [Supabase] Web platform detected - using localStorage
📡 [Supabase] Initializing client (Platform: React Native)
🔐 [RootLayout] Starting auth check...
📭 [RootLayout] Auth check complete - No user session
✅ [RootLayout] Ready to render
🔐 [Index] Starting auth check...
🔄 [Index] Attempt 1/3...
📭 [Index] No session found (attempt 1)
⏳ [Index] Waiting 1s before retry...
🔄 [Index] Attempt 2/3...
📭 [Index] No session found (attempt 2)
⏳ [Index] Waiting 1s before retry...
🔄 [Index] Attempt 3/3...
📭 [Index] No session found (attempt 3)
🚫 [Index] No session found after 3 attempts
🔄 [Index] Redirecting to login

[User enters credentials and clicks login]

📝 Attempting login with email: casprian3@gmail.com
📬 Login response received
✅ Login successful for: casprian3@gmail.com
User ID: xxxxx
📦 Session data:
  sessionToken: ✅ Present
  sessionExpires: 2026-01-15T10:30:45.000Z
  accessToken: ✅ Present
User role: tutor
📝 [Login] Verifying session save:
   ✅ Session saved for: casprian3@gmail.com
🔄 Navigating to dashboard: /(tutor)

[App redirects to tutor dashboard]

🔐 [RootLayout] Starting auth check...
✅ [RootLayout] Auth check complete - User found: casprian3@gmail.com
   - User ID: xxxxx
   - Session expires: 2026-01-15T10:30:45.000Z
✅ [RootLayout] Ready to render
🔐 [Index] Starting auth check...
🔄 [Index] Attempt 1/3...
✅ [Index] Session found (attempt 1):
   - User ID: xxxxx
   - Email: casprian3@gmail.com
   - Auth method: default
👤 [Index] User authenticated: casprian3@gmail.com
✅ [Index] Redirecting to student dashboard

[Dashboard loads successfully - NO "user not found" message]
```

## Expected Console Output - Bad Case

```
[Same as Good Case until login]

✅ Login successful for: casprian3@gmail.com
User ID: xxxxx
📦 Session data:
  sessionToken: ✅ Present
  sessionExpires: 2026-01-15T10:30:45.000Z
  accessToken: ✅ Present
User role: tutor
📝 [Login] Verifying session save:
   ❌ Session not found after login          ← PROBLEM: Session not being saved!

[OR:]

⚠️ [Supabase] React Native detected but AsyncStorage not available
   → AsyncStorage not initialized

[OR:]

🚫 [Index] No session found after 3 attempts
❌ [Dashboard] User not found - authUser is null
💡 [Dashboard] Check:
   1. Is session persisted in AsyncStorage?  ← YES, investigate this
   2. Did user complete login successfully?  ← YES, see above
   3. Is user still authenticated at app/index.tsx level? ← NO
   → Session exists but not retrievable on restart
```

## Next Steps After Testing

1. **Share Console Output**
   - Copy ALL console logs from terminal
   - Include exactly what's shown on phone screen
   - Include timing (when it appears)

2. **Based on Output, Implementation of Fix**
   - If AsyncStorage not loading: Install/import correctly
   - If session not found: Increase retry logic
   - If session expired: Implement refresh token logic
   - If partial success: Debug specific missing piece

3. **Once Session Working**
   - Re-enable RLS on learning_submissions
   - Implement proper filtering for tutors
   - Add error boundaries for production readiness

## Key Metrics to Monitor

- **Supabase platform detection**: React Native vs Web
- **AsyncStorage availability**: Loaded vs Warning vs Missing
- **Session persistence**: Saved vs Not found
- **Retry attempts**: How many needed before success
- **Time to auth**: How long from app load to authenticated state
