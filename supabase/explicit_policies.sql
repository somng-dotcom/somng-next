-- ============================================
-- EXPLICIT POLICIES FIX
-- Use this if the "FOR ALL" policies are not working or not showing up
-- ============================================

-- 1. Ensure the helper function exists and is secure
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

-- 2. Clear previous policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Admins can select courses" ON courses;

-- 3. Create EXPLICIT policies for Courses
CREATE POLICY "Admins can select courses" ON courses FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert courses" ON courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update courses" ON courses FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete courses" ON courses FOR DELETE USING (is_admin());

-- 4. Create EXPLICIT policies for Modules
CREATE POLICY "Admins can select modules" ON modules FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert modules" ON modules FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update modules" ON modules FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete modules" ON modules FOR DELETE USING (is_admin());

-- 5. Create EXPLICIT policies for Lessons
CREATE POLICY "Admins can select lessons" ON lessons FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert lessons" ON lessons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update lessons" ON lessons FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete lessons" ON lessons FOR DELETE USING (is_admin());

-- 6. Ensure Profiles are viewable (needed for is_admin check internals if not security definer, but good practice)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (is_admin());
