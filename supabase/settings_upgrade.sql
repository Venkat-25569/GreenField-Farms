-- ============================================================
-- GreenField Farms - Admin Settings Upgrade Migration
-- ============================================================
-- Safe to run in Supabase SQL Editor (Dashboard > SQL Editor)
-- Preserves existing tables, users, orders, and products.
-- ============================================================

-- 1. Add all extended settings columns to site_settings
ALTER TABLE public.site_settings
  -- Profile & Branding
  ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'From Our Farm to Your Home',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT 'Quality livestock, fresh dairy, and essential farming goods — all in one place.',
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS about_content TEXT,
  ADD COLUMN IF NOT EXISTS announcement TEXT,
  
  -- Address Breakdown
  ADD COLUMN IF NOT EXISTS village TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Andhra Pradesh',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_link TEXT,

  -- Delivery Configuration
  ADD COLUMN IF NOT EXISTS enable_home_delivery BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_charge NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS free_delivery_above NUMERIC DEFAULT 500,
  ADD COLUMN IF NOT EXISTS delivery_locations TEXT DEFAULT 'Local delivery within 15km radius',
  ADD COLUMN IF NOT EXISTS estimated_delivery_time TEXT DEFAULT 'Same-day delivery (within 3-5 hours)',

  -- Store Operations
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT '₹',
  ADD COLUMN IF NOT EXISTS currency_code TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS store_open_time TEXT DEFAULT '06:00 AM',
  ADD COLUMN IF NOT EXISTS store_close_time TEXT DEFAULT '08:00 PM',
  ADD COLUMN IF NOT EXISTS is_store_open BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_customer_registration BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_online_orders BOOLEAN DEFAULT true,

  -- Product Settings
  ADD COLUMN IF NOT EXISTS enable_product_availability BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS default_product_availability BOOLEAN DEFAULT true,

  -- Notification Preferences
  ADD COLUMN IF NOT EXISTS notify_new_orders BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_customers BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_new_enquiries BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_low_stock BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notification_email TEXT,
  ADD COLUMN IF NOT EXISTS notification_whatsapp TEXT,

  -- Flexible JSONB for any extra dynamic key
  ADD COLUMN IF NOT EXISTS extra_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Ensure initial row exists
INSERT INTO public.site_settings (
  business_name,
  phone,
  whatsapp_number,
  email,
  address,
  tagline,
  description,
  country
)
SELECT
  'GreenField Farms',
  '9392629819',
  '9392629819',
  'nagavenkateswararao2006@gmail.com',
  'Village Road, District Name, State, India',
  'From Our Farm to Your Home',
  'Quality livestock, fresh dairy, and essential farming goods — all in one place.',
  'India'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

-- 3. Ensure Row Level Security (RLS) is active & allows admin management
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON public.site_settings;
  CREATE POLICY "Site settings are viewable by everyone"
    ON public.site_settings FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;
  CREATE POLICY "Only admins can update site settings"
    ON public.site_settings FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admins can insert site settings" ON public.site_settings;
  CREATE POLICY "Only admins can insert site settings"
    ON public.site_settings FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

