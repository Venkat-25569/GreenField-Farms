-- ============================================================
-- Greenfield Farms / Venkat Farms
-- Fix Admin Login, Confirm Emails, and Set Admin Roles
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pmnpwxjdbohifvwitrju/sql
-- ============================================================

-- 1. Ensure 'email' column exists in public.profiles so WHERE email = ... never fails
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill existing emails from auth.users into public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email != u.email);

-- 3. Confirm email for both accounts in auth.users immediately
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
WHERE email IN (
  '99240041063@klu.ac.in',
  '99240040697@klu.ac.in',
  'nagavenkateswararao2006@gmail.com'
);

-- 4. Update profile role to 'admin' and sync email
UPDATE public.profiles
SET role = 'admin',
    email = u.email
FROM auth.users u
WHERE public.profiles.id = u.id
  AND u.email IN (
    '99240041063@klu.ac.in',
    '99240040697@klu.ac.in',
    'nagavenkateswararao2006@gmail.com'
  );

-- 5. If profile record did not exist yet, create it with admin role
INSERT INTO public.profiles (id, full_name, role, email)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'full_name', 'Admin Venkat'), 'admin', u.email
FROM auth.users u
WHERE u.email IN (
  '99240041063@klu.ac.in',
  '99240040697@klu.ac.in',
  'nagavenkateswararao2006@gmail.com'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    email = EXCLUDED.email;

-- 6. Verify results: Display registered accounts and confirmed status
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email IN (
  '99240041063@klu.ac.in',
  '99240040697@klu.ac.in',
  'nagavenkateswararao2006@gmail.com'
);

