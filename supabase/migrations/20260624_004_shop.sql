-- Poke Trade Shop: Full e-commerce tables
-- Migration: 20260624_004_shop

-- ============================================================
-- shop_products — full product catalog
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('sealed','singles','graded','mystery','accessories','member_exclusive','personal_collection','supplies')),
  condition text,
  product_type text,
  source_type text CHECK (source_type IN ('personal_collection','distributor','member_trade_in','buylist','other')),

  -- Pricing tiers
  msrp_price numeric(10,2),
  market_price numeric(10,2),
  member_price numeric(10,2),
  premium_member_price numeric(10,2),
  public_price numeric(10,2),
  cost_basis numeric(10,2),

  -- Inventory
  inventory_count int NOT NULL DEFAULT 0,
  reserved_count int NOT NULL DEFAULT 0,
  sold_count int NOT NULL DEFAULT 0,

  -- Purchase limits
  max_qty_per_member int DEFAULT 1,
  max_qty_per_household int DEFAULT 2,

  -- Access controls
  requires_membership boolean DEFAULT false,
  premium_only boolean DEFAULT false,
  early_access_enabled boolean DEFAULT false,
  early_access_minutes int DEFAULT 30,

  -- Scheduling
  drop_start_at timestamptz,
  public_start_at timestamptz,

  -- Status
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','active','sold_out','archived')),
  verification_status text DEFAULT 'verified',
  images jsonb DEFAULT '[]'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shop_products_status ON shop_products(status);
CREATE INDEX idx_shop_products_category ON shop_products(category);
CREATE INDEX idx_shop_products_slug ON shop_products(slug);

-- ============================================================
-- shop_orders — order tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_session_id text,
  stripe_payment_intent_id text,

  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  tax numeric(10,2) NOT NULL DEFAULT 0,
  shipping numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','canceled','refunded','manual_review')),
  fraud_status text,
  manual_review_reason text,

  shipping_name text,
  shipping_address jsonb,
  billing_address jsonb,
  tracking_number text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shop_orders_user ON shop_orders(user_id);
CREATE INDEX idx_shop_orders_status ON shop_orders(status);
CREATE INDEX idx_shop_orders_stripe ON shop_orders(stripe_session_id);

-- ============================================================
-- shop_order_items — line items
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES shop_products(id) ON DELETE SET NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL,
  price_type text,
  product_snapshot jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shop_order_items_order ON shop_order_items(order_id);

-- ============================================================
-- shop_inventory_events — audit trail
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_inventory_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('created','restocked','reserved','reservation_released','sold','refunded','adjusted')),
  quantity int NOT NULL,
  previous_inventory int NOT NULL,
  new_inventory int NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shop_inventory_events_product ON shop_inventory_events(product_id);

-- ============================================================
-- shop_drop_events — scheduled drops
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_drop_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  premium_access_starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming','live','ended')),
  banner_image text,
  product_ids uuid[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_shop_drop_events_status ON shop_drop_events(status);

-- ============================================================
-- shop_waitlists — sold out notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_waitlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  email text,
  notified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_shop_waitlists_product ON shop_waitlists(product_id);

-- ============================================================
-- shop_cart_items — user carts
-- ============================================================
CREATE TABLE IF NOT EXISTS shop_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  reserved_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_shop_cart_items_user ON shop_cart_items(user_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_inventory_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_drop_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_cart_items ENABLE ROW LEVEL SECURITY;

-- Products: public read for active, admin write
CREATE POLICY "shop_products_public_read" ON shop_products
  FOR SELECT USING (status IN ('active','sold_out','scheduled'));

CREATE POLICY "shop_products_admin_all" ON shop_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Orders: users see own, admin sees all
CREATE POLICY "shop_orders_own_read" ON shop_orders
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "shop_orders_own_insert" ON shop_orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "shop_orders_admin_all" ON shop_orders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Order items: users see own via order
CREATE POLICY "shop_order_items_own_read" ON shop_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM shop_orders WHERE id = order_id AND user_id = auth.uid())
  );

CREATE POLICY "shop_order_items_admin_all" ON shop_order_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Inventory events: admin only
CREATE POLICY "shop_inventory_events_admin_all" ON shop_inventory_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Drop events: public read
CREATE POLICY "shop_drop_events_public_read" ON shop_drop_events
  FOR SELECT USING (true);

CREATE POLICY "shop_drop_events_admin_all" ON shop_drop_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Waitlists: authenticated users
CREATE POLICY "shop_waitlists_own" ON shop_waitlists
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "shop_waitlists_admin_read" ON shop_waitlists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Cart: own items only
CREATE POLICY "shop_cart_items_own" ON shop_cart_items
  FOR ALL USING (user_id = auth.uid());

-- Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_shop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shop_products_updated_at
  BEFORE UPDATE ON shop_products
  FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();

CREATE TRIGGER shop_orders_updated_at
  BEFORE UPDATE ON shop_orders
  FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();

CREATE TRIGGER shop_cart_items_updated_at
  BEFORE UPDATE ON shop_cart_items
  FOR EACH ROW EXECUTE FUNCTION update_shop_updated_at();
