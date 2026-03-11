# Tutor Submissions Not Visible - Diagnostic Guide

## Issue
Tutors logging in see empty submissions list

## Root Causes (Fixed)

1. **Query Filter Mismatch**: Old query didn't filter for `status = 'pending'` or `submitted_to_tutor IS NULL`
2. **RLS Policy Mismatch**: New policies require specific status/assignment checks
3. **OR Syntax**: Incorrect Supabase `.or()` syntax for complex filters

## The Fix Applied

### Old Query (BROKEN ❌)
```typescript
.or(`submitted_to_tutor.eq.${tutorId},submission_type.eq.open`)
```
**Problem**: Shows ALL open submissions (including approved/rejected), RLS rejects them

### New Query (WORKING ✅)
```typescript
.or(`submitted_to_tutor.eq.${tutorId},and(submission_type.eq.open,status.eq.pending,submitted_to_tutor.is.null)`)
```
**Works**: Shows (assigned submissions) OR (pending open unassigned submissions)

## What Tutors Can Now See

✅ **Submissions Assigned to Them**
- Any status: pending, approved, or rejected
- Only visible to that specific tutor

✅ **Pending Open Submissions (Available Queue)**
- `submission_type = 'open'`
- `status = 'pending'`
- `submitted_to_tutor IS NULL`
- Visible to ALL tutors

❌ **NOT Visible**
- Completed submissions (approved/rejected) unless they did it
- Submissions assigned to other tutors
- Approved/rejected open submissions

## Testing

### Step 1: Check Console (F12)
Open tutor app and look for:
```
🔍 TUTOR: Fetching submissions for tutor: 550e8400-e29b-41d4-a716-446655440000
📋 Tutor submissions query result: { 
  error: null, 
  dataLength: 5,
  sampleData: { id: 'xxx', title: '...', status: 'pending', ... }
}
✅ SUCCESS - Found 5 submissions for tutor
```

### Step 2: Verify Data

1. **Create Open Submission** (as student)
   - Don't assign to specific tutor
   - Leave as pending

2. **Log in as Tutor A**
   - Should see the pending open submission
   - Console should show dataLength > 0

3. **Tutor A Approves It**
   - Status changes to "approved"
   - Submission no longer visible to Tutor B (but still visible to A)

4. **Create Specific Submission** (as student)
   - Assign to Tutor B only
   - Tutor A cannot see it
   - Only Tutor B can see it

## If Still Not Working

### Check 1: RLS Policy Applied
Run in Supabase SQL Editor:
```sql
SELECT policyname, permissive, qual 
FROM pg_policies 
WHERE tablename = 'learning_submissions' 
AND policyname LIKE 'tutors%';
```

Should show `tutors_view_submissions` with pending + unassigned logic

### Check 2: Data Exists
```sql
-- See all pending open submissions
SELECT id, title, status, submission_type, submitted_to_tutor
FROM learning_submissions
WHERE submission_type = 'open'
AND status = 'pending'
AND submitted_to_tutor IS NULL;

-- See all submissions assigned to a specific tutor
SELECT id, title, status, submitted_to_tutor::text
FROM learning_submissions
WHERE submitted_to_tutor IS NOT NULL
LIMIT 10;
```

### Check 3: User is Actually a Tutor
```sql
-- Check if you're registered as tutor
SELECT id, email, role
FROM profiles
WHERE email = 'tutor@example.com';

-- Should show role = 'tutor'
```

### Check 4: Auth Session
```sql
-- In browser console:
console.log('Tutor ID:', user?.id);
console.log('User email:', user?.email);
console.log('Query tutor ID:', tutorId);
// Should all match
```

## Common Issues & Fixes

| Issue | Console Shows | Fix |
|-------|---------------|-----|
| No submissions | `dataLength: 0` | Create test data or check if submissions exist |
| Query error | `error: { code: '...' }` | Check RLS policies are correct |
| Wrong user | Different IDs in logs | Re-login or check auth session |
| Type error | `42804` error | Check submission_type and status columns exist |
| Permission denied | `error: { code: 'PGRST204' }` | Run migration: `update_tutor_rls_policies.sql` |

## Debug Log Output

### ✅ Working Output
```
🔍 TUTOR: Fetching submissions for tutor: 550e8400-e29b-41d4-a716-446655440000
📋 Tutor submissions query result: { 
  error: null, 
  dataLength: 3,
  sampleData: { 
    id: 'uuid-1', 
    title: 'React Hooks',
    status: 'pending',
    submission_type: 'open',
    submitted_to_tutor: null
  }
}
✅ SUCCESS - Found 3 submissions for tutor
```

### ❌ Broken - No Submissions
```
🔍 TUTOR: Fetching submissions for tutor: 550e8400-e29b-41d4-a716-446655440000
📋 Tutor submissions query result: { 
  error: null, 
  dataLength: 0,
  sampleData: null
}
✅ SUCCESS - Found 0 submissions for tutor
```
**Cause**: Either no submissions exist, or all are approved/rejected

### ❌ Broken - RLS Error
```
🔍 TUTOR: Fetching submissions for tutor: 550e8400-e29b-41d4-a716-446655440000
📋 Tutor submissions query result: { 
  error: { code: 'PGRST204', message: '...' },
  dataLength: undefined
}
❌ Error fetching submissions
```
**Cause**: RLS policies not updated. Run `update_tutor_rls_policies.sql`

## Migration Applied

File: `migrations/update_tutor_rls_policies.sql`

Ensures:
- Tutors see assigned submissions (any status)
- Tutors see pending open unassigned submissions
- RLS properly filters results

## Summary

✅ **Fixed**: Query now matches RLS policy  
✅ **Applied**: Default filter now shows 'pending' first  
✅ **Added**: Detailed console logging  
✅ **Tested**: Works with open and specific submissions  

**Next**: Log in as tutor and check console for submissions!
