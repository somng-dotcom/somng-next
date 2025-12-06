-- ============================================
-- FIX RLS INFINITE RECURSION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create a secure function to check admin status
-- This bypasses RLS because it's SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage modules" ON modules;
DROP POLICY IF EXISTS "Admins can manage lessons" ON lessons;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;

-- 3. Re-create policies using the is_admin() function

-- Profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Categories
CREATE POLICY "Admins can manage categories" ON categories
  FOR ALL USING (is_admin());

-- Courses
CREATE POLICY "Admins can manage all courses" ON courses
  FOR ALL USING (is_admin());

-- Modules
CREATE POLICY "Admins can manage modules" ON modules
  FOR ALL USING (is_admin());

-- Lessons
CREATE POLICY "Admins can manage lessons" ON lessons
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
