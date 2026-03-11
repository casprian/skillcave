# Learning Submissions Empty Data - Debugging Guide

## Problem
`learning_submissions` table returns empty data even though submissions may exist.

## Root Causes

1. **RLS Policies Too Restrictive**: UUID type comparison issues
2. **Type Mismatch**: `auth.uid()` vs `student_id` comparison  
3. **No Data**: Table is actually empty
4. **Auth Not Authenticated**: User session not properly loaded

## Solution Overview

### Step 1: Check Browser Console
Open browser DevTools (F12) and go to **Console** tab. Look for:

```
Fetching submitted logs for student: 550e8400-e29b-41d4-a716-446655440000
Learning submissions query result: { data: [...], error: null, dataLength: 3 }
```

**If you see an error**, copy it and check the error details.

### Step 2: Run Database Fixes

Execute this in **Supabase SQL Editor**:

```sql
-- Fix 1: Update RLS policies with proper type casting
DROP POLICY IF EXISTS "students_view_own_submissions" ON learning_submissions;
CREATE POLICY "students_view_own_submissions"
ON learning_submissions FOR SELECT
USING (auth.uid()::text = student_id::text);

DROP POLICY IF EXISTS "students_insert_submissions" ON learning_submissions;
CREATE POLICY "students_insert_submissions"
ON learning_submissions FOR INSERT
WITH CHECK (auth.uid()::text = student_id::text);

-- Fix 2: Verify data exists
SELECT COUNT(*) as total_submissions FROM learning_submissions;

-- Fix 3: Check for your student ID
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- Fix 4: Check submissions for your student ID (replace with actual UUID)
SELECT COUNT(*) FROM learning_submissions WHERE student_id = 'YOUR_UUID_HERE';

-- Fix 5: Check if student_id column has right type
SELECT data_type FROM information_schema.columns 
WHERE table_name = 'learning_submissions' AND column_name = 'student_id';
```

### Step 3: Detailed Debugging Checklist

#### ✅ Check Authentication
- [ ] User is logged in (check auth tab in Supabase)
- [ ] `auth.uid()` returns a valid UUID
- [ ] User has `student` role in profiles table

#### ✅ Check Data
- [ ] Table has submissions: `SELECT COUNT(*) FROM learning_submissions;`
- [ ] Your submissions exist: `SELECT COUNT(*) FROM learning_submissions WHERE student_id = 'YOUR_UUID';`
- [ ] `student_id` values are not NULL: `SELECT COUNT(*) FROM learning_submissions WHERE student_id IS NULL;`

#### ✅ Check RLS Policies
- [ ] SELECT policy exists and is correct
- [ ] INSERT policy exists and is correct
- [ ] Type casting is using `::text` on both sides
- [ ] Run: `SELECT * FROM pg_policies WHERE tablename = 'learning_submissions';`

#### ✅ Check Query
- [ ] StudentId passed to function is valid UUID
- [ ] Console shows: `"Fetching submitted logs for student: <UUID>"`
- [ ] Console shows result or error after query

### Step 4: Fix RLS Policies (if needed)

Run this migration file in Supabase:
```
migrations/fix_learning_submissions_rls.sql
```

This ensures all UUID comparisons use `::text` casting for consistency.

### Step 5: Test Data Insertion

Try inserting a test submission directly in Supabase SQL Editor:

```sql
-- Get your actual auth UUID
SELECT auth.uid();

-- Insert a test submission (replace UUID with actual value from above)
INSERT INTO learning_submissions (
  id, 
  student_id, 
  title, 
  topic, 
  description, 
  submitted_at, 
  status, 
  submission_type,
  month_year
) VALUES (
  gen_random_uuid(),
  auth.uid(),  -- Your auth UUID
  'Test Submission',
  'React Native',
  'Testing the learning submissions system',
  CURRENT_TIMESTAMP,
  'pending',
  'open',
  DATE_TRUNC('month', CURRENT_DATE)::DATE
);

-- Verify insertion
SELECT * FROM learning_submissions 
WHERE student_id = auth.uid() 
ORDER BY submitted_at DESC LIMIT 5;
```

## Console Debug Output Examples

### ✅ Working (Data Found)
```
Fetching submitted logs for student: 550e8400-e29b-41d4-a716-446655440000
Learning submissions query result: { 
  data: [
    { id: 'xxx', title: 'My Submission', status: 'pending', ... },
    { id: 'yyy', title: 'Another One', status: 'approved', ... }
  ], 
  error: null, 
  dataLength: 2 
}
```

### ⚠️ Issue: RLS Policy Error
```
Learning submissions query result: { 
  data: null, 
  error: {
    code: "PGRST204",
    message: "The result contains no rows"
  }, 
  dataLength: undefined 
}
```
**Fix**: Run the `fix_learning_submissions_rls.sql` migration

### ⚠️ Issue: UUID Type Error
```
Learning submissions query result: { 
  data: null, 
  error: {
    code: "42804",
    message: "column \"student_id\" is of type uuid but expression is of type text"
  }, 
  dataLength: undefined 
}
```
**Fix**: Ensure student_id is being passed as a string UUID

### ⚠️ Issue: Empty Result
```
Fetching submitted logs for student: 550e8400-e29b-41d4-a716-446655440000
Learning submissions query result: { 
  data: [], 
  error: null, 
  dataLength: 0 
}
```
**Cause**: Either no submissions exist yet, or RLS is blocking access  
**Fix**: Check if submissions exist with direct SQL query

## Common Issues & Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| RLS Policy Mismatch | PGRST204 or empty results | Run `fix_learning_submissions_rls.sql` |
| UUID Type Error | 42804 error | Ensure type casting with `::text` |
| Not Authenticated | Cannot query any data | Check auth session, re-login |
| No Data | Empty array returned | Insert test data, check if submissions exist |
| Wrong User ID | Seeing other users' data | Check RLS policy USING conditions |
| Student ID NULL | Null student_id in data | Check INSERT policy, ensure student_id provided |

## Files to Check

1. **Learning Submissions Migration**: `migrations/learning_submissions_migration.sql`
   - Verify RLS policies are defined
   - Check student_id column type is UUID

2. **RLS Fix Migration**: `migrations/fix_learning_submissions_rls.sql` (NEW)
   - Apply this to fix type casting issues

3. **Code**: `app/(student)/learning-log.tsx`
   - `fetchSubmittedLogs()` function
   - Check console logs for debugging

## Next Steps

1. **Open console** (F12) in your app
2. **Look for the logs** about fetching submissions
3. **If error occurs**, copy the error and use this guide to troubleshoot
4. **If empty result**, run the SQL debugging queries above
5. **If still issues**, run the `fix_learning_submissions_rls.sql` migration
6. **Test again** - you should now see your submissions

## Direct SQL Queries (for manual testing)

```sql
-- Query 1: Check if you're authenticated
SELECT auth.uid() as your_uuid;

-- Query 2: Find your profile
SELECT id, email, role FROM profiles 
WHERE email = 'your.email@example.com';

-- Query 3: See your submissions
SELECT id, title, status, submitted_at FROM learning_submissions 
WHERE student_id = auth.uid()
ORDER BY submitted_at DESC;

-- Query 4: Check RLS policy (as authenticated user)
SELECT * FROM learning_submissions 
WHERE student_id = auth.uid();

-- Query 5: Debug - see all submissions (admin only)
SELECT student_id, COUNT(*) FROM learning_submissions 
GROUP BY student_id;
```

## Performance Considerations

- ✅ Index on `student_id` exists (created in learning_submissions_migration.sql)
- ✅ Index on `submitted_at` exists for sorting
- ✅ Should be fast even with hundreds of submissions

## Need More Help?

1. Check the console logs from the detailed output above
2. Run the SQL debugging queries in Supabase
3. Compare your error with the "Common Issues" table
4. Verify the migration file was applied
5. Ensure RLS policies are enabled on the table
