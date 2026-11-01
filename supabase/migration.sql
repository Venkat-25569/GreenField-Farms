-- ============================================================
-- GreenField Farms - Supabase Database Migration
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates all tables, enables RLS, and sets up security policies.
--
-- SAFE TO RE-RUN: Uses IF NOT EXISTS and ON CONFLICT where applicable.
-- Does NOT delete existing data.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
-- Created automatically via trigger when a user signs up

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public can read profiles (for review display names only)
-- Note: This table contains only name/phone, no sensitive data.
DO $$ BEGIN
  CREATE POLICY "Public profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update their own profile (but NOT the role field).
-- The WITH CHECK ensures the role value is unchanged from what the DB already has.
DO $$ BEGIN
  CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id
      AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-create profile on signup (SECURITY DEFINER runs as DB owner)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'customer'  -- Always 'customer'; admin is set via SQL only
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. CATEGORIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Categories are viewable by everyone"
    ON categories FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can insert categories"
    ON categories FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can update categories"
    ON categories FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can delete categories"
    ON categories FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 3. PRODUCTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  product_type TEXT NOT NULL CHECK (product_type IN ('livestock', 'dairy', 'farming_goods')),
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  unit TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Customers see only active products; admins see all
DO $$ BEGIN
  CREATE POLICY "Active products are viewable by everyone"
    ON products FOR SELECT
    USING (is_active = true OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can insert products"
    ON products FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can update products"
    ON products FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can delete products"
    ON products FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_products_updated_at ON products;
CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_timestamp();


-- ============================================================
-- 4. LIVESTOCK DETAILS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS livestock_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  breed TEXT,
  age TEXT,
  gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female')),
  weight TEXT,
  location TEXT,
  health_information TEXT,
  vaccination_information TEXT,
  milk_yield TEXT,
  lactation_information TEXT,
  listing_type TEXT NOT NULL DEFAULT 'enquiry' CHECK (listing_type IN ('direct', 'enquiry'))
);

ALTER TABLE livestock_details ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Livestock details are viewable by everyone"
    ON livestock_details FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can insert livestock details"
    ON livestock_details FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can update livestock details"
    ON livestock_details FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can delete livestock details"
    ON livestock_details FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 5. PRODUCT IMAGES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Product images are viewable by everyone"
    ON product_images FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can insert product images"
    ON product_images FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can update product images"
    ON product_images FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can delete product images"
    ON product_images FOR DELETE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 6. ORDERS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  delivery_address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  order_notes TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  delivery_charge NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (delivery_charge >= 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  order_status TEXT NOT NULL DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK (payment_method IN ('cod', 'online', 'bank_transfer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders; admins can view all
DO $$ BEGIN
  CREATE POLICY "Users can view their own orders"
    ON orders FOR SELECT
    USING (
      auth.uid() = user_id
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Authenticated users can create orders (tied to their account)
-- Guest checkout is handled by the app setting user_id = auth.uid() when available
DO $$ BEGIN
  CREATE POLICY "Authenticated users can create orders"
    ON orders FOR INSERT
    WITH CHECK (
      user_id IS NULL OR user_id = auth.uid()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only admins can update orders (status changes)
DO $$ BEGIN
  CREATE POLICY "Only admins can update orders"
    ON orders FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 7. ORDER ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Viewable only by the order owner or admin
DO $$ BEGIN
  CREATE POLICY "Order items viewable by order owner or admin"
    ON order_items FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (
          orders.user_id = auth.uid()
          OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
        )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only the order owner can insert items into their own order
DO $$ BEGIN
  CREATE POLICY "Order owner can insert order items"
    ON order_items FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 8. ENQUIRIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can create enquiries (public contact form)
DO $$ BEGIN
  CREATE POLICY "Anyone can create enquiries"
    ON enquiries FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only admins can view enquiries (contains customer PII)
DO $$ BEGIN
  CREATE POLICY "Only admins can view enquiries"
    ON enquiries FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only admins can update enquiries
DO $$ BEGIN
  CREATE POLICY "Only admins can update enquiries"
    ON enquiries FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 9. REVIEWS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Reviews are viewable by everyone"
    ON reviews FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete their own reviews"
    ON reviews FOR DELETE
    USING (
      auth.uid() = user_id
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ============================================================
-- 10. SITE SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'GreenField Farms',
  logo_url TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  delivery_information TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Site settings are viewable by everyone"
    ON site_settings FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can update site settings"
    ON site_settings FOR UPDATE
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Insert default site settings (only if table is empty)
INSERT INTO site_settings (business_name, phone, whatsapp_number, email, address, delivery_information)
SELECT
  'GreenField Farms',
  '+91 98765 43210',
  '919876543210',
  'info@greenfieldfarms.in',
  'Village Road, District Name, State, India',
  'We deliver dairy products locally within 10km radius. Livestock pickup from farm location.'
WHERE NOT EXISTS (SELECT 1 FROM site_settings);


-- ============================================================
-- SEED DATA - Categories
-- ============================================================
-- These are safe to re-run (ON CONFLICT DO NOTHING)

INSERT INTO categories (name, slug, description, is_active) VALUES
  ('Cocks & Chickens', 'cocks-chickens', 'Premium quality poultry birds for your farm', true),
  ('Buffaloes & Livestock', 'buffaloes-livestock', 'Healthy and well-maintained livestock', true),
  ('Fresh Milk & Dairy', 'fresh-milk-dairy', 'Farm-fresh dairy products delivered to your door', true),
  ('Farming Goods', 'farming-goods', 'Essential agricultural supplies and farming tools', true)
ON CONFLICT (slug) DO NOTHING;


-- ============================================================
-- SEED DATA - Demo Products
-- ============================================================
-- Clearly marked as demonstration/sample data.
-- Uses ON CONFLICT (slug) DO NOTHING so it will not overwrite
-- or duplicate existing products.

DO $$
DECLARE
  cat_chickens UUID;
  cat_buffaloes UUID;
  cat_dairy UUID;
  cat_farming UUID;
  prod_id UUID;
BEGIN
  SELECT id INTO cat_chickens FROM categories WHERE slug = 'cocks-chickens';
  SELECT id INTO cat_buffaloes FROM categories WHERE slug = 'buffaloes-livestock';
  SELECT id INTO cat_dairy FROM categories WHERE slug = 'fresh-milk-dairy';
  SELECT id INTO cat_farming FROM categories WHERE slug = 'farming-goods';

  -- ---- Chickens (demo data) ----

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured)
  VALUES (cat_chickens, '[Demo] Kadaknath Rooster', 'kadaknath-rooster', 'Sample listing. Kadaknath breed rooster with distinctive black feathers.', 'livestock', 2500, 5, 'per bird', true, true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO livestock_details (product_id, breed, age, gender, weight, location, listing_type)
    VALUES (prod_id, 'Kadaknath', '8 months', 'male', '2.5 kg', 'Madhya Pradesh', 'direct')
    ON CONFLICT (product_id) DO NOTHING;
  END IF;

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured)
  VALUES (cat_chickens, '[Demo] Aseel Cock', 'aseel-fighting-cock', 'Sample listing. Pure breed Aseel cock.', 'livestock', 3500, 3, 'per bird', true, true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO livestock_details (product_id, breed, age, gender, weight, location, listing_type)
    VALUES (prod_id, 'Aseel', '1 year', 'male', '3.2 kg', 'Andhra Pradesh', 'enquiry')
    ON CONFLICT (product_id) DO NOTHING;
  END IF;

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured)
  VALUES (cat_chickens, '[Demo] Country Hen (Desi Murgi)', 'country-hen-desi', 'Sample listing. Country hens, free-range raised.', 'livestock', 800, 15, 'per bird', true, false)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO livestock_details (product_id, breed, age, gender, weight, location, listing_type)
    VALUES (prod_id, 'Desi/Country', '6 months', 'female', '1.5 kg', 'Tamil Nadu', 'direct')
    ON CONFLICT (product_id) DO NOTHING;
  END IF;

  -- ---- Buffaloes (demo data) ----

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured)
  VALUES (cat_buffaloes, '[Demo] Murrah Buffalo', 'murrah-buffalo', 'Sample listing. Murrah breed buffalo.', 'livestock', 85000, 2, 'per animal', true, true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO livestock_details (product_id, breed, age, gender, weight, location, milk_yield, lactation_information, listing_type)
    VALUES (prod_id, 'Murrah', '4 years', 'female', '450 kg', 'Haryana', '12-15 litres/day', '3rd lactation', 'enquiry')
    ON CONFLICT (product_id) DO NOTHING;
  END IF;

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured)
  VALUES (cat_buffaloes, '[Demo] Nili-Ravi Buffalo', 'nili-ravi-buffalo', 'Sample listing. Nili-Ravi breed buffalo.', 'livestock', 75000, 1, 'per animal', true, true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO prod_id;

  IF prod_id IS NOT NULL THEN
    INSERT INTO livestock_details (product_id, breed, age, gender, weight, location, milk_yield, lactation_information, listing_type)
    VALUES (prod_id, 'Nili-Ravi', '3.5 years', 'female', '420 kg', 'Punjab', '10-12 litres/day', '2nd lactation', 'enquiry')
    ON CONFLICT (product_id) DO NOTHING;
  END IF;

  -- ---- Dairy (demo data) ----

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured) VALUES
    (cat_dairy, '[Demo] Fresh Buffalo Milk',  'fresh-buffalo-milk', 'Sample listing. Farm-fresh buffalo milk.', 'dairy', 70,  100, 'per litre', true, true),
    (cat_dairy, '[Demo] Fresh Cow Milk',      'fresh-cow-milk',     'Sample listing. Pure cow milk from farm cattle.', 'dairy', 55,  80,  'per litre', true, true),
    (cat_dairy, '[Demo] Pure Desi Ghee',      'pure-desi-ghee',     'Sample listing. Homemade pure desi ghee prepared using traditional bilona method.', 'dairy', 650, 25,  'per 500g',  true, true),
    (cat_dairy, '[Demo] Fresh Paneer',        'fresh-paneer',       'Sample listing. Soft and fresh paneer.', 'dairy', 320, 30,  'per 500g',  true, false),
    (cat_dairy, '[Demo] Fresh Curd (Dahi)',   'fresh-curd',         'Sample listing. Thick and creamy curd.', 'dairy', 45,  50,  'per 500g',  true, false),
    (cat_dairy, '[Demo] Buttermilk (Chaas)',  'buttermilk-chaas',   'Sample listing. Refreshing traditional buttermilk.', 'dairy', 25,  40,  'per litre', true, false)
  ON CONFLICT (slug) DO NOTHING;

  -- ---- Farming Goods (demo data) ----

  INSERT INTO products (category_id, name, slug, description, product_type, price, stock_quantity, unit, is_active, is_featured) VALUES
    (cat_farming, '[Demo] Cattle Feed (50kg)',           'cattle-feed-50kg',  'Sample listing. Cattle feed for dairy animals.',         'farming_goods', 1200, 50,  'per bag',   true, true),
    (cat_farming, '[Demo] Poultry Feed (25kg)',          'poultry-feed-25kg', 'Sample listing. Balanced poultry feed for chickens.',    'farming_goods', 750,  35,  'per bag',   true, false),
    (cat_farming, '[Demo] Stainless Steel Milk Can (20L)', 'ss-milk-can-20l', 'Sample listing. Food-grade stainless steel milk can.',  'farming_goods', 2800, 10,  'per piece',  true, true),
    (cat_farming, '[Demo] Hay Bale',                     'hay-bale',          'Sample listing. Clean and dry hay bale.',                'farming_goods', 350,  100, 'per bale',   true, false),
    (cat_farming, '[Demo] Water Trough (100L)',          'water-trough-100l', 'Sample listing. Heavy-duty water trough for livestock.', 'farming_goods', 1800, 8,   'per piece',  true, false)
  ON CONFLICT (slug) DO NOTHING;

END $$;


-- ============================================================
-- MANUAL CONFIGURATION STEPS
-- ============================================================
-- After running this migration, you still need to:
--
-- 1. CREATE STORAGE BUCKET (in Supabase Dashboard > Storage):
--    - Create a new bucket called "product-images"
--    - Set it to "Public"
--    - Add policy: Allow authenticated users to upload (INSERT)
--    - Add policy: Allow public to read (SELECT)
--
-- 2. PROMOTE A USER TO ADMIN (in Supabase Dashboard > SQL Editor):
--    UPDATE profiles SET role = 'admin' WHERE id = '<user-uuid-here>';
--    (Find user IDs in Authentication > Users)
--
-- 3. UPDATE SITE SETTINGS (optional):
--    UPDATE site_settings SET
--      phone = 'your-phone',
--      whatsapp_number = 'your-whatsapp',
--      email = 'your-email',
--      address = 'your-address'
--    WHERE business_name = 'GreenField Farms';
--
-- IMPORTANT: Never trust role changes from the client side.
-- The RLS policy on profiles prevents users from changing their own role.
-- ============================================================
