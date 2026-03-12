# Super Admin & Organization Management System

## Overview

This document explains the new Super Admin role and organization management features added to SkillCave.

## Architecture

### Role Hierarchy

```
super_admin (System Administrator)
├── organization_admin (Organization Administrator)
├── admin (Management/Approval Officer)
├── tutor (Instructor)
└── student (Learner)
```

## Database Schema

### New Tables

#### `organizations`
- `id`: UUID (Primary Key)
- `name`: Organization name (required)
- `description`: Optional description
- `admin_email`: Email of primary admin
- `created_by`: User ID who created the organization
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `settings`: JSONB for organization-specific configurations
- `is_active`: Boolean flag for active/inactive status

#### `organization_admins`
- `id`: UUID (Primary Key)
- `organization_id`: FK to organizations (CASCADE delete)
- `user_id`: FK to auth.users (CASCADE delete)
- `created_at`: Creation timestamp
- `permissions`: JSONB for admin-specific permissions
- Unique constraint: (organization_id, user_id)

### Modified Tables

#### `profiles`
- Added `organization_id`: UUID (FK to organizations, nullable)
- Added `role`: VARCHAR(50) - supersedes previous role system

## API & Features

### Super Admin Dashboard (`app/(super_admin)/index.tsx`)

**Features:**
- View all organizations count
- Quick access to management functions
- Recent organizations list
- System statistics

**Navigation:**
- Organizations Management
- System Settings
- Logout

### Organizations Management (`app/(super_admin)/organizations.tsx`)

**Features:**
- List all organizations with search/filter
- Create new organization with admin account
- View organization details
- Delete organization
- Add admin users per organization

**Create Organization Flow:**
1. Enter organization name (required)
2. Enter organization description (optional)
3. Create admin user:
   - Email (required, must be unique)
   - Password (min 6 characters)
4. System automatically:
   - Creates Supabase auth user
   - Creates organization record
   - Creates admin profile
   - Links admin to organization

### Organization Detail (`app/(super_admin)/organization-detail.tsx`)

**Features:**
- View organization information
- List organization admins
- Add new admin to organization
- Remove admin from organization
- Link to global settings

**Admin Management:**
- Add Admin: Create new user account and assign to organization
- Remove Admin: Revoke admin status (user account remains)

### System Settings (`app/(super_admin)/settings.tsx`)

**Configurable Settings:**
- Points Configuration:
  - Points per attendance
  - Points per skill
  - Streak multiplier
- Attendance Rules:
  - Required attendance percentage
- Feature Toggles:
  - Enable/disable leaderboard
  - Enable/disable badges
  - Enable/disable notifications

**Scope:** Global settings apply to all organizations

## Security & Access Control

### Row-Level Security (RLS) Policies

**Organizations Table:**
- Super admins: Can read all, insert, update, delete
- Organization admins: Can only read their own organization
- Others: No access

**Organization_admins Table:**
- Super admins: Full access
- Organization admins: Can only read admins in their organization
- Others: No access

**Profiles Table:**
- Role field controls feature access
- organization_id field links users to organizations

## Setup Instructions

### Step 1: Apply Database Migrations

1. Go to Supabase Dashboard > SQL Editor
2. Open the migration file: `migrations/01_organizations_migration.sql`
3. Copy and paste the entire SQL
4. Click "Run" to execute

**Expected Output:**
- Tables created: `organizations`, `organization_admins`
- Columns added to `profiles`: `organization_id`, `role`
- Indexes created for performance
- RLS policies enabled

### Step 2: Create Super Admin User

1. Go to Supabase Dashboard > Authentication > Users
2. Click "Create User"
3. Enter:
   - Email: `superadmin@skillcave.com`
   - Password: `SuperAdmin123!` (change after login)
4. Create the user
5. Copy the User ID

6. Go to SQL Editor and run:

```sql
INSERT INTO public.profiles (id, email, name, role)
VALUES ('PASTE_USER_ID_HERE', 'superadmin@skillcave.com', 'Super Admin', 'super_admin')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
```

### Step 3: Update App Configuration

1. Update any hardcoded role checks to include `'super_admin'`
2. Test role-based routing in `useRoleBasedRouting` hook
3. Ensure Supabase client is properly configured

### Step 4: Deploy and Test

1. **Test Super Admin Login:**
   - Email: `superadmin@skillcave.com`
   - Password: `SuperAdmin123!`
   - Expected: Redirected to `/(super_admin)` dashboard

2. **Test Organization Creation:**
   - Create test organization
   - Verify organization appears in list
   - Check database: `SELECT * FROM organizations;`

3. **Test Admin Assignment:**
   - Add admin to organization
   - Verify admin can see organization
   - Verify admin appears in organization detail

4. **Test Settings:**
   - Modify settings values
   - Verify changes are saved

## File Structure

```
app/(super_admin)/
├── _layout.tsx                 # Router configuration
├── index.tsx                   # Super admin dashboard
├── organizations.tsx           # Organization management
├── organization-detail.tsx     # Organization detail & admin mgmt
└── settings.tsx                # Global settings

hooks/
└── useRoleBasedRouting.ts      # Role-based routing logic

migrations/
├── 01_organizations_migration.sql     # Main schema
└── 02_create_super_admin_user.sql     # Super admin creation
```

## Environment Variables

Ensure your `.env.local` contains:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Professional Design System

**Color Palette:**
- Primary: `#0369a1` (Professional Blue)
- Success: `#10b981` (Green)
- Error: `#ef4444` (Red)
- Warning: `#f59e0b` (Amber)
- Background: `#f8fafc` (Light Gray)
- Surface: `#ffffff` (White)

**Typography:**
- Headers: 700-800 fontWeight
- Body: 500-600 fontWeight
- Small text: 400-500 fontWeight

**Spacing:**
- Consistent 8px/16px/20px grid
- Card padding: 12-16px
- Border radius: 8-12px

## Testing Checklist

- [ ] Super admin can log in
- [ ] Super admin dashboard displays correctly
- [ ] Can create organization with admin
- [ ] Organization appears in list
- [ ] Can view organization details
- [ ] Can add admin to organization
- [ ] Can remove admin from organization
- [ ] Can modify settings
- [ ] Settings save correctly
- [ ] Role-based routing works for all roles
- [ ] RLS policies prevent unauthorized access

## Future Enhancements

1. **Organization Settings:**
   - Per-organization point multipliers
   - Organization-specific feature toggles
   - Custom branding options

2. **Admin Features:**
   - Bulk import students/tutors
   - Dashboard analytics
   - User management

3. **Advanced Settings:**
   - Email notifications configuration
   - Badge & achievement rules
   - Attendance policies
   - Approval workflows

4. **Multi-Organization Support:**
   - Admin can manage multiple organizations
   - Organization-specific data isolation
   - Inter-organization reporting

## Troubleshooting

### Issue: Super admin can't log in
- **Solution:** Verify user exists in auth.users with role='super_admin' in profiles
- **Check:** Run `SELECT * FROM profiles WHERE role = 'super_admin';`

### Issue: Organizations table not created
- **Solution:** Ensure migration SQL was fully executed
- **Check:** Run `\dt organizations;` in SQL Editor

### Issue: RLS policies blocking access
- **Solution:** Verify user role matches policy requirements
- **Check:** Review RLS policies in SQL Editor

### Issue: Organization creation fails
- **Solution:** Check if admin email already exists or auth service is down
- **Check:** Look at browser console for error messages

## Support

For issues or questions, review:
1. Database migration status
2. User role in profiles table
3. RLS policy settings
4. Authentication service status
5. Network connectivity

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** Production Ready
