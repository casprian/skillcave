# Tutor Selection Fix - Complete Solution

## Problem Identified
Error: `invalid input syntax for type uuid: "7"` when selecting a tutor

### Root Cause
The tutor selection system had multiple issues:

1. **Query Column Mismatch**: Query used `full_name` column which doesn't exist in profiles table (should be `name`)
2. **Non-existent Column**: Query included `specialization` field that doesn't exist
3. **UUID Type Mismatch**: 
   - `profiles.id` is BIGINT (e.g., `7`)
   - `learning_submissions.submitted_to_tutor` expects UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
   - When selecting a tutor from profiles, their BIGINT ID was being inserted into a UUID field

## Solution Implemented

### 1. Database Migration
**File**: `migrations/add_auth_id_to_profiles.sql`

Adds `auth_id` UUID column to profiles table:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID;

UPDATE profiles 
SET auth_id = au.id 
FROM auth.users au 
WHERE profiles.email = au.email 
AND profiles.auth_id IS NULL;
```

This allows profiles to store the correct UUID reference to auth.users.

### 2. Code Changes
**File**: `app/(student)/learning-log.tsx`

#### Updated Tutor Interface
```typescript
interface Tutor {
  id: string;              // BIGINT from profiles.id
  name: string;            // Correct column name
  email: string;
  auth_id?: string | null; // UUID from auth.users (NEW)
}
```

#### Fixed Tutor Query
```typescript
// Before: SELECT id, email, full_name as name, specialization (❌ columns don't exist)
// After:
const { data: tutorsData, error: tutorsError } = await supabase
  .from('profiles')
  .select('id, email, name, auth_id')  // ✅ Correct columns
  .eq('role', 'tutor');
```

#### Added Helper Function
```typescript
async function getTutorAuthId(email: string): Promise<string | null> {
  // Fetches auth UUID by tutor email as fallback
}
```

#### Updated Submission Logic
```typescript
// Before: submitted_to_tutor: selectedTutor?.id (BIGINT - causes UUID error!)
// After:
const tutorUUID = selectedTutor.auth_id || await getTutorAuthId(selectedTutor.email);
const submissionData = {
  student_id: user?.id?.toString(),
  submitted_to_tutor: tutorUUID,  // ✅ Now uses UUID
  // ...
};
```

## Implementation Steps

### Step 1: Run Migration
Execute this SQL in Supabase SQL Editor:
```sql
-- Add auth_id column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_id UUID;

-- Populate auth_id for existing users
UPDATE profiles 
SET auth_id = au.id 
FROM auth.users au 
WHERE profiles.email = au.email 
AND profiles.auth_id IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_profiles_auth_id ON profiles(auth_id);
```

### Step 2: Deploy Code Changes
The code changes are already in `app/(student)/learning-log.tsx`:
- Updated tutor query with correct column names
- Added `auth_id` handling in interface and submission logic
- Added helper function for fetching auth UUIDs
- Added debugging logs

### Step 3: Test Tutor Selection

1. **Open Learning Log page**
2. **Select "Targeted Submission"**
3. **Click "Select Your Tutor"**
4. **Verify in browser console**:
   - Should see: `"Tutors query result: { tutorsData: [...], tutorsError: null, length: X }"`
   - Tutors list should populate with names
5. **Select a tutor and submit**
   - Submission should complete without UUID error
   - Profile should show submission status as "pending"

## Debugging

### Console Logs Added
```javascript
console.log('Attempting to fetch tutors...');
console.log('Tutors query result:', { tutorsData, tutorsError, length: tutorsData?.length });
console.log('Setting tutors:', tutorsData);
console.log('No tutors found in database');
```

### If Tutors Not Appearing
1. Check database: Verify tutors exist with `role='tutor'` and `name` field populated
2. Check console: Look for error messages in "Tutors query result"
3. Alternative query: Try basic profile fetch to test connectivity

### If Submission Fails with UUID Error
1. Verify migration was run
2. Check that `auth_id` column was created: `SELECT COUNT(*) FROM information_schema.columns WHERE table_name='profiles' AND column_name='auth_id'`
3. Verify auth_id values populated: `SELECT COUNT(*) FROM profiles WHERE auth_id IS NOT NULL AND role='tutor'`

## Type Safety

All changes are fully TypeScript typed:
- ✅ Tutor interface properly defines all fields
- ✅ Helper function has proper return type
- ✅ Submission data type-checked
- ✅ No `any` types used in new code

## Backwards Compatibility

- ✅ Existing submissions continue to work
- ✅ 'open' submission type unaffected
- ✅ Migration is safe: adds column, doesn't modify existing data
- ✅ Helper function gracefully handles missing auth_id

## Files Modified

1. `migrations/add_auth_id_to_profiles.sql` (NEW)
   - Adds auth_id column and populates from auth.users

2. `app/(student)/learning-log.tsx`
   - Fixed tutor query: `full_name` → `name`, removed `specialization`
   - Updated Tutor interface: added `auth_id` field
   - Added `getTutorAuthId()` helper function
   - Fixed submission: uses auth_id instead of profile bigint id
   - Added debugging logs
   - Fixed JSX lint: escaped apostrophe

## Performance

- ✅ Tutor query uses existing indexes
- ✅ New auth_id index created for fast lookups
- ✅ Helper function uses `maybeSingle()` for efficient query
- ✅ No N+1 queries: auth_id fetched with initial tutor load

## Next Steps

1. Run migration in Supabase
2. Test tutor selection in app
3. Verify submissions work with specific tutors
4. Monitor error logs for any UUID-related errors
5. Update tutor profile display if needed (show specialization/bio)
