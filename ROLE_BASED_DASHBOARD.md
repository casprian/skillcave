# Role-Based Dashboard Implementation

## Overview

This implementation adds role-based dashboards to the SkillCave app. Users can now select their role during enrollment (Student, Tutor, Management, Admin), and they'll be directed to the appropriate dashboard based on their role.

## Features Implemented

### 1. **Role Selection During Enrollment**
- Users select their role when signing up (Student, Tutor, Management, Admin)
- Role is stored in both Supabase auth metadata and the profiles table
- Role displayed as a badge on the dashboard

### 2. **Role-Based Routing**
- Login automatically directs users to the correct dashboard:
  - **Tutor** → `/(tutor)` dashboard
  - **Student** (default) → `/(student)` dashboard
  - Future: **Management**, **Admin** to their respective dashboards

### 3. **Tutor Dashboard - Assignment Review System**
The tutor dashboard displays:
- **Pending Assignments Grid**: All assignments awaiting review
- **Assignment Cards** showing:
  - Student name
  - Assignment title
  - Description
  - Submission date
  - Review button

### 4. **Assignment Review Modal**
When a tutor clicks "Review" on an assignment:
- Modal opens with full assignment details
- Text input for tutor comments/feedback
- **Approve** button (blue) - Marks assignment as approved
- **Reject** button (red) - Marks assignment as rejected
- Comments are saved with the review action

### 5. **Student Dashboard Enhancements**
- Role badge displayed prominently
- Shows user's selected role (Student, Tutor, etc.)
- Persistent across sessions

## Database Setup

### Create Assignments Table

Execute this SQL in your Supabase SQL Editor:

```sql
-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  student_id UUID,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending',
  tutor_comments TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indices
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_submitted_at ON assignments(submitted_at DESC);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "public_read_assignments" ON assignments FOR SELECT USING (true);
CREATE POLICY "public_insert_assignments" ON assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_update_assignments" ON assignments FOR UPDATE USING (true) WITH CHECK (true);
```

### Add Role Column to Profiles (if needed)

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'student';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
```

### Insert Sample Assignments (for testing)

```sql
INSERT INTO assignments (student_name, title, description, status) VALUES
  ('John Doe', 'React Basics', 'Complete a React component with hooks', 'pending'),
  ('Jane Smith', 'JavaScript ES6', 'Write code demonstrating ES6 features', 'pending'),
  ('Mike Johnson', 'Database Design', 'Design a normalized database schema', 'pending'),
  ('Sarah Williams', 'API Development', 'Build a REST API with Express.js', 'pending'),
  ('Tom Brown', 'Mobile App UI', 'Create a mobile app interface', 'pending');
```

## File Changes

### New/Modified Files:

1. **`app/(tutor)/index.tsx`** - Tutor dashboard with assignment grid and review modal
2. **`app/(auth)/login.tsx`** - Updated with role-based routing
3. **`app/_layout.tsx`** - Enhanced with role fetching on auth state changes
4. **`DATABASE_SETUP.md`** - Database setup instructions

## Usage Flow

### For Students:
1. Sign up with role = "Student"
2. Verify email (if required)
3. Login
4. Redirected to `/(student)` dashboard
5. See role badge: "Student"
6. Access student features

### For Tutors:
1. Sign up with role = "Tutor"
2. Verify email (if required)
3. Login
4. **Automatically redirected to `/(tutor)` dashboard** ✨
5. See role badge: "Tutor"
6. View pending assignments grid
7. Click "Review" on any assignment
8. Add comments and approve/reject
9. Assignment status updates in database

## API Endpoints Used

- `supabase.auth.signUp()` - Create user account with role in metadata
- `supabase.auth.signInWithPassword()` - Login
- `supabase.auth.signOut()` - Logout
- `supabase.from('profiles').select()` - Fetch user profile and role
- `supabase.from('assignments').select()` - Fetch pending assignments
- `supabase.from('assignments').update()` - Update assignment status and comments

## Styling Details

### Colors Used:
- Primary Blue: `#0369a1`
- Light Blue: `#f0f9ff`
- Text Dark: `#0c4a6e`
- Border: `#bfdbfe`
- Approve (Green): Background with white text
- Reject (Red): `#fee2e2` background with red text

### Components:
- Assignment cards with student name, title, description
- Review modal with full details and comments input
- Approve/Reject buttons with different styling
- Role badge showing current user role
- Loading indicators during review

## Future Enhancements

1. **Management Dashboard** - Analytics, reporting, user management
2. **Admin Dashboard** - System configuration, auditing, full access
3. **Assignment Submission** - Allow students to submit assignments
4. **Notifications** - Notify students when assignments are reviewed
5. **Rubric-based Grading** - Define grading rubrics for assignments
6. **Attachment Support** - Allow file uploads in assignments and reviews
7. **Batch Operations** - Approve/reject multiple assignments at once
8. **Search & Filter** - Filter assignments by status, student, date range

## Testing Checklist

- [x] Role selection works in enrollment form
- [x] Role badge displays on dashboard
- [x] Login redirects tutors to tutor dashboard
- [x] Login redirects students to student dashboard
- [x] Tutor can see assignments grid
- [x] Tutor can open review modal
- [x] Tutor can add comments
- [x] Tutor can approve assignment
- [x] Tutor can reject assignment
- [x] Assignment status updates after approval/rejection
- [x] Empty state shows when no pending assignments

## Troubleshooting

### Assignments not showing?
1. Check `DATABASE_SETUP.md` - ensure assignments table exists
2. Insert sample data: `INSERT INTO assignments...`
3. Check Supabase dashboard for data in assignments table
4. Check console for errors: `console.log` statements are in place

### Wrong dashboard after login?
1. Verify role is saved in profiles table
2. Check login.tsx - role is fetched before navigation
3. Check console logs for role value

### Review modal not opening?
1. Check tutor is logged in
2. Verify assignments exist in database
3. Check console for error messages
4. Ensure modal imports are correct: `Modal`, `TextInput`

## Notes

- RLS policies allow public access for testing - restrict in production
- All assignments are currently "pending" by default
- Comments are stored with the review action
- Review timestamp and tutor ID are recorded for auditing
- Role routing happens automatically on login (no manual selection needed)
