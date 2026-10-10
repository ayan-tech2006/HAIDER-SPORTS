-- ============================================================================
-- HAIDERSPORTS CRICKET STORE - SUPABASE DATABASE SCHEMA
-- File: supabase/schema.sql
-- Description: Complete production schema including tables, leaf-node triggers,
--              order placement RPC with DB price recalculation, tracking RPC,
--              strict Row Level Security (RLS), storage bucket, and initial seed.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & COMMON TRIGGERS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable timestamp updater
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Human-readable Order Number Sequence (RS-10001 onwards)
CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 10001;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'RS-' || nextval('order_number_seq')::text;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- 2.1 Collections (hierarchical category tree)
CREATE TABLE IF NOT EXISTS public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES public.collections(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text NOT NULL,
  image_url text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique slug within parent (or among root items if parent_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS collections_parent_slug_idx 
ON public.collections(COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), slug);

CREATE TRIGGER trg_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.2 Products
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE RESTRICT,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price integer NOT NULL CHECK (price >= 0),
  compare_at_price integer CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  tag text,
  stock integer NOT NULL DEFAULT 15 CHECK (stock >= 0),
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.3 Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);


-- 2.4 Product Variants (e.g. Bat Weights, Shoe Sizes, Clothing Sizes)
CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  label text NOT NULL,        -- 'Weight', 'Size', 'Pack'
  value text NOT NULL,        -- '1150g', 'L', 'Pack of 3'
  price_override integer CHECK (price_override IS NULL OR price_override >= 0),
  stock integer DEFAULT 10 CHECK (stock IS NULL OR stock >= 0),
  created_at timestamptz DEFAULT now()
);


-- 2.5 Orders (Guest checkout model)
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  city text NOT NULL,
  address text NOT NULL,
  landmark text,
  notes text,
  payment_method text NOT NULL CHECK (payment_method IN ('cod', 'bank')),
  payment_ref text,
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  delivery_charge integer NOT NULL DEFAULT 0 CHECK (delivery_charge >= 0),
  discount integer NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total integer NOT NULL CHECK (total >= 0),
  coupon_code text,
  status text NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned')),
  courier text,
  tracking_number text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.6 Order Items (Immutable snapshot of line items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  variant text,
  price integer NOT NULL CHECK (price >= 0),
  qty integer NOT NULL CHECK (qty > 0),
  line_total integer NOT NULL CHECK (line_total >= 0),
  created_at timestamptz DEFAULT now()
);


-- 2.7 Order Status History (Auditable progress log)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);


-- 2.8 Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percent', 'fixed')),
  value integer NOT NULL CHECK (value > 0),
  min_order integer DEFAULT 0 CHECK (min_order >= 0),
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_coupons_updated_at
BEFORE UPDATE ON public.coupons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.9 Reviews (Public submission with admin moderation)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);


-- 2.10 Blog Posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  cover_url text NOT NULL,
  content text NOT NULL,
  category text NOT NULL,
  author text NOT NULL,
  is_published boolean DEFAULT true,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.11 Home Content (Hero sliders, category banner, flash offers)
CREATE TABLE IF NOT EXISTS public.home_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text NOT NULL CHECK (section IN ('hero', 'category_slider', 'offer')),
  data jsonb NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_home_content_updated_at
BEFORE UPDATE ON public.home_content
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.12 Store Settings (Single row config)
CREATE TABLE IF NOT EXISTS public.settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL DEFAULT 'Haider Sports',
  phone text NOT NULL DEFAULT '+92 300 1234567',
  whatsapp text NOT NULL DEFAULT '+92 300 1234567',
  email text NOT NULL DEFAULT 'support@haidersports.pk',
  address text NOT NULL DEFAULT 'Kashmir Road, Model Town, Sialkot, Punjab, Pakistan',
  delivery jsonb NOT NULL,
  bank_details jsonb NOT NULL,
  social jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- 2.13 Messages (Contact form inquiries)
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  subject text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);


-- 2.14 Newsletter Subscribers
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);


-- 2.15 Admin Users List
CREATE TABLE IF NOT EXISTS public.admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);


-- ----------------------------------------------------------------------------
-- 3. TREE INTEGRITY & LEAF COLLECTION TRIGGERS
-- ----------------------------------------------------------------------------

-- Enforce that products can only be attached to leaf collections (collections with no children)
CREATE OR REPLACE FUNCTION check_product_leaf_collection()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.collections WHERE parent_id = NEW.collection_id) THEN
    RAISE EXCEPTION 'Constraint Violation: Products can only be placed into leaf collections (categories without subcategories).';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_product_leaf_collection ON public.products;
CREATE TRIGGER trg_check_product_leaf_collection
BEFORE INSERT OR UPDATE OF collection_id ON public.products
FOR EACH ROW EXECUTE FUNCTION check_product_leaf_collection();

-- Prevent adding child collections to a collection that already has products directly assigned
CREATE OR REPLACE FUNCTION check_collection_has_no_products()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.products WHERE collection_id = NEW.parent_id) THEN
      RAISE EXCEPTION 'Constraint Violation: Cannot create subcategory under a category that already contains products directly.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_collection_has_no_products ON public.collections;
CREATE TRIGGER trg_check_collection_has_no_products
BEFORE INSERT OR UPDATE OF parent_id ON public.collections
FOR EACH ROW EXECUTE FUNCTION check_collection_has_no_products();


-- ----------------------------------------------------------------------------
-- 4. PERFORMANCE INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_collections_parent_id ON public.collections(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON public.products(collection_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published, published_at DESC);


-- ----------------------------------------------------------------------------
-- 5. CORE RPC FUNCTIONS
-- ----------------------------------------------------------------------------

-- 5.1 Admin Authorization Check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- 5.2 Validate Coupon Function
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_subtotal integer)
RETURNS integer AS $$
DECLARE
  v_coupon record;
  v_discount integer := 0;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN 0;
  END IF;

  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE UPPER(code) = UPPER(TRIM(p_code))
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_COUPON: Coupon code does not exist or is inactive';
  END IF;

  IF v_coupon.starts_at IS NOT NULL AND now() < v_coupon.starts_at THEN
    RAISE EXCEPTION 'INVALID_COUPON: Coupon is not yet active';
  END IF;

  IF v_coupon.ends_at IS NOT NULL AND now() > v_coupon.ends_at THEN
    RAISE EXCEPTION 'INVALID_COUPON: Coupon has expired';
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RAISE EXCEPTION 'INVALID_COUPON: Coupon usage limit reached';
  END IF;

  IF p_subtotal < v_coupon.min_order THEN
    RAISE EXCEPTION 'INVALID_COUPON: Minimum order amount of Rs. % required for this coupon', v_coupon.min_order;
  END IF;

  IF v_coupon.type = 'percent' THEN
    v_discount := ROUND((p_subtotal * v_coupon.value)::numeric / 100.0);
  ELSIF v_coupon.type = 'fixed' THEN
    v_discount := LEAST(v_coupon.value, p_subtotal);
  END IF;

  RETURN v_discount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5.3 Place Order (Transactional, Server-Side Price Verification, Stock Check & Deduction)
CREATE OR REPLACE FUNCTION public.place_order(payload jsonb)
RETURNS jsonb AS $$
DECLARE
  v_customer_name text;
  v_phone text;
  v_clean_phone text;
  v_whatsapp text;
  v_email text;
  v_city text;
  v_address text;
  v_landmark text;
  v_notes text;
  v_payment_method text;
  v_payment_ref text;
  v_coupon_code text;
  v_recent_orders integer;

  v_item jsonb;
  v_prod_id uuid;
  v_prod record;
  v_variant_val text;
  v_item_price integer;
  v_qty integer;
  v_line_total integer;
  v_subtotal integer := 0;
  v_discount integer := 0;
  v_delivery_charge integer := 0;
  v_total integer := 0;

  v_order_number text;
  v_order_id uuid;

  v_delivery_settings jsonb;
  v_flat_rate integer;
  v_free_above integer;
BEGIN
  -- Extract Customer Inputs
  v_customer_name := TRIM(COALESCE(payload->>'customer_name', ''));
  v_phone := TRIM(COALESCE(payload->>'phone', ''));
  v_clean_phone := REGEXP_REPLACE(v_phone, '\D', '', 'g');
  v_whatsapp := NULLIF(TRIM(COALESCE(payload->>'whatsapp', '')), '');
  v_email := NULLIF(TRIM(COALESCE(payload->>'email', '')), '');
  v_city := TRIM(COALESCE(payload->>'city', ''));
  v_address := TRIM(COALESCE(payload->>'address', ''));
  v_landmark := NULLIF(TRIM(COALESCE(payload->>'landmark', '')), '');
  v_notes := NULLIF(TRIM(COALESCE(payload->>'notes', '')), '');
  v_payment_method := LOWER(TRIM(COALESCE(payload->>'payment_method', 'cod')));
  v_payment_ref := NULLIF(TRIM(COALESCE(payload->>'payment_ref', '')), '');
  v_coupon_code := NULLIF(TRIM(COALESCE(payload->>'coupon_code', '')), '');

  IF v_customer_name = '' THEN RAISE EXCEPTION 'Customer name is required'; END IF;
  IF LENGTH(v_clean_phone) < 10 THEN RAISE EXCEPTION 'Valid Pakistani phone number required'; END IF;
  IF v_city = '' THEN RAISE EXCEPTION 'City is required'; END IF;
  IF v_address = '' THEN RAISE EXCEPTION 'Delivery address is required'; END IF;
  IF v_payment_method NOT IN ('cod', 'bank') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;

  IF payload->'items' IS NULL OR jsonb_array_length(payload->'items') = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Design Note: Rate-limit protection against automated spam (max 5 orders per phone per hour)
  SELECT count(*) INTO v_recent_orders
  FROM public.orders
  WHERE REGEXP_REPLACE(phone, '\D', '', 'g') = v_clean_phone
    AND created_at >= now() - INTERVAL '1 hour';

  IF v_recent_orders >= 5 THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED: Maximum 5 orders allowed per phone number per hour';
  END IF;

  -- Phase 1: Verify all products against DATABASE prices & stock availability
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'qty')::integer, 1);
    IF v_qty <= 0 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;

    SELECT * INTO v_prod FROM public.products WHERE id = v_prod_id;
    IF NOT FOUND OR v_prod.is_active = false THEN
      RAISE EXCEPTION 'Product is not available: %', COALESCE(v_prod.name, v_prod_id::text);
    END IF;

    IF v_prod.stock < v_qty THEN
      RAISE EXCEPTION 'OUT_OF_STOCK: %', v_prod.name;
    END IF;

    -- Variant price lookup if variant selected
    v_variant_val := NULLIF(TRIM(COALESCE(v_item->>'variant', '')), '');
    v_item_price := v_prod.price;
    IF v_variant_val IS NOT NULL THEN
      SELECT COALESCE(price_override, v_prod.price) INTO v_item_price
      FROM public.product_variants
      WHERE product_id = v_prod_id AND value = v_variant_val
      LIMIT 1;
      IF v_item_price IS NULL THEN v_item_price := v_prod.price; END IF;
    END IF;

    v_line_total := v_item_price * v_qty;
    v_subtotal := v_subtotal + v_line_total;
  END LOOP;

  -- Phase 2: Coupon verification
  IF v_coupon_code IS NOT NULL THEN
    v_discount := public.validate_coupon(v_coupon_code, v_subtotal);
  END IF;

  -- Phase 3: Shipping fee calculation from store settings
  SELECT delivery INTO v_delivery_settings FROM public.settings LIMIT 1;
  v_flat_rate := COALESCE((v_delivery_settings->>'flatRate')::integer, 250);
  v_free_above := COALESCE((v_delivery_settings->>'freeAbove')::integer, 5000);

  IF v_subtotal >= v_free_above THEN
    v_delivery_charge := 0;
  ELSIF v_delivery_settings->'cityRates' ? v_city THEN
    v_delivery_charge := (v_delivery_settings->'cityRates'->>v_city)::integer;
  ELSE
    v_delivery_charge := v_flat_rate;
  END IF;

  v_total := GREATEST(0, v_subtotal - v_discount + v_delivery_charge);
  v_order_number := generate_order_number();

  -- Phase 4: Insert Order Header
  INSERT INTO public.orders (
    order_number, customer_name, phone, whatsapp, email, city, address,
    landmark, notes, payment_method, payment_ref, subtotal, delivery_charge,
    discount, total, coupon_code, status
  ) VALUES (
    v_order_number, v_customer_name, v_phone, v_whatsapp, v_email, v_city, v_address,
    v_landmark, v_notes, v_payment_method, v_payment_ref, v_subtotal, v_delivery_charge,
    v_discount, v_total, v_coupon_code, 'pending'
  ) RETURNING id INTO v_order_id;

  -- Phase 5: Insert Order Items & Decrement Inventory
  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items')
  LOOP
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := COALESCE((v_item->>'qty')::integer, 1);
    v_variant_val := NULLIF(TRIM(COALESCE(v_item->>'variant', '')), '');

    SELECT * INTO v_prod FROM public.products WHERE id = v_prod_id;
    v_item_price := v_prod.price;
    IF v_variant_val IS NOT NULL THEN
      SELECT COALESCE(price_override, v_prod.price) INTO v_item_price
      FROM public.product_variants
      WHERE product_id = v_prod_id AND value = v_variant_val
      LIMIT 1;
      IF v_item_price IS NULL THEN v_item_price := v_prod.price; END IF;
    END IF;

    v_line_total := v_item_price * v_qty;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, variant, price, qty, line_total
    ) VALUES (
      v_order_id, v_prod_id, v_prod.name, v_variant_val, v_item_price, v_qty, v_line_total
    );

    UPDATE public.products
    SET stock = stock - v_qty
    WHERE id = v_prod_id;
  END LOOP;

  -- Initial Timeline Entry
  INSERT INTO public.order_status_history (order_id, status, note)
  VALUES (v_order_id, 'Pending', 'Order placed successfully by customer via guest checkout');

  -- Update coupon usage count
  IF v_coupon_code IS NOT NULL AND v_discount > 0 THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE UPPER(code) = UPPER(v_coupon_code);
  END IF;

  RETURN jsonb_build_object(
    'order_number', v_order_number,
    'total', v_total,
    'order_id', v_order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5.4 Track Order (Secure Verification: Requires Both Order Number AND Phone)
CREATE OR REPLACE FUNCTION public.track_order(p_order_number text, p_phone text)
RETURNS jsonb AS $$
DECLARE
  v_clean_order text;
  v_clean_phone text;
  v_order record;
  v_items jsonb;
  v_history jsonb;
BEGIN
  v_clean_order := UPPER(TRIM(COALESCE(p_order_number, '')));
  v_clean_phone := REGEXP_REPLACE(COALESCE(p_phone, ''), '\D', '', 'g');

  IF v_clean_order = '' OR v_clean_phone = '' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE UPPER(order_number) = v_clean_order
    AND (
      REGEXP_REPLACE(phone, '\D', '', 'g') = v_clean_phone
      OR RIGHT(REGEXP_REPLACE(phone, '\D', '', 'g'), 10) = RIGHT(v_clean_phone, 10)
    );

  -- Do not reveal whether the order exists if the phone doesn't match
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', oi.id,
      'product_id', oi.product_id,
      'product_name', oi.product_name,
      'variant', oi.variant,
      'price', oi.price,
      'qty', oi.qty,
      'line_total', oi.line_total
    )
  ) INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'status', osh.status,
      'note', osh.note,
      'created_at', osh.created_at
    ) ORDER BY osh.created_at ASC
  ) INTO v_history
  FROM public.order_status_history osh
  WHERE osh.order_id = v_order.id;

  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'customer_name', v_order.customer_name,
    'phone', v_order.phone,
    'city', v_order.city,
    'address', v_order.address,
    'courier', v_order.courier,
    'tracking_number', v_order.tracking_number,
    'payment_method', v_order.payment_method,
    'subtotal', v_order.subtotal,
    'delivery_charge', v_order.delivery_charge,
    'discount', v_order.discount,
    'total', v_order.total,
    'items', COALESCE(v_items, '[]'::jsonb),
    'status_history', COALESCE(v_history, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all 14 tables
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 6.1 Collections Policies
CREATE POLICY "Public can view active collections"
ON public.collections FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin full access on collections"
ON public.collections FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.2 Products Policies
CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin full access on products"
ON public.products FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.3 Product Images Policies
CREATE POLICY "Public can view active product images"
ON public.product_images FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
  )
);

CREATE POLICY "Admin full access on product images"
ON public.product_images FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.4 Product Variants Policies
CREATE POLICY "Public can view active product variants"
ON public.product_variants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p 
    WHERE p.id = product_id AND (p.is_active = true OR public.is_admin())
  )
);

CREATE POLICY "Admin full access on product variants"
ON public.product_variants FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.5 Orders & Order Items Policies (Public has NO direct access; must use place_order / track_order RPCs)
CREATE POLICY "Admin full access on orders"
ON public.orders FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access on order items"
ON public.order_items FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admin full access on order status history"
ON public.order_status_history FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.6 Coupons Policies (Public evaluated via validate_coupon RPC only)
CREATE POLICY "Admin full access on coupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.7 Reviews Policies
CREATE POLICY "Public can view approved reviews"
ON public.reviews FOR SELECT
USING (is_approved = true OR public.is_admin());

CREATE POLICY "Public can submit reviews (unapproved by default)"
ON public.reviews FOR INSERT
WITH CHECK (is_approved = false);

CREATE POLICY "Admin full access on reviews"
ON public.reviews FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.8 Blog Posts Policies
CREATE POLICY "Public can view published blog posts"
ON public.blog_posts FOR SELECT
USING (is_published = true OR public.is_admin());

CREATE POLICY "Admin full access on blog posts"
ON public.blog_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.9 Home Content Policies
CREATE POLICY "Public can view active home content"
ON public.home_content FOR SELECT
USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin full access on home content"
ON public.home_content FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.10 Settings Policies
CREATE POLICY "Public can read settings"
ON public.settings FOR SELECT
USING (true);

CREATE POLICY "Admin can update settings"
ON public.settings FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.11 Messages Policies
CREATE POLICY "Public can submit contact messages"
ON public.messages FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin full access on messages"
ON public.messages FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.12 Newsletter Subscribers Policies
CREATE POLICY "Public can subscribe to newsletter"
ON public.subscribers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin full access on subscribers"
ON public.subscribers FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 6.13 Admins Policies
CREATE POLICY "Only admins can view admin table"
ON public.admins FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- 7. STORAGE BUCKET CONFIGURATION
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

-- Storage RLS Policies
CREATE POLICY "Public image read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

CREATE POLICY "Admin image insert access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images' AND public.is_admin());

CREATE POLICY "Admin image update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND public.is_admin())
WITH CHECK (bucket_id = 'images' AND public.is_admin());

CREATE POLICY "Admin image delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND public.is_admin());


-- ----------------------------------------------------------------------------
-- 8. COMPREHENSIVE SEED DATA
-- ----------------------------------------------------------------------------

-- 8.1 Store Settings Seed
INSERT INTO public.settings (
  id, store_name, phone, whatsapp, email, address, delivery, bank_details, social
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Haider Sports',
  '+92 300 1234567',
  '923001234567',
  'support@haidersports.pk',
  'Kashmir Road, Model Town, Sialkot, Punjab, Pakistan',
  '{
    "flatRate": 250,
    "freeAbove": 5000,
    "cityRates": {
      "Karachi": 200,
      "Lahore": 200,
      "Rawalpindi": 200,
      "Islamabad": 200,
      "Sialkot": 150,
      "Faisalabad": 220,
      "Peshawar": 250,
      "Multan": 230,
      "Quetta": 280
    }
  }'::jsonb,
  '{
    "bankName": "Meezan Bank Ltd",
    "accountTitle": "Haider Sports Pakistan",
    "accountNumber": "02010108923451",
    "iban": "PK45MEZN0002010108923451",
    "branch": "Sialkot Cantt Branch",
    "jazzcash": "03001234567 (Haider Sports)",
    "easypaisa": "03001234567 (Haider Sports)"
  }'::jsonb,
  '{
    "facebook": "https://facebook.com/haidersports",
    "instagram": "https://instagram.com/haidersports",
    "tiktok": "https://tiktok.com/@haidersports",
    "youtube": "https://youtube.com/@haidersports"
  }'::jsonb
) ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  delivery = EXCLUDED.delivery,
  bank_details = EXCLUDED.bank_details;


-- 8.2 Coupons Seed
INSERT INTO public.coupons (code, type, value, min_order, max_uses, starts_at, is_active)
VALUES 
  ('WELCOME10', 'percent', 10, 2000, 1000, now(), true),
  ('HAIDER500', 'fixed', 500, 5000, 500, now(), true),
  ('CRICKETSEASON', 'percent', 15, 3500, 300, now(), true)
ON CONFLICT (code) DO NOTHING;


-- 8.3 Collections Seed Hierarchy
-- Top-level Collections
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c1000000-0000-0000-0000-000000000001'::uuid, NULL, 'Cricket', 'cricket', '1593341646647-75b32930e4a1', 1),
  ('c1000000-0000-0000-0000-000000000002'::uuid, NULL, 'Footwear', 'footwear', '1542291026-7eec264c27ff', 2)
ON CONFLICT (id) DO NOTHING;

-- Second-level Collections under 'Cricket'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c2000000-0000-0000-0000-000000000001'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Bats', 'bats', '1758791184255-411236a49346', 1),
  ('c2000000-0000-0000-0000-000000000002'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Balls', 'balls', '1743342873510-55d49972b746', 2),
  ('c2000000-0000-0000-0000-000000000003'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Hardball Kits', 'hardball-kits', '1776229705264-6b437229654b', 3),
  ('c2000000-0000-0000-0000-000000000004'::uuid, 'c1000000-0000-0000-0000-000000000001'::uuid, 'Cricket Clothing', 'clothing', '1586790170083-2f9ceadc732d', 4)
ON CONFLICT (id) DO NOTHING;

-- Third-level (Leaf) Collections under 'Bats'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c3000000-0000-0000-0000-000000000001'::uuid, 'c2000000-0000-0000-0000-000000000001'::uuid, 'Tape Ball Bats', 'tape-ball-bats', '1758791184255-411236a49346', 1),
  ('c3000000-0000-0000-0000-000000000002'::uuid, 'c2000000-0000-0000-0000-000000000001'::uuid, 'Hardball Bats', 'hardball-bats', '1630851278830-c0c9b12933ee', 2),
  ('c3000000-0000-0000-0000-000000000003'::uuid, 'c2000000-0000-0000-0000-000000000001'::uuid, 'Junior Bats', 'junior-bats', '1643593595725-80986444214e', 3)
ON CONFLICT (id) DO NOTHING;

-- Fourth-level (Leaf) Collections under 'Hardball Bats'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c4000000-0000-0000-0000-000000000001'::uuid, 'c3000000-0000-0000-0000-000000000002'::uuid, 'English Willow', 'english-willow', '1630851278830-c0c9b12933ee', 1),
  ('c4000000-0000-0000-0000-000000000002'::uuid, 'c3000000-0000-0000-0000-000000000002'::uuid, 'Kashmir Willow', 'kashmir-willow', '1593341646647-75b32930e4a1', 2)
ON CONFLICT (id) DO NOTHING;

-- Leaf Collections under 'Balls'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c3000000-0000-0000-0000-000000000004'::uuid, 'c2000000-0000-0000-0000-000000000002'::uuid, 'Hard Ball', 'hard-ball', '1743342873510-55d49972b746', 1),
  ('c3000000-0000-0000-0000-000000000005'::uuid, 'c2000000-0000-0000-0000-000000000002'::uuid, 'Tape Ball', 'tape-ball', '1777713174772-73f9da4984ed', 2),
  ('c3000000-0000-0000-0000-000000000006'::uuid, 'c2000000-0000-0000-0000-000000000002'::uuid, 'Tennis Ball', 'tennis-ball', '1768360647310-2612990f3572', 3)
ON CONFLICT (id) DO NOTHING;

-- Leaf Collections under 'Hardball Kits'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c3000000-0000-0000-0000-000000000007'::uuid, 'c2000000-0000-0000-0000-000000000003'::uuid, 'Complete Kits', 'complete-kits', '1785906359975-3b9e7fd8d230', 1),
  ('c3000000-0000-0000-0000-000000000008'::uuid, 'c2000000-0000-0000-0000-000000000003'::uuid, 'Helmets', 'helmets', '1776229705528-9bcd14792045', 2),
  ('c3000000-0000-0000-0000-000000000009'::uuid, 'c2000000-0000-0000-0000-000000000003'::uuid, 'Batting Gloves', 'gloves', '1785906359585-9c053458d551', 3),
  ('c3000000-0000-0000-0000-000000000010'::uuid, 'c2000000-0000-0000-0000-000000000003'::uuid, 'Pads & Guards', 'pads-guards', '1785906359458-a03460ad7073', 4)
ON CONFLICT (id) DO NOTHING;

-- Leaf Collections under 'Clothing'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c3000000-0000-0000-0000-000000000011'::uuid, 'c2000000-0000-0000-0000-000000000004'::uuid, 'Shirts', 'shirts', '1583743814966-8936f5b7be1a', 1),
  ('c3000000-0000-0000-0000-000000000012'::uuid, 'c2000000-0000-0000-0000-000000000004'::uuid, 'Trousers', 'trousers', '1473966968600-fa801b869a1a', 2)
ON CONFLICT (id) DO NOTHING;

-- Leaf Collections under 'Footwear'
INSERT INTO public.collections (id, parent_id, name, slug, image_url, sort_order)
VALUES
  ('c3000000-0000-0000-0000-000000000013'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Running Shoes', 'running-shoes', '1542291026-7eec264c27ff', 1),
  ('c3000000-0000-0000-0000-000000000014'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Cricket Shoes', 'cricket-shoes', '1560769629-975ec94e6a86', 2),
  ('c3000000-0000-0000-0000-000000000015'::uuid, 'c1000000-0000-0000-0000-000000000002'::uuid, 'Sneakers', 'sneakers', '1525966226538-464812378f94', 3)
ON CONFLICT (id) DO NOTHING;


-- 8.4 Products Seed (Assigned exclusively to LEAF collections)
INSERT INTO public.products (id, collection_id, name, slug, description, price, compare_at_price, tag, stock, is_featured)
VALUES
  -- Tape Ball Bats (Collection c3000000-0000-0000-0000-000000000001)
  ('b0000000-0000-0000-0000-000000000001'::uuid, 'c3000000-0000-0000-0000-000000000001'::uuid, 
   'Tape Ball Bat - Power Hitter', 'tape-ball-bat-power-hitter', 
   'Handcrafted for maximum sixes with full spine and scooped wings. Double cane handle absorbs maximum shock during fast-paced matches.', 
   3500, 4200, '-17%', 25, true),
  ('b0000000-0000-0000-0000-000000000002'::uuid, 'c3000000-0000-0000-0000-000000000001'::uuid, 
   'Tape Ball Bat - Pro Light', 'tape-ball-bat-pro-light', 
   'Super lightweight 790g tape ball bat with ultra-fast pickup for wristy strokes and quick pulls.', 
   2800, NULL, NULL, 30, false),
  ('b0000000-0000-0000-0000-000000000003'::uuid, 'c3000000-0000-0000-0000-000000000001'::uuid, 
   'Tamboo Tape Ball Bat', 'tamboo-tape-ball-bat', 
   'Heavy-weight 860g beast bat engineered for deep boundary tournament play across Pakistan.', 
   3200, 3800, '-16%', 20, false),
  ('b0000000-0000-0000-0000-000000000004'::uuid, 'c3000000-0000-0000-0000-000000000001'::uuid, 
   'Tape Ball Bat - Striker', 'tape-ball-bat-striker', 
   'Balanced profile with thick 45mm edges and high sweet spot for bouncy cement wickets.', 
   2500, NULL, 'New', 18, false),

  -- English Willow (Collection c4000000-0000-0000-0000-000000000001)
  ('b0000000-0000-0000-0000-000000000005'::uuid, 'c4000000-0000-0000-0000-000000000001'::uuid, 
   'English Willow Grade 1 Bat', 'english-willow-grade-1-bat', 
   'Top 1% Salix Alba Caerulea cleft with 8+ straight grains. Exceptional rebound and ping for premier league cricketers.', 
   38000, 45000, '-15%', 10, true),
  ('b0000000-0000-0000-0000-000000000006'::uuid, 'c4000000-0000-0000-0000-000000000001'::uuid, 
   'English Willow Grade 2 Bat', 'english-willow-grade-2-bat', 
   'Premium Grade 2 cleft with clean face, 6-7 grains, and pre-pressed face for rapid knocking-in.', 
   26000, NULL, 'Hot', 12, false),
  ('b0000000-0000-0000-0000-000000000007'::uuid, 'c4000000-0000-0000-0000-000000000001'::uuid, 
   'Players Edition Hardball Bat', 'players-edition-hardball-bat', 
   'Custom made to international match player specifications with duckbill toe and huge mid-blade profile.', 
   32000, 36000, '-11%', 8, false),

  -- Kashmir Willow (Collection c4000000-0000-0000-0000-000000000002)
  ('b0000000-0000-0000-0000-000000000008'::uuid, 'c4000000-0000-0000-0000-000000000002'::uuid, 
   'Kashmir Willow Hardball Bat', 'kashmir-willow-hardball-bat', 
   'Seasoned Kashmir timber with natural oil coating. High durability bat built for club practice and weekend warriors.', 
   9500, NULL, NULL, 22, false),

  -- Hard Ball (Collection c3000000-0000-0000-0000-000000000004)
  ('b0000000-0000-0000-0000-000000000009'::uuid, 'c3000000-0000-0000-0000-000000000004'::uuid, 
   'Red Leather Hardball', 'red-leather-hardball', 
   'Four-piece alum tanned Pakistani leather with prominent hand-stitched seam for genuine swing and seam movement.', 
   2200, NULL, 'Hot', 50, true),
  ('b0000000-0000-0000-0000-000000000010'::uuid, 'c3000000-0000-0000-0000-000000000004'::uuid, 
   'Match Hardball (Pack of 2)', 'match-hardball-pack-of-2', 
   'Box of 2 grade-A match balls treated for shape retention through 50+ overs.', 
   4000, 4600, '-13%', 35, false),

  -- Complete Kits (Collection c3000000-0000-0000-0000-000000000007)
  ('b0000000-0000-0000-0000-000000000011'::uuid, 'c3000000-0000-0000-0000-000000000007'::uuid, 
   'Complete Hardball Kit (Adult)', 'complete-hardball-kit-adult', 
   'Everything you need: Helmet, Batting Pads, Gloves, Thigh Guard, Abdo Guard, Arm Guard and Wheelie Bag.', 
   28000, 33000, '-15%', 15, true),

  -- Batting Gloves (Collection c3000000-0000-0000-0000-000000000009)
  ('b0000000-0000-0000-0000-000000000012'::uuid, 'c3000000-0000-0000-0000-000000000009'::uuid, 
   'Batting Gloves Pair', 'batting-gloves-pair', 
   'High-density split-finger rolls with calf leather palm for soft grip and sweat management.', 
   3500, NULL, 'New', 40, false),

  -- Cricket Shoes (Collection c3000000-0000-0000-0000-000000000014)
  ('b0000000-0000-0000-0000-000000000013'::uuid, 'c3000000-0000-0000-0000-000000000014'::uuid, 
   'Cricket Spikes Shoes', 'cricket-spikes-shoes', 
   'Steel spikes with cushioned phylon midsole and ankle lockdown system for fast bowlers and turf tracks.', 
   9800, NULL, 'Hot', 20, true),

  -- Running Shoes (Collection c3000000-0000-0000-0000-000000000013)
  ('b0000000-0000-0000-0000-000000000014'::uuid, 'c3000000-0000-0000-0000-000000000013'::uuid, 
   'Red Running Shoes', 'red-running-shoes', 
   'Breathable mesh training sneakers with shock-absorbing honeycomb outsole for stamina training.', 
   11900, 14900, '-20%', 18, false)
ON CONFLICT (id) DO NOTHING;


-- 8.5 Product Images Seed
INSERT INTO public.product_images (product_id, url, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000001'::uuid, '1758791184255-411236a49346', 1),
  ('b0000000-0000-0000-0000-000000000001'::uuid, '1630851278830-c0c9b12933ee', 2),
  ('b0000000-0000-0000-0000-000000000002'::uuid, '1593766788306-28561086694e', 1),
  ('b0000000-0000-0000-0000-000000000005'::uuid, '1630851278830-c0c9b12933ee', 1),
  ('b0000000-0000-0000-0000-000000000005'::uuid, '1758791184255-411236a49346', 2),
  ('b0000000-0000-0000-0000-000000000009'::uuid, '1743342873510-55d49972b746', 1),
  ('b0000000-0000-0000-0000-000000000011'::uuid, '1785906359975-3b9e7fd8d230', 1),
  ('b0000000-0000-0000-0000-000000000012'::uuid, '1785906359585-9c053458d551', 1),
  ('b0000000-0000-0000-0000-000000000013'::uuid, '1560769629-975ec94e6a86', 1),
  ('b0000000-0000-0000-0000-000000000014'::uuid, '1542291026-7eec264c27ff', 1)
ON CONFLICT (id) DO NOTHING;


-- 8.6 Product Variants Seed
INSERT INTO public.product_variants (product_id, label, value, price_override, stock)
VALUES
  -- Bat Weights for Power Hitter
  ('b0000000-0000-0000-0000-000000000001'::uuid, 'Weight', '800g (Light)', NULL, 8),
  ('b0000000-0000-0000-0000-000000000001'::uuid, 'Weight', '830g (Medium)', NULL, 12),
  ('b0000000-0000-0000-0000-000000000001'::uuid, 'Weight', '860g (Heavy)', 3700, 5),

  -- Bat Weights for English Willow Grade 1
  ('b0000000-0000-0000-0000-000000000005'::uuid, 'Weight', '1150g', NULL, 4),
  ('b0000000-0000-0000-0000-000000000005'::uuid, 'Weight', '1180g', NULL, 4),
  ('b0000000-0000-0000-0000-000000000005'::uuid, 'Weight', '1220g (Heavy)', 39500, 2),

  -- Sizes for Cricket Spikes Shoes
  ('b0000000-0000-0000-0000-000000000013'::uuid, 'Size', '8 UK', NULL, 6),
  ('b0000000-0000-0000-0000-000000000013'::uuid, 'Size', '9 UK', NULL, 8),
  ('b0000000-0000-0000-0000-000000000013'::uuid, 'Size', '10 UK', NULL, 6),

  -- Gloves Sizing
  ('b0000000-0000-0000-0000-000000000012'::uuid, 'Size', 'Youth', NULL, 15),
  ('b0000000-0000-0000-0000-000000000012'::uuid, 'Size', 'Standard Adult', NULL, 25)
ON CONFLICT (id) DO NOTHING;


-- 8.7 Blog Posts Seed
INSERT INTO public.blog_posts (slug, title, excerpt, cover_url, author, category, is_published, content)
VALUES
  (
    'how-to-choose-tape-ball-bat',
    'How To Choose The Right Tape Ball Bat For Your Game',
    'From blade thickness and scoop depth to handle flex and pickup balance, here is everything you need to hit longer sixes in tape ball cricket tournaments.',
    '1758791184255-411236a49346',
    'Coach Haider Ali',
    'Bat Care & Selection',
    true,
    '<p>Tape ball cricket across Pakistan—from the floodlit Ramadan night tournaments of Karachi to the gullies of Lahore and Rawalpindi—demands explosive bat speed, aerodynamic scoops, and supreme balance.</p><h2>1. Weight Matters: Light vs Heavy Blade</h2><p>The standard tape ball bat weighs between <strong>780 grams to 860 grams</strong>. If you play predominantly on tight street pitches where express pace bowlers bowl short-pitch bouncers, a lighter bat (under 800g) allows you to pull, hook, and slash with rapid wrists.</p>'
  ),
  (
    'english-willow-vs-kashmir-willow',
    'English Willow vs Kashmir Willow: Which Bat Is Better?',
    'Comparing grain structure, ping, rebound speed, durability, and cost between Grade 1 English Willow and Pakistani Kashmir Willow.',
    '1630851278830-c0c9b12933ee',
    'Rashy Master Craftsman',
    'Bat Care & Selection',
    true,
    '<p>Both types of willow have distinctive cellular structures, rebound characteristics, and price points. English Willow offers springiness and ping right out of the box, whereas seasoned Kashmir Willow offers extraordinary durability at half the price.</p>'
  ),
  (
    'complete-hardball-kit-guide-beginners',
    'Complete Hardball Kit Guide: Everything A Beginner Needs',
    'Stepping into club or academy cricket? Here is your essential checklist for helmet safety, pads, gloves, and protective gear.',
    '1785906359975-3b9e7fd8d230',
    'Captain Salman',
    'Match Gear',
    true,
    '<p>Facing a 5.5-ounce leather ball hurtling toward you at 120 km/h requires certified protective equipment to keep you safe and confident at the crease.</p><h2>The Essential 7-Piece Safety Checklist</h2><p>Never compromise on your batting helmet, multi-split finger gloves, and pre-curved knee roll leg guards.</p>'
  )
ON CONFLICT (slug) DO NOTHING;


-- 8.8 Home Content Seed
INSERT INTO public.home_content (section, data, sort_order, is_active)
VALUES
  (
    'hero',
    '{
      "title": "Unleash Pure Power On The Pitch",
      "subtitle": "Pakistan Premier Cricket Gear",
      "ctaText": "Explore All Gear",
      "ctaUrl": "shop.html",
      "badge": "100% Sialkot Craftsmanship"
    }'::jsonb,
    1,
    true
  ),
  (
    'offer',
    '{
      "title": "Season Flash Sale - Up to 25% Off",
      "description": "Premium Grade 1 English Willow and match balls with nationwide Cash on Delivery.",
      "coupon": "WELCOME10"
    }'::jsonb,
    2,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- END OF SCHEMA DEFINITION
-- ============================================================================
