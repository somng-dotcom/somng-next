-- ============================================
-- FORCE FIX ALL (RUN THIS ONE FILE)
-- ============================================

-- 1. FIX MISSING PROFILES (Ensure you have a profile row)
INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Student'), 
    raw_user_meta_data->>'avatar_url',
    'student'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. MAKE ADMIN (Replace email if yours is different)
UPDATE profiles
SET role = 'admin'
WHERE email = 'info.schoolofmathng@gmail.com';

-- 3. FIX "IS_ADMIN" FUNCTION (Security Definer)
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

-- 4. NUKE OLD POLICIES (Clear everything to be safe)
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON courses;
DROP POLICY IF EXISTS "Admins can select courses" ON courses;
DROP POLICY IF EXISTS "Admins can select modules" ON modules;
DROP POLICY IF EXISTS "Admins can insert modules" ON modules;
DROP POLICY IF EXISTS "Admins can update modules" ON modules;
DROP POLICY IF EXISTS "Admins can delete modules" ON modules;
DROP POLICY IF EXISTS "Admins can select lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can delete lessons" ON lessons;

-- 5. APPLY EXPLICIT ADMIN POLICIES
-- Courses
CREATE POLICY "Admins can select courses" ON courses FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert courses" ON courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update courses" ON courses FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete courses" ON courses FOR DELETE USING (is_admin());

-- Modules
CREATE POLICY "Admins can select modules" ON modules FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert modules" ON modules FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update modules" ON modules FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete modules" ON modules FOR DELETE USING (is_admin());

-- Lessons
CREATE POLICY "Admins can select lessons" ON lessons FOR SELECT USING (is_admin());
CREATE POLICY "Admins can insert lessons" ON lessons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update lessons" ON lessons FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete lessons" ON lessons FOR DELETE USING (is_admin());

-- 6. PUBLIC READ ACCESS (Crucial for students/viewing)
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON modules;
CREATE POLICY "Anyone can view modules of published courses" ON modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM courses WHERE id = course_id AND status = 'published')
);
