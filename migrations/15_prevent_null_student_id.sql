-- Add check constraint to prevent NULL student_id in learning_submissions
-- This provides database-level protection against NULL values

-- Step 1: Add check constraint if not already present
ALTER TABLE learning_submissions
ADD CONSTRAINT check_student_id_not_null 
CHECK (student_id IS NOT NULL);

-- Step 2: Check if any NULL student_id values exist
-- If there are any, they should be manually reviewed and fixed
SELECT COUNT(*) as null_count, array_agg(id) as submission_ids
FROM learning_submissions
WHERE student_id IS NULL;

-- If the query above returns null_count > 0, those submissions need manual review
-- They should be deleted or have student_id values assigned based on context
