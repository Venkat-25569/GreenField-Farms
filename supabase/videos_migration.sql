-- ============================================================
-- GreenField Farms - Product Videos Migration
-- ============================================================
-- Run this in your Supabase SQL Editor:
-- Dashboard > Project ("pmnpwxjdbohifvwitrju") > SQL Editor
-- ============================================================

-- 1. Create product_videos table
CREATE TABLE IF NOT EXISTS public.product_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  file_name TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast retrieval
CREATE INDEX IF NOT EXISTS idx_product_videos_product ON public.product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_order ON public.product_videos(display_order);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.product_videos ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Customers and visitors can view all product videos
DO $$ BEGIN
  DROP POLICY IF EXISTS "Product videos are viewable by everyone" ON public.product_videos;
  CREATE POLICY "Product videos are viewable by everyone"
    ON public.product_videos FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins only can insert product videos
DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admins can insert product videos" ON public.product_videos;
  CREATE POLICY "Only admins can insert product videos"
    ON public.product_videos FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins only can update product videos
DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admins can update product videos" ON public.product_videos;
  CREATE POLICY "Only admins can update product videos"
    ON public.product_videos FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Admins only can delete product videos
DO $$ BEGIN
  DROP POLICY IF EXISTS "Only admins can delete product videos" ON public.product_videos;
  CREATE POLICY "Only admins can delete product videos"
    ON public.product_videos FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

