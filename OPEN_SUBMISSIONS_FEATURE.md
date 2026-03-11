# Open Submissions Visibility - Implementation Complete

## Feature Implemented
**All tutors can now see and review pending open submissions that are not assigned to any specific tutor.**

## How It Works

### Submission Types
1. **Specific Submission** (`submission_type = 'specific'`)
   - Submitted to a particular tutor
   - Only that tutor can see it
   - Only that tutor can approve/reject it

2. **Open Submission** (`submission_type = 'open'`)
   - Not submitted to any particular tutor
   - **Pending state**: ALL tutors can see and review it
   - **Approved/Rejected state**: Only visible to tutors who reviewed it

### RLS Policy Logic

```sql
-- Tutors can view if:
(submitted_to_tutor = auth.uid())  -- They're assigned this submission
OR
(
  submission_type = 'open'           -- It's an open submission
  AND status = 'pending'             -- AND it's still pending
  AND submitted_to_tutor IS NULL     -- AND no tutor is assigned
)
```

## Database State

### Before (Old Logic)
- Tutors saw: assignments + any open submission
- **Problem**: Could see non-pending submissions they shouldn't

### After (New Logic)
- Tutors see: assignments + pending-only unassigned submissions
- **Benefit**: Clean queue of work available to any tutor

## Implementation Steps

### Step 1: Apply Migration
Run in Supabase SQL Editor:
```
migrations/update_tutor_rls_policies.sql
```

This will:
- Drop old tutor policies
- Create new policies with pending+unassigned logic
- Preserve specific tutor assignments

### Step 2: Test in Tutor App

1. **Create an open submission** (as student)
   - Leave submission as "pending" status
   - Don't assign to any tutor

2. **Log in as any tutor**
   - Should see the pending open submission in their list
   - Can review and approve/reject it

3. **Create a specific submission** (as student)
   - Assign to Tutor A
   - Only Tutor A can see it
   - Other tutors cannot see it ✓

4. **Create and approve an open submission**
   - Tutor B approves it (status → 'approved')
   - Other tutors can no longer see it ✓

## Data Flow

```
Student Creates Submission
    ↓
├─ submission_type = 'open', submitted_to_tutor = NULL
│  ├─ status = 'pending'
│  │  └─ ✅ ALL tutors can see (in queue)
│  ├─ status = 'approved'
│  │  └─ ❌ Only approving tutor can see (archived)
│  └─ status = 'rejected'
│     └─ ❌ Only rejecting tutor can see (archived)
│
└─ submission_type = 'specific', submitted_to_tutor = [UUID]
   └─ ✅ ONLY assigned tutor can see
```

## Files Modified

1. **FIX_RLS_POLICIES.sql**
   - Updated tutor SELECT and UPDATE policies
   - Added pending + unassigned check

2. **migrations/update_tutor_rls_policies.sql** (NEW)
   - Complete migration with new RLS policies
   - Ready to apply to production

## Testing Queries

```sql
-- See ALL pending open submissions (available to all tutors)
SELECT id, title, status, submitted_to_tutor, submission_type
FROM learning_submissions
WHERE submission_type = 'open'
AND status = 'pending'
AND submitted_to_tutor IS NULL;

-- See submissions assigned to specific tutor
SELECT id, title, status, submitted_to_tutor
FROM learning_submissions
WHERE submitted_to_tutor = auth.uid();

-- What a specific tutor can see
SELECT id, title, status, submitted_to_tutor, submission_type
FROM learning_submissions
WHERE 
  -- Assigned to them
  (submitted_to_tutor = auth.uid())
  OR
  -- OR open pending unassigned
  (submission_type = 'open' AND status = 'pending' AND submitted_to_tutor IS NULL);
```

## Benefits

✅ **Flexible Assignment**: Students can submit openly or to specific tutors
✅ **Load Balancing**: Pending work is visible to all tutors
✅ **Privacy**: Specific assignments only visible to assigned tutor
✅ **Clean Queue**: Approved/rejected submissions hidden from queue
✅ **Scalable**: Works with any number of tutors

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Open pending submission | All tutors see it |
| Open approved submission | Only approver can see it |
| Specific assigned submission | Only assigned tutor can see it |
| Specific with rejected status | Only rejector can see it |
| New tutor added | Sees all current pending open submissions |
| Tutor approves open submission | Others can't see it anymore |

## Next Steps

1. ✅ Migration created
2. ⏭️ Apply migration in Supabase
3. ⏭️ Test with tutor roles
4. ⏭️ Consider UI changes (show "Available" vs "My Assignments" tabs)
5. ⏭️ Monitor performance if high volume

## Rollback (if needed)

```sql
-- Revert to old policies
DROP POLICY IF EXISTS "tutors_view_submissions" ON learning_submissions;
DROP POLICY IF EXISTS "tutors_update_submissions" ON learning_submissions;

-- Re-create old policies (from learning_submissions_migration.sql)
```

## Questions?

Check:
- `FIX_RLS_POLICIES.sql` - Has the new policies
- `migrations/update_tutor_rls_policies.sql` - Ready-to-run migration
- `DIAGNOSE_RLS_ISSUE.sql` - Debug queries if issues arise
