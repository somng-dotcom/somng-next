-- Deletes the user so you can register again with a new password
-- Replace with your email
delete from auth.users where email = 'info.schoolofmathng@gmail.com';
delete from public.profiles where email = 'info.schoolofmathng@gmail.com';
