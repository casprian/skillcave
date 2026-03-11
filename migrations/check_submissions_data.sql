-- Check what submissions exist and their structure
SELECT 
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN submitted_to_tutor IS NOT NULL THEN 1 END) as assigned_to_tutor,
  COUNT(CASE WHEN submitted_to_tutor IS NULL THEN 1 END) as unassigned,
  COUNT(CASE WHEN submission_type = 'open' AND status = 'pending' AND submitted_to_tutor IS NULL THEN 1 END) as open_pending_unassigned
FROM learning_submissions;

-- Show all submissions
SELECT 
  id,
  title,
  status,
  submission_type,
  submitted_to_tutor,
  student_id
FROM learning_submissions
LIMIT 20;

-- Show the tutors and what they should be able to see
SELECT 
  p.id,
  p.auth_id,
  p.name,
  p.role,
  COALESCE(COUNT(ls.id), 0) as submissions_assigned_to_them
FROM profiles p
LEFT JOIN learning_submissions ls ON ls.submitted_to_tutor = p.auth_id
WHERE p.role = 'tutor'
GROUP BY p.id, p.auth_id, p.name, p.role;

-- Temporarily disable RLS to see raw data (for testing)
ALTER TABLE learning_submissions DISABLE ROW LEVEL SECURITY;

-- Now try the query without RLS
SELECT 
  id,
  title,
  status,
  submission_type,
  submitted_to_tutor,
  student_id
FROM learning_submissions
LIMIT 10;
