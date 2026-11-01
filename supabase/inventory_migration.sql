-- ============================================================
-- GreenField Farms - Product Availability & Inventory Management Migration
-- ============================================================
-- Run this in your Supabase SQL Editor:
-- Dashboard > Project ("pmnpwxjdbohifvwitrju") > SQL Editor
-- ============================================================

-- 1. Safely add availability columns to products table if they don't already exist
DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS availability_status TEXT NOT NULL DEFAULT 'available';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 2. Add check constraint for availability_status
DO $$ BEGIN
  ALTER TABLE public.products DROP CONSTRAINT IF EXISTS chk_product_availability_status;
  ALTER TABLE public.products ADD CONSTRAINT chk_product_availability_status 
    CHECK (availability_status IN ('available', 'sold', 'out_of_stock', 'reserved'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Create index for fast availability queries
CREATE INDEX IF NOT EXISTS idx_products_availability 
  ON public.products(availability_status, is_available, is_active);

-- 4. Backfill existing products according to their current stock & type
UPDATE public.products
SET
  availability_status = CASE
    WHEN product_type = 'livestock' AND stock_quantity <= 0 THEN 'sold'
    WHEN stock_quantity <= 0 THEN 'out_of_stock'
    ELSE 'available'
  END,
  is_available = (stock_quantity > 0)
WHERE availability_status IS NULL OR availability_status = 'available';

-- 5. Ensure stock_logs table exists for inventory audit trail
CREATE TABLE IF NOT EXISTS public.stock_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_logs_product ON public.stock_logs(product_id);
ALTER TABLE public.stock_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins can view stock logs" ON public.stock_logs;
  CREATE POLICY "Admins can view stock logs"
    ON public.stock_logs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Atomic Order Placement & Inventory Check Function
-- SECURITY DEFINER allows it to run as DB owner, locking products rows and updating inventory
CREATE OR REPLACE FUNCTION public.place_order_with_inventory_check(
  p_user_id UUID,
  p_customer_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_delivery_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_pincode TEXT,
  p_order_notes TEXT,
  p_delivery_type TEXT,
  p_payment_method TEXT,
  p_subtotal NUMERIC,
  p_delivery_charge NUMERIC,
  p_total_amount NUMERIC,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_item_name TEXT;
  v_unit_price NUMERIC;
  v_line_total NUMERIC;
  v_current_stock INTEGER;
  v_product_type TEXT;
  v_is_active BOOLEAN;
  v_avail_status TEXT;
  v_new_stock INTEGER;
BEGIN
  -- A. Validation: Check that items array is not empty
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- B. STEP 1: Lock and validate all products involved in the order
  -- Using FOR UPDATE prevents race conditions (two users buying the same single item)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
    v_item_name := COALESCE(v_item->>'product_name', 'Item');

    -- Lock the product row
    SELECT stock_quantity, product_type, is_active, availability_status, name
    INTO v_current_stock, v_product_type, v_is_active, v_avail_status, v_item_name
    FROM public.products
    WHERE id = v_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product "%" was not found in the catalog.', v_item_name;
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'Product "%" is currently deactivated and not available for purchase.', v_item_name;
    END IF;

    -- Livestock specific checks: single item sold check
    IF v_product_type = 'livestock' THEN
      IF v_avail_status = 'sold' OR v_current_stock <= 0 THEN
        RAISE EXCEPTION 'Livestock item "%" has already been sold.', v_item_name;
      END IF;
      IF v_qty > v_current_stock THEN
        RAISE EXCEPTION 'Only % unit(s) available for livestock "%".', v_current_stock, v_item_name;
      END IF;
    ELSE
      -- Regular goods checks
      IF v_avail_status = 'out_of_stock' OR v_current_stock <= 0 THEN
        RAISE EXCEPTION 'Product "%" is currently out of stock.', v_item_name;
      END IF;
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for "%". Only % available (requested %).', v_item_name, v_current_stock, v_qty;
      END IF;
    END IF;
  END LOOP;

  -- C. STEP 2: Insert into orders table
  INSERT INTO public.orders (
    user_id,
    customer_name,
    phone,
    email,
    delivery_address,
    city,
    state,
    pincode,
    order_notes,
    delivery_type,
    subtotal,
    delivery_charge,
    total_amount,
    order_status,
    payment_status,
    payment_method,
    created_at
  ) VALUES (
    p_user_id,
    p_customer_name,
    p_phone,
    p_email,
    p_delivery_address,
    p_city,
    p_state,
    p_pincode,
    p_order_notes,
    p_delivery_type,
    p_subtotal,
    p_delivery_charge,
    p_total_amount,
    'pending',
    'pending',
    p_payment_method,
    now()
  ) RETURNING id INTO v_order_id;

  -- D. STEP 3: Insert order items & atomically update inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_qty := COALESCE((v_item->>'quantity')::INTEGER, 1);
    v_item_name := COALESCE(v_item->>'product_name', 'Item');
    v_unit_price := (v_item->>'unit_price')::NUMERIC;
    v_line_total := COALESCE((v_item->>'line_total')::NUMERIC, v_unit_price * v_qty);

    -- Insert order item
    INSERT INTO public.order_items (
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      line_total
    ) VALUES (
      v_order_id,
      v_product_id,
      v_item_name,
      v_qty,
      v_unit_price,
      v_line_total
    );

    -- Re-fetch current stock
    SELECT stock_quantity, product_type
    INTO v_current_stock, v_product_type
    FROM public.products
    WHERE id = v_product_id;

    v_new_stock := GREATEST(0, v_current_stock - v_qty);

    -- Update inventory status
    IF v_product_type = 'livestock' THEN
      UPDATE public.products
      SET
        stock_quantity = v_new_stock,
        availability_status = CASE WHEN v_new_stock <= 0 THEN 'sold' ELSE 'available' END,
        is_available = (v_new_stock > 0),
        sold_at = CASE WHEN v_new_stock <= 0 THEN now() ELSE sold_at END,
        updated_at = now()
      WHERE id = v_product_id;
    ELSE
      UPDATE public.products
      SET
        stock_quantity = v_new_stock,
        availability_status = CASE WHEN v_new_stock <= 0 THEN 'out_of_stock' ELSE 'available' END,
        is_available = (v_new_stock > 0),
        updated_at = now()
      WHERE id = v_product_id;
    END IF;

    -- Record stock log
    BEGIN
      INSERT INTO public.stock_logs (
        product_id,
        change_amount,
        previous_stock,
        new_stock,
        reason
      ) VALUES (
        v_product_id,
        -v_qty,
        v_current_stock,
        v_new_stock,
        'Order placement: ' || v_order_id::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- Don't fail the order if stock_logs table has issues
      NULL;
    END;
  END LOOP;

  -- E. Return success result
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'message', 'Order placed and inventory updated successfully'
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.place_order_with_inventory_check TO anon, authenticated, service_role;

-- 7. Function to restore product stock (for Admin)
CREATE OR REPLACE FUNCTION public.admin_restore_product_stock(
  p_product_id UUID,
  p_new_stock INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_stock INTEGER;
  v_is_admin BOOLEAN;
BEGIN
  -- Verify caller is admin
  SELECT (role = 'admin') INTO v_is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can restore stock.';
  END IF;

  SELECT stock_quantity INTO v_old_stock
  FROM public.products
  WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  UPDATE public.products
  SET
    stock_quantity = p_new_stock,
    is_available = (p_new_stock > 0),
    availability_status = CASE WHEN p_new_stock > 0 THEN 'available' ELSE 'out_of_stock' END,
    sold_at = CASE WHEN p_new_stock > 0 THEN NULL ELSE sold_at END,
    updated_at = now()
  WHERE id = p_product_id;

  BEGIN
    INSERT INTO public.stock_logs (
      product_id, change_amount, previous_stock, new_stock, reason
    ) VALUES (
      p_product_id, p_new_stock - v_old_stock, v_old_stock, p_new_stock, 'Admin stock restoration'
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'new_stock', p_new_stock
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_restore_product_stock TO authenticated, service_role;

