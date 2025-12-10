-- ============================================
-- FIX ALL RLS FOR ADMIN OPERATIONS
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Disable RLS on ALL content tables
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;

-- STEP 2: Verify RLS is disabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('courses', 'modules', 'lessons');
-- All should show 'false' for relrowsecurity

-- ============================================
-- AFTER TESTING, RE-ENABLE WITH PROPER POLICIES
-- (Run this section ONLY after confirming everything works)
-- ============================================

-- If everything works, you can optionally re-enable RLS with:
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE modules ENABLE ROW LEVEL SECURITY;  
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- 
-- Then create permissive policies for authenticated users
