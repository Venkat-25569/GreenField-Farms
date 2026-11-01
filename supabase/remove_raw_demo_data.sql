-- ============================================================
-- Greenfield Farms / Venkat Farms
-- Permanently Remove Raw Demo Products & Sample Data
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pmnpwxjdbohifvwitrju/sql
-- ============================================================

-- 1. Permanently delete all sample/demo products
-- (Related product_images, livestock_details, reviews, and videos will cascade automatically)
DELETE FROM public.products
WHERE name ILIKE '[Demo]%'
   OR name ILIKE 'Demo%'
   OR description ILIKE 'Sample listing%'
   OR slug IN (
     'kadaknath-rooster',
     'aseel-fighting-cock',
     'country-hen-desi',
     'murrah-buffalo',
     'nili-ravi-buffalo',
     'fresh-buffalo-milk',
     'fresh-cow-milk',
     'pure-desi-ghee',
     'fresh-paneer',
     'fresh-curd',
     'buttermilk-chaas',
     'cattle-feed-50kg',
     'poultry-feed-25kg',
     'ss-milk-can-20l',
     'hay-bale',
     'water-trough-100l'
   );

-- 2. Verify: View your real active products
SELECT 
  id, 
  name, 
  product_type, 
  price, 
  stock_quantity, 
  availability_status, 
  is_available,
  is_active
FROM public.products
ORDER BY created_at DESC;

