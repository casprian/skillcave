# Fix Delete Organization Button - Setup Instructions

## What's Changed

The delete organization button was not working due to RLS (Row Level Security) policies and deletion ordering issues. The fix includes:

### 1. **New RPC Function** (`migrations/08_delete_organization_rpc.sql`)
   - Creates a server-side `delete_organization()` function
   - Handles cascade deletion in proper order:
     1. Learning submissions
     2. Organization admins
     3. Profiles (organization members)
     4. Organization record
   - Uses `SECURITY DEFINER` to bypass RLS policies
   - Handles errors gracefully with detailed logging

### 2. **Updated Frontend Handler**
   - Now calls the RPC function instead of direct table deletes
   - Better error handling and logging
   - Proper transaction handling server-side

## Setup Steps

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → Your Project
2. Click **SQL Editor** 
3. Create a new query and paste the entire contents of:
   ```
   migrations/08_delete_organization_rpc.sql
   ```
4. Click **Run** (▶ button)
5. Verify: You should see "Success" messages

### Option B: Using Supabase CLI

```bash
cd /Users/kashifdelvi/Desktop/GIT_PROJECTS/react_native/SkillCaveApp

# Run the migration
supabase db push

# Or manually:
supabase sql --file migrations/08_delete_organization_rpc.sql
```

## Testing the Fix

1. Go to Super Admin → Organizations
2. Click on an organization
3. Scroll to **⚠️ Organization Management** section
4. Click **Delete Organization** button
5. Confirm deletion in the alert
6. The organization and all its related data should be deleted

## What Gets Deleted

When you delete an organization, the following cascades:
- ✅ Organization record
- ✅ All organization admins
- ✅ All profiles (members) of that organization
- ✅ All learning submissions from that organization
- ✅ Associated attendance records

## Troubleshooting

### Error: "function delete_organization not found"
- **Solution**: Run the migration from `08_delete_organization_rpc.sql` in Supabase SQL Editor

### Error: "Permission denied"
- **Solution**: Ensure RLS is properly configured. The function uses `SECURITY DEFINER` which should bypass restrictions.

### Deletion appears to work but organization still exists
- **Solution**: Check the Supabase logs for the exact error message (shown in the console/logs)

## Console Logs

The deletion process logs detailed information. Check the app console for:
```
[DELETE ORG] Starting deletion of organization: ...
[DELETE ORG] Organization deleted successfully via RPC
```

If there's an error:
```
[DELETE ORG] Fatal error: [error details]
```
