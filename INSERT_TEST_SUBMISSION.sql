-- CORRECTED: Working INSERT query for testing
-- This will create a test submission to verify the table works
-- IMPORTANT: Both migrations must be applied first!

-- Step 1: Check your auth user ID
SELECT auth.uid() as your_uuid;

-- Step 2: Insert test submission (simplified - let defaults handle timestamps)
INSERT INTO learning_submissions (
  student_id,
  title,
  topic,
  description,
  status,
  submission_type
)
VALUES (
  auth.uid(),
  'Test Submission',
  'React Native',
  'This is a test to verify submissions work',
  'pending',
  'open'
);

-- Step 3: Verify it was created
SELECT id, title, status, submitted_at 
FROM learning_submissions 
WHERE student_id = auth.uid()
ORDER BY submitted_at DESC
LIMIT 5;

-- ==================== ALTERNATIVE METHODS ====================

-- Method 2: If you want to manually set all fields
-- First get your UUID from Step 1, then:
-- INSERT INTO learning_submissions (
--   student_id,
--   title,
--   topic,
--   description,
--   submitted_at,
--   status,
--   submission_type
-- )
-- VALUES (
--   'PASTE-YOUR-UUID-HERE',
--   'My Test Submission',
--   'React Native',
--   'Testing the system',
--   CURRENT_TIMESTAMP,
--   'pending',
--   'open'
-- );

-- Method 3: Minimum required (only mandatory fields)
-- INSERT INTO learning_submissions (
--   student_id,
--   title,
--   topic,
--   description
-- )
-- VALUES (
--   auth.uid(),
--   'Quick Test',
--   'TypeScript',
--   'Just testing'
-- );
