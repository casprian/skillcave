# Mobile Session Not Found - Debug Checklist

## Problem Summary
- ✅ App works smoothly in browser after login
- ✅ No flickering on app startup
- ❌ Mobile device shows "user not found" after login
- Hypothesis: AsyncStorage not properly persisting/retrieving session on mobile

## Changes Made This Session

### 1. **lib/supabase.ts** - Enhanced Platform Detection & AsyncStorage
- Improved React Native platform detection (checks for Expo environment)
- Added comprehensive logging for AsyncStorage initialization
- Added logging for storage selection (AsyncStorage vs localStorage)
- Logs now show:
  - ✅ AsyncStorage loaded for React Native
  - ℹ️ Web platform detected - using localStorage
  - 📡 Initializing client (Platform: React Native/Web)
  - ❌ Failed to initialize Supabase client

### 2. **app/_layout.tsx** - Root Auth Check Logging
- Enhanced error handling in `initAuth()` function
- Now logs:
  - User email when found
  - User ID
  - Session expiration time
  - Detailed error messages
- Helps diagnose: "Is the session being retrieved from AsyncStorage?"

### 3. **app/index.tsx** - Session Check with Enhanced Retry
- Added `debugInfo` state to show on loading screen
- Retry mechanism: 3 attempts with 1 second delays
- Each attempt logs:
  - Attempt number (1/2/3)
  - User ID and email when found
  - Auth method/provider
  - Detailed error messages
- Shows debug text on loading screen instead of just spinner
- Helps diagnose: "Which attempt fails? What's the exact error?"

### 4. **app/(student)/index.tsx** - Dashboard Auth Debugging
- Enhanced `getUser()` error handling
- Now logs:
  - Exact error from getUser()
  - Checklist of things to verify:
    1. Is session persisted in AsyncStorage?
    2. Did user complete login successfully?
    3. Is user still authenticated at app/index.tsx level?
- Helps diagnose: "Where in the flow does the session get lost?"

## How to Test

### Step 1: Start Expo
```bash
cd /Users/kashifdelvi/Desktop/GIT_PROJECTS/react_native/SkillCaveApp
npx expo start --clear
```
Press `s` to switch to Expo Go

### Step 2: Open in Expo Go
- Scan QR code on Android device
- Wait for app to load

### Step 3: Watch Console Logs
Look for these key messages in order:

**On app startup:**
```
✅ [Supabase] AsyncStorage loaded for React Native
📡 [Supabase] Initializing client (Platform: React Native)
🔐 [RootLayout] Starting auth check...
✅ [RootLayout] Auth check complete - User found: user@email.com
   - User ID: xxxxx
   - Session expires: 2026-01-XX...
✅ [RootLayout] Ready to render
🔐 [Index] Starting auth check...
🔄 [Index] Attempt 1/3...
✅ [Index] Session found (attempt 1):
   - User ID: xxxxx
   - Email: user@email.com
👤 [Index] User authenticated: user@email.com
✅ [Index] Redirecting to student dashboard
📊 Loading dashboard...
✅ [Dashboard] User found: user@email.com
```

### Step 4: Troubleshoot Based on Logs

**Scenario A: "AsyncStorage loaded" but session not found**
- Issue: AsyncStorage not correctly storing/retrieving session
- Fix: Check if session is actually being saved during login

**Scenario B: "Auth check complete - No user session" in RootLayout**
- Issue: Session not being retrieved from AsyncStorage on app startup
- Root cause: Either AsyncStorage not saving session or not initialized in time
- Fix: May need to add wait for AsyncStorage initialization

**Scenario C: "No session found after 3 attempts" in Index**
- Issue: getSession() not finding the session even after retries
- Root cause: Supabase client not configured to use AsyncStorage
- Fix: Check if AuthOptions are correctly set in supabase.ts

**Scenario D: "User found" in Index but "User not found" in Dashboard**
- Issue: Session exists at routing level but getUser() fails when fetching dashboard
- Root cause: Session may have expired between checks or getUser() requires different auth state
- Fix: Dashboard should also use getSession() first, then getUser()

## Key Files Modified
1. `/lib/supabase.ts` - Supabase client initialization with better logging
2. `/app/_layout.tsx` - Root layout auth check
3. `/app/index.tsx` - Session check with retry logic
4. `/app/(student)/index.tsx` - Dashboard auth fetch with detailed errors

## Console Log Patterns to Look For

### ✅ Good (Session Found)
```
✅ [Index] Session found (attempt 1):
   - User ID: 12345
   - Email: user@email.com
👤 [Index] User authenticated: user@email.com
✅ [Index] Redirecting to student dashboard
✅ [Dashboard] User found: user@email.com
```

### ❌ Bad (Session Not Found)
```
📭 [Index] No session found (attempt 1)
⏳ [Index] Waiting 1s before retry...
📭 [Index] No session found (attempt 2)
...
🚫 [Index] No session found after 3 attempts
```

### ⚠️ Warning (Storage Not Available)
```
⚠️ [Supabase] React Native detected but AsyncStorage not available
```

## Environment Check
Before testing, verify `.env.local` has these variables:
```
EXPO_PUBLIC_SUPABASE_URL=<your_url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your_key>
```

If these are missing, the Supabase client won't initialize and all auth will fail.

## Next Steps After Testing
1. **If Session Found**: Debug why dashboard still shows "user not found"
   - May need to update dashboard to handle session better
   
2. **If Session Not Found After 3 Attempts**: 
   - Debug if AsyncStorage is actually being used
   - Add logging to see what's stored in AsyncStorage
   - Check Supabase auth options
   
3. **If AsyncStorage Warning**:
   - Verify @react-native-async-storage/async-storage is installed
   - Check if import is working correctly

## Production Next Steps
1. Re-enable RLS on learning_submissions table
2. Add proper filtering for tutor-specific submissions
3. Implement session refresh logic
4. Add error boundaries for better error handling
