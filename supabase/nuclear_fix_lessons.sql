-- ============================================
-- NUCLEAR FIX FOR LESSON RLS
-- This temporarily disables RLS to confirm it's the issue
-- Then sets up simple policies
-- ============================================

-- STEP 1: Check which policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'lessons';

-- STEP 2: Drop ALL policies on lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can select lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON lessons;
DROP POLICY IF EXISTS "Users can view free preview lessons" ON lessons;
DROP POLICY IF EXISTS "Enrolled users can view all lessons" ON lessons;
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON lessons;
DROP POLICY IF EXISTS "admin_full_access_lessons" ON lessons;
DROP POLICY IF EXISTS "public_view_free_lessons" ON lessons;
DROP POLICY IF EXISTS "enrolled_view_lessons" ON lessons;

-- STEP 3: TEMPORARILY DISABLE RLS (this allows all operations)
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;

-- STEP 4: Verify RLS is disabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'lessons';
-- relrowsecurity should be 'f' (false)

-- ============================================
-- NOW GO TRY CREATING A LESSON IN THE BROWSER!
-- If it works, the issue was definitely RLS.
-- ============================================

-- STEP 5: After testing, RE-ENABLE RLS with a simple policy
-- (Run this AFTER confirming lessons can be created)

-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "allow_all_authenticated" ON lessons
--     FOR ALL 
--     TO authenticated
--     USING (true)
--     WITH CHECK (true);
