-- Poke-Trade Shop Launch Migrations
-- Run in Supabase SQL Editor — June 29, 2026

-- 1. Add drop scheduling columns to shop_products
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS elite_early_access_at TIMESTAMPTZ;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS pro_early_access_at TIMESTAMPTZ;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS release_notes TEXT;

-- 2. Add refund tracking to shop_orders
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shop_products_status ON shop_products(status);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user ON shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_cart_user ON shop_cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_cart_reserved ON shop_cart_items(reserved_until);
CREATE INDEX IF NOT EXISTS idx_shop_inventory_product ON shop_inventory_events(product_id);

-- 4. RLS Policies
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON shop_products FOR SELECT USING (status IN ('active', 'scheduled', 'sold_out'));
CREATE POLICY "Admins can manage products" ON shop_products FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own orders" ON shop_orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage orders" ON shop_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE shop_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own cart" ON shop_cart_items FOR ALL USING (user_id = auth.uid());

ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own order items" ON shop_order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM shop_orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins manage order items" ON shop_order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE shop_inventory_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inventory events" ON shop_inventory_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Users view inventory events" ON shop_inventory_events FOR SELECT USING (true);
