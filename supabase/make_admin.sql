-- Enable pgcrypto for password hashing (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Promote 'info.schoolofmathng@gmail.com' to Admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'info.schoolofmathng@gmail.com';

-- 2. (Optional) Reset Password to '1234'
-- This updates the password in Supabase's auth system directly.
-- WARNING: This relies on Supabase using bcrypt (which it does via pgcrypto).
-- UPDATE auth.users
-- SET encrypted_password = crypt('1234', gen_salt('bf'))
-- WHERE email = 'info.schoolofmathng@gmail.com';
