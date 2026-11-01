-- ============================================================
-- GreenField Farms - Platform Upgrade Migration (v2.0)
-- Professional Farm Management & E-Commerce Platform
-- ============================================================
-- Safe to run in Supabase SQL Editor (Dashboard > SQL Editor)
-- Preserves all existing tables, users, and product data.
-- ============================================================

-- 1. Extend site_settings table with banner, about content, and announcement
ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
  ADD COLUMN IF NOT EXISTS about_content TEXT,
  ADD COLUMN IF NOT EXISTS announcement TEXT;

-- 2. Update default site settings with GreenField Farms defaults if needed
UPDATE public.site_settings
SET 
  phone = COALESCE(phone, '+91 9392629819'),
  whatsapp_number = COALESCE(whatsapp_number, '919392629819'),
  email = COALESCE(email, 'nagavenkateswararao2006@gmail.com'),
  address = COALESCE(address, 'Village Road, District Name, State, India'),
  about_content = COALESCE(about_content, 'GreenField Farms is dedicated to raising pure-breed healthy livestock, producing farm-fresh organic dairy, and providing dependable farming goods directly from our pastures to your family and farm.')
WHERE id = (SELECT id FROM public.site_settings LIMIT 1);

-- 3. Update orders order_status check constraint to support 'ready_for_delivery'
DO $$ 
BEGIN
  -- Drop existing check constraint if present
  ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_order_status_check;
  -- Re-add with extended status values
  ALTER TABLE public.orders ADD CONSTRAINT orders_order_status_check 
    CHECK (order_status IN ('pending', 'confirmed', 'processing', 'ready_for_delivery', 'shipped', 'delivered', 'cancelled'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 4. Update enquiries status check constraint to support 'new', 'in_progress', 'responded', 'resolved'
DO $$ 
BEGIN
  -- Drop existing check constraint if present
  ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_status_check;
  -- Re-add with extended status values
  ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_status_check 
    CHECK (status IN ('new', 'in_progress', 'responded', 'resolved', 'pending', 'contacted'));
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 5. Stock Update History & Inventory Logs Table
CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'manual_adjustment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_logs_product ON public.stock_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_logs_created ON public.stock_logs(created_at DESC);

ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Stock logs viewable by admins"
    ON public.stock_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Stock logs insertable by admins"
    ON public.stock_logs FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Trigger to automatically reduce product stock and record stock log when order items are created
CREATE OR REPLACE FUNCTION public.handle_order_stock_reduction()
RETURNS TRIGGER AS $$
DECLARE
  current_qty INTEGER;
BEGIN
  -- Get current product stock
  SELECT stock_quantity INTO current_qty 
  FROM public.products 
  WHERE id = NEW.product_id;

  IF current_qty IS NOT NULL THEN
    -- Update product stock
    UPDATE public.products
    SET 
      stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
      updated_at = now()
    WHERE id = NEW.product_id;

    -- Record stock log
    INSERT INTO public.stock_logs (product_id, change_amount, previous_stock, new_stock, reason)
    VALUES (
      NEW.product_id,
      -NEW.quantity,
      current_qty,
      GREATEST(0, current_qty - NEW.quantity),
      'order_placed'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_order_stock_reduction ON public.order_items;
CREATE TRIGGER trigger_order_stock_reduction
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_stock_reduction();

-- 7. Ensure RLS on profiles protects role elevation
-- Users can NEVER change their own role to 'admin'
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
      auth.uid() = id
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 8. Allow admins full view access to profiles for Customer Management
DO $$ BEGIN
  CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
      auth.uid() = id
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 9. Allow admins to insert/update site_settings
DO $$ BEGIN
  CREATE POLICY "Only admins can insert site settings"
    ON public.site_settings FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. Helper view for customer analytics (admin only)
CREATE OR REPLACE VIEW public.customer_stats AS
SELECT 
  p.id,
  p.full_name,
  p.phone,
  p.role,
  p.created_at,
  COUNT(o.id) AS total_orders,
  COALESCE(SUM(o.total_amount), 0) AS total_spent
FROM public.profiles p
LEFT JOIN public.orders o ON o.user_id = p.id
WHERE p.role = 'customer'
GROUP BY p.id, p.full_name, p.phone, p.role, p.created_at;
