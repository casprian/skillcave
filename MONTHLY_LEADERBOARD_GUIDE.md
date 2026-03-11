# 🏆 Monthly Leaderboard System Guide

## Overview

The **Monthly Leaderboard** system transforms the top performers competition into a fair, recurring monthly event. Each calendar month is a fresh competition where students start with zero points, compete throughout the month, and then the month closes to become a historical record.

## Key Features

### 1. Monthly Reset
- **Fresh Start Each Month** - Points reset on the 1st of every month
- **Fair Competition** - All students start equally on day one
- **Recurring Opportunity** - Win the leaderboard multiple times
- **Monthly Cycles** - January, February, March, etc.

### 2. Current Month Display
Dashboard shows:
- 🏆 **Top Performers - [Month Name, Year]** (e.g., "March 2026")
- Current month ranking with top 3
- Your current rank and points for this month
- Monthly notice: "Fresh start each month • Previous months locked"

### 3. Locked Archives
- Previous months are locked and read-only
- Cannot modify historical leaderboards
- Historical data preserved permanently
- Students can view past months for reference

### 4. Monthly Points System
- **+1 point** for each submission (same as before)
- **+10 bonus points** for each approval (same as before)
- **Monthly total** - only counts submissions/approvals in current month
- **Separate tracking** - previous months tracked independently

## Database Structure

### New Tables

**monthly_leaderboards**
```
- id: UUID
- student_id: UUID
- month_year: DATE (first day of month)
- total_points: INTEGER (0-1000+)
- submission_count: INTEGER
- approved_count: INTEGER
- created_at, updated_at: TIMESTAMP
- UNIQUE: (student_id, month_year)
```

**monthly_points_log**
```
- id: UUID
- student_id: UUID
- submission_id: UUID (optional)
- month_year: DATE
- points_awarded: INTEGER (1 or 10)
- reason: VARCHAR (e.g., "Monthly submission", "Monthly submission approved")
- created_at: TIMESTAMP
```

### Updated Columns

**learning_submissions**
- Added `month_year: DATE` - tracks which month submission belongs to

### New Views

**current_month_leaderboard**
```
- Filters to only current month
- Includes ranking (ROW_NUMBER)
- Auto-updates daily
- Shows rank, student_id, name, email, points, counts
```

**current_month_top_performers**
```
- Top 3 from current month
- Used by dashboard
- Limited to 3 rows for performance
```

**all_monthly_leaderboards**
```
- All months combined
- Includes month status (current/archived/future)
- For historical view and archives
- With month_display (e.g., "March 2026")
```

## How Monthly Reset Works

### Automatic Monthly Tracking

When a submission is created:
1. System calculates `month_year` (first day of submission's month)
2. Entry created/updated in `monthly_leaderboards` for that month
3. Points logged in `monthly_points_log` with month_year
4. Same process on approval (+10 bonus)

### Example Timeline

**March 2026:**
- March 1: Leaderboard starts fresh (all students at 0 points)
- March 1-15: Students submit and earn points
- March 16-31: More submissions and approvals
- March 31 (end of day): March leaderboard finalized
- **April 1**: NEW leaderboard starts, previous months archived

**Monthly Status:**
```
March 2026:   [Locked Archive] ✓ Final ranking set
April 2026:   [Current Month] ← Live competition happening
May 2026:     [Future] - Hasn't started yet
```

## User Experience

### Dashboard View

```
🏆 Top Performers - March 2026

📅 Monthly Competition
   Fresh start each month • Previous months locked

👑 Sarah Chen
   125 pts • 10 approved/12 submitted

🥈 Alex Johnson  
   102 pts • 8 approved/10 submitted

🥉 You (Jamie)
   98 pts • 8 approved/9 submitted
```

### Monthly Notice

Students see clear indication:
- **Current month** displayed in title
- **Monthly notice** explaining fresh start policy
- **Leaderboard** shows current month only
- **Previous months** locked and archived

### Student Benefits

✅ **Fair Competition** - Everyone starts fresh monthly  
✅ **Multiple Chances** - Win multiple months, not just lifetime  
✅ **Motivation** - Monthly targets motivate participation  
✅ **History Preserved** - Past months remain visible  
✅ **Clear Timeline** - Know exactly which month is active  

## Technical Implementation

### Files Created

1. **migrations/monthly_leaderboard_migration.sql** (150+ lines)
   - Two new tables: `monthly_leaderboards`, `monthly_points_log`
   - Three new views: current month, top performers, all months
   - Six indexes for performance
   - Triggers for automatic monthly tracking
   - Helper functions

2. **Code Changes in app/(student)/index.tsx**
   - New state: `currentMonth` (e.g., "March 2026")
   - Updated queries to use `current_month_top_performers` view
   - Updated queries to use `current_month_leaderboard` view
   - New styles: monthlyNotice, monthlyIcon, etc.
   - Updated leaderboard display with month name

### Database Triggers

**award_monthly_submission_points_trigger**
```
ON: INSERT to learning_submissions
ACTION:
  1. Calculate month_year from submitted_at
  2. Insert 1 point into monthly_points_log
  3. INSERT/UPDATE monthly_leaderboards
```

**award_monthly_approval_points_trigger**
```
ON: UPDATE to learning_submissions (status → approved)
ACTION:
  1. Get month_year from submission
  2. Insert 10 points into monthly_points_log
  3. UPDATE monthly_leaderboards.total_points += 10
```

### Query Performance

**Indexes created:**
- `idx_monthly_leaderboards_month_year` - Fast month filtering
- `idx_monthly_leaderboards_total_points` - Fast point sorting
- `idx_monthly_leaderboards_current_month` - Current month optimization
- `idx_monthly_points_log_month_year` - Audit trail access
- `idx_learning_submissions_month_year` - Submission grouping

**Expected query times:**
- Current leaderboard: <50ms
- Top 3: <20ms
- User rank lookup: <30ms

## Data Model

### How Monthly Tracking Works

```
Submission Timeline:

Date: March 15, 2026
├─ Create submission
│  ├─ Set month_year = 2026-03-01
│  ├─ Award 1 point (March)
│  └─ INSERT monthly_leaderboards entry
│
└─ March 20, 2026: Tutor approves
   ├─ Update status = 'approved'
   ├─ Award 10 bonus points (March)
   └─ UPDATE monthly_leaderboards (March entry)

Result in Database:

monthly_leaderboards:
- March 2026: 11 points (1 + 10)

monthly_points_log:
- Entry 1: 1 point "Monthly submission" (March 15)
- Entry 2: 10 points "Monthly submission approved" (March 20)
```

### Archive vs Current

```
February 2026 (ARCHIVED - Locked):
├─ Winner: Sarah Chen (145 points)
├─ 2nd: Alex Johnson (132 points)
└─ Status: Locked - Cannot change

March 2026 (CURRENT - Active):
├─ Rank 1: Sarah Chen (78 points)
├─ Rank 2: Jamie (55 points)
└─ Status: Live - Changing daily

April 2026+ (FUTURE - Not Started):
└─ Status: Doesn't exist yet
```

## Data Integrity

### Foreign Keys
```
monthly_leaderboards.student_id 
  → auth.users.id (CASCADE delete)

monthly_points_log.student_id
  → auth.users.id (CASCADE delete)

learning_submissions.month_year
  ← Calculated from submitted_at
```

### Unique Constraints
```
UNIQUE(student_id, month_year) on monthly_leaderboards
- Ensures one entry per student per month
- Prevents duplicates
```

## Reporting & Analytics

### Current Month Reports

```sql
SELECT 
  rank,
  name,
  total_points,
  submission_count,
  approved_count,
  (approved_count::FLOAT / submission_count * 100) AS approval_rate
FROM current_month_leaderboard
ORDER BY rank;
```

### Monthly Archive Reports

```sql
SELECT 
  month_year,
  name,
  total_points,
  rank
FROM all_monthly_leaderboards
WHERE month_year < CURRENT_DATE - INTERVAL '1 month'
ORDER BY month_year DESC, rank;
```

### Student Performance Across Months

```sql
SELECT 
  name,
  COUNT(DISTINCT month_year) AS months_participated,
  SUM(total_points) AS lifetime_points,
  MAX(total_points) AS best_month,
  AVG(total_points)::INT AS avg_monthly
FROM all_monthly_leaderboards
GROUP BY student_id, name
ORDER BY lifetime_points DESC;
```

## Future Enhancements

📌 **Planned Features:**
- 🎁 Monthly prizes/rewards for top 3
- 📊 Month-over-month comparison charts
- 📈 All-time stats alongside monthly
- 🏅 Badges for "Monthly Winner"
- 📲 Notifications at month end
- 🎯 Monthly goals/targets
- 🏆 Best month tracker

## Configuration

### Changing Month Reset Date

Currently resets on the 1st of each month. To change:

```sql
-- To reset on different date (e.g., 15th):
ALTER VIEW current_month_leaderboard AS
WHERE ml.month_year = DATE_TRUNC('month', 
  CURRENT_DATE + INTERVAL '14 days')::DATE
```

### Adjusting Point Values

To change submission/approval points:

```sql
-- In award_monthly_submission_points():
INSERT INTO monthly_points_log VALUES (..., 2, ...)  -- Change 1 to 2

-- In award_monthly_approval_points():
INSERT INTO monthly_points_log VALUES (..., 20, ...) -- Change 10 to 20
```

## Troubleshooting

### Leaderboard Empty This Month

**Cause:** No submissions this month yet

**Solution:**
1. Submit a learning log
2. Refresh dashboard
3. Should appear within seconds

### Wrong Month Showing

**Cause:** System date incorrect or timezone issue

**Solution:**
1. Check server date: `SELECT CURRENT_DATE;`
2. Verify timezone setting in Supabase
3. Hard refresh app

### Points Not Updating Monthly

**Cause:** Triggers not firing

**Solution:**
1. Verify triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE 'award_monthly%';`
2. Check RLS policies: `SELECT * FROM pg_policies;`
3. Run migration again: `monthly_leaderboard_migration.sql`

### Previous Month Data Lost

**Cause:** Data accidentally deleted

**Solution:**
- Data should never be deleted, only marked archived
- Check `monthly_leaderboards` table has historical records
- Verify UNIQUE constraints prevent duplicates

## Support

**Related Documentation:**
- [POINTS_SYSTEM_GUIDE.md](./POINTS_SYSTEM_GUIDE.md) - Overall points system
- [PROGRESS_LOG_GUIDE.md](./PROGRESS_LOG_GUIDE.md) - Student progress tracking
- [LEARNING_SUBMISSIONS_GUIDE.md](./LEARNING_SUBMISSIONS_GUIDE.md) - Submission system

**Database Queries:**
```sql
-- Current month leaderboard
SELECT * FROM current_month_leaderboard ORDER BY rank;

-- User's current rank
SELECT * FROM current_month_leaderboard WHERE student_id = 'user_id';

-- Historical comparison
SELECT * FROM all_monthly_leaderboards ORDER BY month_year DESC;
```

---

**Version**: 1.0  
**Last Updated**: March 11, 2026  
**Status**: Production Ready ✅
