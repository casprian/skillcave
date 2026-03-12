# Super Admin Feature Demo Guide

## Quick Start

### Prerequisites
- ✅ Database migrations applied
- ✅ Super admin user created
- ✅ App running locally

### Default Credentials

```
Email:    superadmin@skillcave.com
Password: SuperAdmin123!
```

## Feature Walkthrough

### 1. Super Admin Dashboard

**Access:** Login → Auto-redirect to dashboard

**What you'll see:**
- Welcome greeting with name
- Organization count (0 initially)
- Admin count (0 initially)
- Two main action cards:
  - Organizations (with count)
  - System Settings
- Recent organizations list (empty initially)

**Actions available:**
- Click "Organizations" to manage orgs
- Click "System Settings" to configure app
- Logout button (top right)

---

### 2. Creating Your First Organization

**Access:** Dashboard → Organizations card

**Step-by-step:**
1. Click the green "Create Organization" button
2. Fill in the form:
   - **Organization Name:** (required)
     - Example: "Tech Academy" or "Digital Institute"
   - **Description:** (optional)
     - Example: "A leading tech training organization"
   - **Admin Email:** (required, unique)
     - Example: "admin@techacademy.com"
   - **Admin Password:** (required, min 6 chars)
     - Must be complex for production

3. Click "Create" button
4. Wait for success message
5. Organization appears in list

**Behind the scenes:**
- ✅ Supabase auth user created
- ✅ Organization record created
- ✅ Admin profile created
- ✅ Admin linked to organization

---

### 3. Organization Management

**Access:** Organizations → Organization Card

**Available actions:**

#### View Organization
1. Click "View" button on any organization
2. See:
   - Organization name and icon
   - Primary admin email
   - Active status badge
   - List of organization admins
   - Link to settings

#### Add Organization Admin
1. In organization detail, click "+ Add" (next to "Organization Admins")
2. Fill in admin details:
   - Name (required)
   - Email (required, unique)
   - Password (required, min 6 chars)
3. Click "Add Admin"
4. Admin appears in list
5. Admin can now log in and manage the organization

#### Remove Organization Admin
1. Find admin in the list
2. Click "✕" button on the right
3. Confirm deletion
4. Admin is removed from organization (user account still exists)

#### Delete Organization
1. Back to Organizations list
2. Find organization card
3. Click "Delete" button
4. Confirm deletion
5. Organization and all its data removed

---

### 4. System Settings

**Access:** Dashboard → System Settings card OR Organization Detail → Configure Application Settings

**Configurable sections:**

#### Points Configuration

| Setting | Example | Purpose |
|---------|---------|---------|
| Points Per Attendance | 10 | Reward for daily attendance |
| Points Per Skill | 50 | Reward for completing skill |
| Streak Multiplier | 1.5 | Bonus for consecutive days |

**Usage:**
- Adjust values in input fields
- Values update in real-time
- "Save Changes" button appears

#### Attendance Rules

| Setting | Example | Purpose |
|---------|---------|---------|
| Required Attendance % | 80 | Minimum attendance to be eligible |

**Usage:**
- Set percentage threshold
- Applied globally across all organizations

#### Feature Toggles

| Feature | Description | Impact |
|---------|-------------|--------|
| Enable Leaderboard | Show student rankings | Competitive features |
| Enable Badges | Award achievements | Gamification |
| Enable Notifications | Send push notifications | User engagement |

**Usage:**
- Toggle switches on/off
- Settings apply immediately after save
- Info banner shows scope (global)

---

## Test Scenarios

### Scenario 1: Create Multi-Organization Setup

**Goal:** Test multiple organizations with different admins

1. Create "Organization A"
   - Admin: admin-a@test.com
2. Create "Organization B"
   - Admin: admin-b@test.com
3. View each organization
4. Verify admins are separate
5. Delete one organization
6. Verify other remains

**Expected:** ✅ Complete organization isolation

---

### Scenario 2: Add Multiple Admins to Organization

**Goal:** Test admin management per organization

1. Create "Tech Corp"
2. Open organization detail
3. Add Admin 1: john@techcorp.com
4. Add Admin 2: jane@techcorp.com
5. View admin list (should show both)
6. Remove Admin 1
7. View admin list (shows only Admin 2)

**Expected:** ✅ Admins properly managed

---

### Scenario 3: Configure Application Settings

**Goal:** Test settings modification and persistence

1. Go to System Settings
2. Change Points Per Attendance from 10 → 20
3. Change Points Per Skill from 50 → 75
4. Toggle "Enable Notifications" OFF
5. Click "Save Changes"
6. See success message
7. (Refresh app)
8. Go back to settings
9. Verify changes persisted

**Expected:** ✅ Settings saved and persistent

---

### Scenario 4: Role-Based Routing

**Goal:** Test that users are routed to correct dashboard

1. **Super Admin Login:**
   - Email: superadmin@skillcave.com
   - Expected: → Super Admin Dashboard ✅

2. **Organization Admin Login:**
   - Email: (created when adding org admin)
   - Expected: → Admin Dashboard ✅

3. **Regular Student Login:**
   - Email: (from existing student account)
   - Expected: → Student Dashboard ✅

---

## Verification Checklist

### Database Checks

In Supabase SQL Editor:

```sql
-- Check organizations exist
SELECT * FROM organizations;

-- Check organization admins
SELECT * FROM organization_admins;

-- Check user roles
SELECT id, email, role FROM profiles WHERE role IN ('super_admin', 'organization_admin');

-- Verify RLS is enabled
SELECT tablename FROM pg_tables WHERE tablename = 'organizations' AND schemaname = 'public';
```

### App Checks

- [ ] Super admin dashboard loads
- [ ] Can create organization
- [ ] Organization appears in list
- [ ] Can add admin to organization
- [ ] Admin appears in detail view
- [ ] Can remove admin
- [ ] Settings page loads
- [ ] Settings can be modified
- [ ] Success messages appear
- [ ] Logout works
- [ ] Can re-login as super admin

---

## Troubleshooting

### Issue: "Email already exists"
- **Cause:** Admin email was already used for another account
- **Solution:** Use a different email address

### Issue: Organization not appearing in list
- **Cause:** RLS policy issue or refresh needed
- **Solution:** 
  1. Refresh app (Cmd+R)
  2. Check database directly
  3. Verify RLS policies

### Issue: Can't add admin to organization
- **Cause:** Email validation or auth service issue
- **Solution:**
  1. Check email format
  2. Ensure password is strong
  3. Check Supabase status

### Issue: Settings not saving
- **Cause:** Network issue or validation error
- **Solution:**
  1. Check console for errors
  2. Try again with valid values
  3. Check network connection

---

## Performance Notes

**Expected Response Times:**
- Dashboard load: < 1 second
- Organization list load: < 2 seconds
- Create organization: 2-5 seconds (includes auth user creation)
- Add admin: 2-5 seconds
- Settings save: < 1 second

**Optimization Tips:**
- Organization list is paginated after 10+ items
- Search filters to quickly find organizations
- Indexes on frequently queried columns

---

## Security Notes

### Best Practices

1. **Passwords:**
   - Change default super admin password after first login
   - Use strong passwords (mix of upper, lower, numbers, symbols)
   - Never share admin credentials

2. **Access Control:**
   - Only super admins can create organizations
   - Organization admins can only access their organization
   - RLS policies enforce database-level security

3. **Audit Trail:**
   - All organization changes tracked via `created_at`
   - Admin assignments timestamped
   - Future: Add audit logging

---

## Next Steps

After successful setup:

1. **Customize Colors/Branding:**
   - Update app icon
   - Modify color scheme if desired
   - Add organization logo support

2. **Add More Features:**
   - Organization-specific settings
   - Bulk user import
   - Analytics dashboard

3. **Production Deployment:**
   - Change default credentials
   - Configure email notifications
   - Set up backup strategy
   - Enable audit logging

---

## Support Resources

- 📖 Documentation: [SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md)
- 🔧 Migrations: [migrations/01_organizations_migration.sql](migrations/01_organizations_migration.sql)
- 🎨 UI Components: [app/(super_admin)/**]
- 🔐 Security: RLS policies in migration file

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Ready for Testing
