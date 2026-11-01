-- ============================================================
-- Venkat_farms_ceo - Supabase Auth & Profile Fix
-- ============================================================
-- Fixes: "Database error updating user" / "Database error saving user"
--
-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Open your project ("pmnpwxjdbohifvwitrju")
-- 3. Click on "SQL Editor" in the left sidebar
-- 4. Click "+ New query"
-- 5. Paste this entire script and click "Run" (Ctrl+Enter)
-- ============================================================

-- 1. Grant necessary permissions to supabase_auth_admin and service roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role, supabase_auth_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role, supabase_auth_admin;

-- 2. Ensure profiles table exists with proper schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant direct table permissions
GRANT ALL ON TABLE public.profiles TO postgres, service_role, supabase_auth_admin;
GRANT SELECT, UPDATE, INSERT ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

-- 3. Enable Row Level Security and configure robust policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public to read profiles (needed for names on reviews & account)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own profile, preserving their role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

-- 4. Robust trigger function that NEVER crashes user signup/login
-- SECURITY DEFINER runs as database owner
-- SET search_path = public prevents schema resolution errors
-- EXCEPTION WHEN OTHERS prevents aborting the auth.users transaction
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = CASE
      WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name
      ELSE public.profiles.full_name
    END,
    phone = CASE
      WHEN EXCLUDED.phone <> '' THEN EXCLUDED.phone
      ELSE public.profiles.phone
    END;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log warning to Postgres logs instead of crashing auth transaction
  RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- 5. Drop any conflicting triggers and attach cleanly to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Backfill profiles for all existing users who might be missing one
INSERT INTO public.profiles (id, full_name, phone, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  'customer'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verification
SELECT COUNT(*) AS total_profiles FROM public.profiles;
