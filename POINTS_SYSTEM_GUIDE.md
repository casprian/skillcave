# 🏆 Points System Guide

## Overview

The SkillCave Points System is a gamified reward mechanism designed to incentivize student engagement with the learning submission and feedback process. Students earn points for submitting learning logs and receive bonus points when their submissions are approved by tutors.

## Point System Structure

### Points Distribution

| Event | Points Awarded | Description |
|-------|---|---|
| **Submission** | +1 point | Awarded automatically when a student submits a learning log |
| **Approval** | +10 points | Bonus points awarded when a tutor approves the submission |
| **Rejection** | 0 points | No additional penalty, only keeps submission points |

### Example Scenarios

**Scenario 1: Successful Submission & Approval**
```
1. Student submits learning log
   Points awarded: +1
   Total: 1 point

2. Tutor reviews and approves submission
   Additional points: +10
   Total: 11 points
```

**Scenario 2: Multiple Submissions**
```
1. First submission (pending)
   Points: +1

2. Second submission (pending)
   Points: +1

3. First submission approved
   Points: +10

Total: 12 points (1 + 1 + 10)
```

## How Points Are Tracked

### Database Structure

**Points Log Table**
- Records every point transaction
- Links to student ID and submission ID
- Tracks reason for points awarded
- Includes timestamp for analysis

**Student Profile**
- `total_points`: Cumulative points earned
- Auto-updated via database triggers
- Used for leaderboard ranking

### Automatic Point Calculation

Points are awarded automatically through database triggers:

1. **On Submission Creation**
   - Trigger: `award_submission_points_trigger`
   - Action: Insert 1 point into points_log, update profile total_points

2. **On Submission Approval**
   - Trigger: `award_approval_points_trigger`
   - Action: Insert 10 points into points_log, update profile total_points
   - Condition: Only when status changes to 'approved'

## Leaderboard Rankings

### What Students See

**Top Performers Section** (Dashboard Overview Tab)
- Shows top 3 students by total points
- Displays:
  - Rank (👑 🥈 🥉)
  - Student name
  - Total points
  - Approval stats (X approved / Y submissions)

### Leaderboard View

**Dynamic Leaderboard Rankings** (via SQL view: `leaderboard_rankings`)
```sql
SELECT
  rank: Student's position
  name: Student name
  total_points: Cumulative points
  submission_count: Total submissions
  approved_count: Total approved submissions
```

Sorted by: `total_points DESC` (highest points first)

## Legend & Communication

### Points System Legend

Displayed on the student dashboard (Overview tab):

```
📝 Submission: +1 pt
✅ Approved: +10 pts
```

This legend appears directly above the top performers leaderboard to ensure students understand the point system.

### UI Indicators

**Points in Profile Stats**
- Shows current user's total points
- Updated in real-time
- Located in hero section stats

**Submission Records**
- Learning Log page displays submission history
- Shows status: Pending / Approved / Rejected
- Displays tutor feedback (if any)

## Usage & Benefits

### For Students
- ✅ Gamified motivation to submit learning logs
- ✅ Clear reward for quality work (approval bonus)
- ✅ Public recognition via leaderboard
- ✅ Track progress through points accumulation

### For Tutors
- ✅ See student engagement metrics
- ✅ Identify top performers quickly
- ✅ Use points data for performance evaluation
- ✅ Access points log for historical analysis

### For Administrators
- ✅ Monitor learning submission engagement
- ✅ Track submission quality (approval rates)
- ✅ Identify at-risk students (low point earners)
- ✅ Generate performance reports

## Technical Implementation

### Files Modified

1. **migrations/points_system_migration.sql**
   - Adds `total_points` column to profiles
   - Creates `points_log` table
   - Implements automatic triggers
   - Creates `leaderboard_rankings` view

2. **app/(student)/index.tsx**
   - Fetches leaderboard data via `leaderboard_rankings` view
   - Displays dynamic top performers
   - Shows points in profile stats
   - Renders points system legend

### Database Triggers

**Submission Points Trigger**
```sql
FUNCTION: award_submission_points()
ACTION: 
  - Insert 1 point to points_log
  - Update profile.total_points += 1
WHEN: AFTER INSERT on learning_submissions
```

**Approval Points Trigger**
```sql
FUNCTION: award_approval_points()
ACTION:
  - Insert 10 points to points_log (if status changes to approved)
  - Update profile.total_points += 10
WHEN: AFTER UPDATE on learning_submissions
```

### Query Performance

**Leaderboard Query Optimization**
- Index on `profiles.total_points DESC` for fast sorting
- Index on `points_log.student_id` for fast lookups
- Index on `points_log.created_at DESC` for temporal queries
- View caches calculations for efficient retrieval

## Configuration & Customization

### Modifying Point Values

To change point awards, update the SQL in `award_submission_points()` and `award_approval_points()`:

```sql
-- Change submission points (default: 1)
INSERT INTO points_log VALUES (..., 1, ...)  -- Change to desired value

-- Change approval points (default: 10)
INSERT INTO points_log VALUES (..., 10, ...)  -- Change to desired value
```

### Adding New Triggers

To award points for other events (e.g., attendance, achievements):

```sql
CREATE TRIGGER new_event_points_trigger
AFTER INSERT ON table_name
FOR EACH ROW
EXECUTE FUNCTION award_new_event_points();
```

## Reports & Analytics

### Available Metrics

- **Total Points**: Sum of all points earned
- **Submission Count**: Total submissions made
- **Approval Count**: Total approved submissions
- **Approval Rate**: (Approved / Total) × 100
- **Average Points per Submission**: Total Points / Submission Count

### Accessing Leaderboard Data

```tsx
// Query leaderboard
const { data } = await supabase
  .from('leaderboard_rankings')
  .select('*')
  .order('total_points', { ascending: false });

// Query points log
const { data } = await supabase
  .from('points_log')
  .select('*')
  .eq('student_id', studentId)
  .order('created_at', { ascending: false });
```

## Testing the System

### Manual Testing

1. **Submit a Learning Log**
   - Student submits learning log
   - Check: 1 point added to student profile
   - Check: Entry in points_log table

2. **Approve Submission**
   - Tutor approves submission
   - Check: 10 additional points added
   - Check: New entry in points_log table

3. **Verify Leaderboard**
   - Check top performers display
   - Verify points sum correctly
   - Confirm approval count matches

### Automated Testing

```sql
-- Check points for student
SELECT total_points FROM profiles WHERE id = 'student_id';

-- Check points log
SELECT * FROM points_log WHERE student_id = 'student_id';

-- Check leaderboard ranking
SELECT * FROM leaderboard_rankings WHERE id = 'student_id';
```

## Future Enhancements

### Planned Features
- 🎯 Achievement badges based on points milestones
- 📊 Points history chart
- 🎁 Rewards store (redeem points for perks)
- 📈 Weekly/monthly points challenges
- 🏅 Skill-specific point multipliers

### Potential Point Events
- Attendance streak bonus
- Assignment completion
- Peer feedback contribution
- Course certification
- Mentorship activities

## Troubleshooting

### Points Not Updating

**Issue**: Points aren't showing after submission

**Solution**:
1. Verify migration was run: `SELECT * FROM points_log LIMIT 1;`
2. Check triggers exist: `SELECT * FROM pg_trigger;`
3. Verify RLS policies: `SELECT * FROM pg_policies;`
4. Force refresh: Kill and restart app session

### Leaderboard Empty

**Issue**: Top performers showing empty

**Solution**:
1. Verify view exists: `SELECT * FROM leaderboard_rankings;`
2. Check student profile data: `SELECT * FROM profiles WHERE role = 'student';`
3. Verify learning_submissions table has data
4. Check RLS policies on profiles table

### Incorrect Point Totals

**Issue**: Points sum doesn't match transactions

**Solution**:
1. Check points_log for all entries: `SELECT SUM(points_awarded) FROM points_log WHERE student_id = 'id';`
2. Compare with profile.total_points
3. Verify triggers fired on creation/update
4. Check for duplicate triggers or policies

## Support & Documentation

**Related Files**:
- [LEARNING_SUBMISSIONS_GUIDE.md](./LEARNING_SUBMISSIONS_GUIDE.md) - Submission system
- [migrations/points_system_migration.sql](./migrations/points_system_migration.sql) - Database schema
- [app/(student)/index.tsx](./app/(student)/index.tsx) - Dashboard implementation

**Contact**: For support or questions about the points system, refer to the development team documentation.

---

**Version**: 1.0  
**Last Updated**: March 11, 2026  
**Status**: Production Ready ✅
