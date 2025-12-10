-- ============================================
-- FINAL FIX V2: RESOLVE RECURSIVE RLS POLICIES
-- Run this in Supabase SQL Editor to stop the timeouts
-- ============================================

-- 1. Create a secure function to check admin status
-- We set search_path to public to prevent hijacking
-- We use SECURITY DEFINER to bypass RLS on the profiles table itself
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Drop ALL policies that usually cause infinite loops
-- We drop them IF EXISTS so this script can be run multiple times safely

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Courses
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

-- Categories
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

-- Modules
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;

-- Lessons
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;

-- Quizzes (Found in fix_quiz_rls.sql)
DROP POLICY IF EXISTS "Admins can manage quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can manage quiz questions" ON quiz_questions;

-- Enrollments
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;

-- Payments
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Subscriptions
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;

-- Support Tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;


-- 3. Re-create policies using the non-recursive is_admin() function

-- Profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Courses
CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (is_admin());

-- Categories
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (is_admin());

-- Modules
CREATE POLICY "Admins can manage modules" ON modules
  FOR ALL USING (is_admin());

-- Lessons
CREATE POLICY "Admins can manage lessons" ON lessons
  FOR ALL USING (is_admin());

-- Quizzes
CREATE POLICY "Admins can manage quizzes" ON quizzes
  FOR ALL USING (is_admin());

CREATE POLICY "Admins can manage quiz questions" ON quiz_questions
  FOR ALL USING (is_admin());

-- Enrollments
CREATE POLICY "Admins can manage enrollments" ON enrollments
  FOR ALL USING (is_admin());

-- Payments
CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (is_admin());

-- Subscriptions
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
  FOR ALL USING (is_admin());

-- Support Tickets
CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT USING (is_admin());
