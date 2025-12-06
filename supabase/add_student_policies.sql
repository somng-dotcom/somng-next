-- ============================================
-- ADD STUDENT POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enrollments Policies
-- Allow users to view their own enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON enrollments;
CREATE POLICY "Users can view own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to enroll themselves
DROP POLICY IF EXISTS "Users can enroll themselves" ON enrollments;
CREATE POLICY "Users can enroll themselves" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Lesson Progress Policies
-- Allow users to view their own progress
DROP POLICY IF EXISTS "Users can view own progress" ON lesson_progress;
CREATE POLICY "Users can view own progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own progress
DROP POLICY IF EXISTS "Users can update own progress" ON lesson_progress;
CREATE POLICY "Users can update own progress" ON lesson_progress
  FOR ALL USING (auth.uid() = user_id);

-- 3. Profile Policies (Ensure users can view/edit own profile)
-- Note: "Users can view own profile" might already exist, so we use IF NOT EXISTS logic by dropping first to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Ensure public access to course content
-- Re-apply these just in case they were affected
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON modules;
CREATE POLICY "Anyone can view modules of published courses" ON modules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND status = 'published')
  );

DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON lessons;
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM modules 
      JOIN courses ON modules.course_id = courses.id 
      WHERE modules.id = module_id AND courses.status = 'published'
    )
  );
