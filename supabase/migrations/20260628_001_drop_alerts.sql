-- Products tracked for drops/restocks
CREATE TABLE drop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer text NOT NULL,
  product_name text NOT NULL,
  product_url text,
  image_url text,
  retail_price numeric(10,2),
  current_price numeric(10,2),
  in_stock boolean DEFAULT false,
  last_in_stock_at timestamptz,
  last_checked_at timestamptz DEFAULT now(),
  category text,
  set_name text,
  release_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_drop_products_retailer ON drop_products(retailer);
CREATE INDEX idx_drop_products_in_stock ON drop_products(in_stock);

-- User watchlist for specific products
CREATE TABLE drop_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES drop_products(id) ON DELETE CASCADE,
  notify_restock boolean DEFAULT true,
  notify_price_drop boolean DEFAULT true,
  target_price numeric(10,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Alert history
CREATE TABLE drop_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES drop_products(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  title text NOT NULL,
  message text,
  previous_price numeric(10,2),
  new_price numeric(10,2),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_drop_alerts_created ON drop_alerts(created_at DESC);

-- RLS
ALTER TABLE drop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drop_products_read" ON drop_products FOR SELECT USING (true);

ALTER TABLE drop_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist_own" ON drop_watchlist FOR ALL USING (auth.uid() = user_id);

ALTER TABLE drop_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alerts_read" ON drop_alerts FOR SELECT USING (true);
