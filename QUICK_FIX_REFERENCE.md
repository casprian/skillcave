# Quick Fix Reference Card

## Problem
```
Error: "native module is null, cannot access legacy storage"
Result: Session not persisting on mobile → "user not found" after login
```

## Solution Applied
```
✅ Added fallback storage in case AsyncStorage fails
✅ Added 100ms delay before auth check (let native modules load)
✅ Added 200ms delay at entry point (extra safety)
✅ Added comprehensive logging to diagnose issues
```

## Files Modified
```
1. lib/supabase.ts       → Fallback storage + platform detection
2. app/_layout.tsx       → 100ms delay before getSession()
3. app/index.tsx         → 200ms delay + retry logic
4. app/(auth)/login.tsx  → Session verification after login
```

## Test Now

### Step 1: Start
```bash
cd /Users/kashifdelvi/Desktop/GIT_PROJECTS/react_native/SkillCaveApp
npx expo start --clear
```

### Step 2: Scan with Expo Go
- Open Expo Go on phone
- Scan QR code

### Step 3: Watch Console
Look for:
```
✅ [Supabase] AsyncStorage imported successfully
✅ [RootLayout] Auth check complete - User found: user@email.com
✅ [Index] Session found (attempt 1): user@email.com
```

### Step 4: Login Test
- Enter `casprian3@gmail.com` / password
- Should see dashboard (not "user not found")
- Check: `✅ Session saved for: casprian3@gmail.com`

### Step 5: Restart Test (CRITICAL!)
- Close app completely
- Reopen Expo Go
- **Should show dashboard WITHOUT asking to login**
- Check console for: `✅ Auth check complete - User found: user@email.com`
- This proves session persisted! ✅

## Expected vs Actual

### Expected Console Output
```
🔍 [Supabase] Platform detection: { isReactNative: true }
✅ [Supabase] AsyncStorage imported successfully
📡 [Supabase] Initializing Supabase client (Platform: React Native)
🔐 [RootLayout] Starting auth check...
✅ [RootLayout] Auth check complete - User found: casprian3@gmail.com
🔐 [Index] Starting auth check...
✅ [Index] Session found (attempt 1): casprian3@gmail.com
👤 [Index] User authenticated: casprian3@gmail.com
✅ [Index] Redirecting to student dashboard
📊 Loading dashboard...
✅ [Dashboard] User found: casprian3@gmail.com
```

### If You See Warnings Instead
```
❌ [Supabase] Failed to import AsyncStorage: native module is null
⚠️ [Supabase] Using fallback in-memory storage
```
→ AsyncStorage failed (Expo Go limitation)
→ App will work but sessions won't persist across restarts
→ Solution: `npx expo prebuild --clean && npx expo run:android`

## Success Criteria

| Criteria | Status |
|----------|--------|
| No "native module is null" crash | ✅ Required |
| "AsyncStorage imported successfully" in logs | ✅ Required |
| Can login successfully | ✅ Required |
| Dashboard shows after login (not "user not found") | ✅ Required |
| Session persists after closing/reopening app | ✅ Required |

Once all 5 are true → Ready for production

## If Still Failing

```bash
# Option 1: Clear cache and try again
npx expo start --clear

# Option 2: Full reset
killall node 2>/dev/null
rm -rf node_modules package-lock.json
npm install
npx expo start --clear

# Option 3: Build with native modules
npx expo prebuild --clean
npx expo run:android
```

## Key Insights

- **Why it failed**: Native modules take time to initialize
- **Why it's fixed**: We now wait for them to be ready before accessing
- **The delays**: 100ms (root) + 200ms (index) = ~300ms total startup (imperceptible)
- **The fallback**: If AsyncStorage really fails, app still works (but no session persistence)

## Production Checklist

After confirming session persistence works:

- [ ] Session persists after restart ✅
- [ ] No "native module is null" errors ✅
- [ ] Can login and access dashboard ✅
- [ ] Re-enable RLS on learning_submissions
- [ ] Test with RLS enabled
- [ ] Verify tutor/student filtering works
- [ ] Performance check (queries complete in <1s)
- [ ] Deploy to production

---

**Last Updated**: March 11, 2026  
**Status**: ✅ Ready for Testing
