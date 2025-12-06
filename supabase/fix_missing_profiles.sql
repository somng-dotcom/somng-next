-- ============================================
-- FIX MISSING PROFILES
-- Run this in Supabase SQL Editor
-- ============================================

-- This script finds any users in auth.users that don't have a corresponding 
-- record in public.profiles and creates one for them.

INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Student'), 
    raw_user_meta_data->>'avatar_url',
    'student'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- Also ensure the trigger exists for future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student'), 
    new.email, 
    new.raw_user_meta_data->>'avatar_url',
    'student'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger if needed (drop first to be safe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
