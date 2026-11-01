-- ============================================================
-- Greenfield Farms / Venkat Farms - Enquiries Table Upgrade
-- Ensures safe deletion and status management by administrators
-- ============================================================

-- 1. Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS public.enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Ensure RLS is enabled
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone (including unauthenticated guests) can insert an enquiry
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'enquiries' AND policyname = 'Anyone can create enquiries'
  ) THEN
    CREATE POLICY "Anyone can create enquiries"
      ON public.enquiries FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- 4. Policy: Only admins can view enquiries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'enquiries' AND policyname = 'Only admins can view enquiries'
  ) THEN
    CREATE POLICY "Only admins can view enquiries"
      ON public.enquiries FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 5. Policy: Only admins can update enquiries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'enquiries' AND policyname = 'Only admins can update enquiries'
  ) THEN
    CREATE POLICY "Only admins can update enquiries"
      ON public.enquiries FOR UPDATE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 6. Policy: Only admins can delete enquiries
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'enquiries' AND policyname = 'Only admins can delete enquiries'
  ) THEN
    CREATE POLICY "Only admins can delete enquiries"
      ON public.enquiries FOR DELETE
      USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- 7. Performance indexes
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON public.enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status);

