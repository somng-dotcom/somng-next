-- ============================================
-- EMERGENCY FIX FOR LESSON RLS
-- This completely resets lesson permissions
-- Run in Supabase SQL Editor
-- ============================================

-- Step 1: Temporarily disable RLS on lessons to test
-- ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify is_admin function exists
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$;

-- Step 3: Verify your user is admin (REPLACE WITH YOUR EMAIL)
-- SELECT role FROM profiles WHERE email = 'info.schoolofmathng@gmail.com';

-- Step 4: Drop ALL existing lesson policies
DO $$ 
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'lessons'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON lessons', pol.policyname);
    END LOOP;
END $$;

-- Step 5: Ensure RLS is enabled
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Step 6: Create a simple permissive admin policy
CREATE POLICY "admin_full_access_lessons" ON lessons
    FOR ALL 
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Step 7: Create policies for students to view lessons
CREATE POLICY "public_view_free_lessons" ON lessons
    FOR SELECT 
    TO authenticated
    USING (is_free_preview = true);

CREATE POLICY "enrolled_view_lessons" ON lessons
    FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN modules m ON m.id = lessons.module_id
            WHERE e.user_id = auth.uid()
            AND e.course_id = m.course_id
            AND e.status = 'active'
        )
    );

-- Step 8: Test - run this to verify you are admin
SELECT is_admin() as am_i_admin;

-- Step 9: If is_admin returns false, make yourself admin:
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
