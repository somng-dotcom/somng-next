-- ============================================
-- PRODUCTION MIGRATION: Add Unique Constraints
-- Run this in Supabase SQL Editor for production
-- ============================================

-- 1. Add unique constraint to prevent duplicate enrollments
-- This prevents race conditions in payment verification
-- 1. Add unique index to prevent duplicate enrollments (Partial Unique Constraint)
-- This prevents race conditions in payment verification while allowing multiple cancelled/expired
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_course_enrollment 
ON enrollments (user_id, course_id) 
WHERE status = 'active';

-- 2. Add unique constraint on provider_reference to prevent duplicate payments
-- This ensures idempotency in payment processing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_provider_reference'
    ) THEN
        ALTER TABLE payments 
        ADD CONSTRAINT unique_provider_reference 
        UNIQUE (provider_reference);
    END IF;
END $$;

-- 3. Add index for faster enrollment lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course 
ON enrollments(user_id, course_id) 
WHERE status = 'active';

-- 4. Add index for payment verification
CREATE INDEX IF NOT EXISTS idx_payments_provider_reference 
ON payments(provider_reference);

-- 5. Add index for faster course queries
CREATE INDEX IF NOT EXISTS idx_courses_status_level 
ON courses(status, level) 
WHERE status = 'published';

-- 6. Add index for lesson progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_lesson 
ON lesson_progress(user_id, lesson_id);

-- Verification queries (run these to check):
-- SELECT * FROM pg_constraints WHERE conname LIKE 'unique_%';
-- SELECT * FROM pg_indexes WHERE indexname LIKE 'idx_%';

