# Quick Start Guide - Role-Based Dashboards

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Database Table
Copy and paste this into Supabase SQL Editor, then click "Run":

```sql
CREATE TABLE IF NOT EXISTS assignments (
  id BIGSERIAL PRIMARY KEY,
  student_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  tutor_comments TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assignments_status ON assignments(status);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON assignments FOR ALL USING (true);

-- Add sample data
INSERT INTO assignments (student_name, title, description) VALUES
  ('John Doe', 'React Basics', 'Complete a React component'),
  ('Jane Smith', 'JavaScript ES6', 'Write ES6 code examples'),
  ('Mike Johnson', 'Database Design', 'Design database schema');
```

### Step 2: Test Tutor Role
1. Open app → Enrollment page
2. Fill form (any email/password)
3. **Select "Tutor"** from role dropdown ⭐
4. Click "Create Account"
5. Login
6. ✨ You'll see **Tutor Dashboard with Assignments Grid**

### Step 3: Test Student Role
1. Enrollment page again
2. Different email this time
3. **Select "Student"** from role dropdown ⭐
4. Click "Create Account"
5. Login
6. ✨ You'll see **Student Dashboard**

## 📋 What You'll See

### As Tutor:
- **Header**: Logo, "SkillCave", Logout button, Role badge "Tutor"
- **Main Content**: 
  - "Pending Assignments for Review" heading
  - Grid of assignment cards showing:
    - Student name (blue)
    - Assignment title
    - Description
    - Submitted date
    - "Review" button
- **On Click "Review"**:
  - Modal pops up
  - Shows full assignment details
  - Text box for your comments
  - "❌ Reject" and "✅ Approve" buttons

### As Student:
- **Header**: Logo, "SkillCave", Logout button, Role badge "Student"
- Regular student dashboard features

## 🎯 Test the Review Flow

1. **Login as Tutor** (see above)
2. **See 3 assignments** in grid (if you ran the SQL)
3. **Click "Review"** on first assignment
4. **Type a comment**: "Great work! Minor improvements needed."
5. **Click "❌ Reject"** (or "✅ Approve")
6. **See assignment disappear** from grid
7. **Check Supabase dashboard**:
   - Go to assignments table
   - See status changed to "rejected"
   - See your comments saved
   - See timestamp

## 🔑 Key Files to Know

| File | What Changed | Key Feature |
|------|-------------|-------------|
| `app/(tutor)/index.tsx` | NEW - Complete rewrite | Assignment grid + review modal |
| `app/(auth)/login.tsx` | Updated | Auto-routes to tutor/student dashboard |
| `app/(auth)/enroll.tsx` | Updated | Role picker dropdown |
| `app/_layout.tsx` | Updated | Fetches role on startup |
| `app/(student)/index.tsx` | Minor | Removed loading state |

## 🐛 Troubleshooting

### "No assignments showing"
- [ ] Did you run the SQL to create the assignments table?
- [ ] Did you run the INSERT statement for sample data?
- [ ] Check Supabase dashboard → assignments table
- [ ] See error in console? Share it!

### "Going to wrong dashboard"
- [ ] After login, check your role
- [ ] Role must be "tutor" to go to tutor dashboard
- [ ] Check browser console for role value
- [ ] Check profiles table in Supabase

### "Review modal not opening"
- [ ] Click the "Review" button? Or just clicking assignment card?
- [ ] Try clicking the blue "Review" button specifically
- [ ] Check console for JavaScript errors

### "Can't create assignments"
- [ ] Table exists? Check in Supabase
- [ ] Sample data inserted? Check SQL results
- [ ] Still need help? Check IMPLEMENTATION_SUMMARY.md

## 💡 Pro Tips

1. **Use different emails** for each test account (required by Supabase)
2. **Check Supabase dashboard** to verify data is being saved
3. **Check browser console** (F12) for any error messages
4. **Test on both platforms** if possible (web and mobile)
5. **Create multiple test accounts** to test different scenarios

## 🎨 What's New in This Version

✨ **Role Selection** - Choose role during signup
✨ **Tutor Dashboard** - Assignment review grid
✨ **Review Modal** - Add comments, approve/reject
✨ **Auto Routing** - Go to correct dashboard after login
✨ **Role Badge** - See your role on dashboard
✨ **Database Integration** - All data saved to Supabase

## 📚 More Documentation

- `IMPLEMENTATION_SUMMARY.md` - Detailed feature list
- `ROLE_BASED_DASHBOARD.md` - Complete technical docs
- `DATABASE_SETUP.md` - Database setup instructions

---

**You're all set! Start with Step 1 above and you'll have a working tutor review system in minutes! 🎉**
