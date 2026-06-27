-- Restock Monitor & Drop Alerts System
-- Run against Supabase SQL editor

-- Products tracked across retailers
CREATE TABLE IF NOT EXISTS drop_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  retailer TEXT NOT NULL, -- pokemon_center, target, walmart, bestbuy, gamestop, tcgplayer
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  image_url TEXT,
  sku TEXT, -- retailer-specific SKU/TCIN/DPCI
  category TEXT DEFAULT 'sealed', -- sealed, singles, accessories
  product_type TEXT, -- booster_box, etb, collection, tin, blister
  msrp_price DECIMAL(10,2),
  current_price DECIMAL(10,2),
  in_stock BOOLEAN DEFAULT false,
  last_in_stock_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ,
  check_interval_seconds INTEGER DEFAULT 30,
  auto_buy_enabled BOOLEAN DEFAULT false,
  auto_buy_max_price DECIMAL(10,2),
  auto_buy_quantity INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
  metadata JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drop_products_retailer ON drop_products(retailer);
CREATE INDEX IF NOT EXISTS idx_drop_products_stock ON drop_products(in_stock);
CREATE INDEX IF NOT EXISTS idx_drop_products_active ON drop_products(active);

-- Stock check history (every check logged)
CREATE TABLE IF NOT EXISTS drop_stock_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES drop_products(id) ON DELETE CASCADE,
  in_stock BOOLEAN NOT NULL,
  price DECIMAL(10,2),
  stock_quantity INTEGER, -- if available from API
  response_ms INTEGER, -- API response time
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_checks_product ON drop_stock_checks(product_id, created_at DESC);

-- Alerts fired when stock changes
CREATE TABLE IF NOT EXISTS drop_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES drop_products(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- restock, price_drop, price_increase, back_oos
  previous_state JSONB, -- {in_stock: false, price: 289.99}
  new_state JSONB, -- {in_stock: true, price: 259.99}
  notified BOOLEAN DEFAULT false,
  notification_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drop_alerts_product ON drop_alerts(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_drop_alerts_type ON drop_alerts(alert_type);

-- User watchlist (which products to get alerts for)
CREATE TABLE IF NOT EXISTS drop_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID REFERENCES drop_products(id) ON DELETE CASCADE,
  notify_restock BOOLEAN DEFAULT true,
  notify_price_drop BOOLEAN DEFAULT true,
  target_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_drop_watchlist_user ON drop_watchlist(user_id);

-- Auto-purchase attempts
CREATE TABLE IF NOT EXISTS drop_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES drop_products(id) ON DELETE CASCADE,
  retailer TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, cart_added, checkout_started, purchased, failed, cancelled
  purchase_price DECIMAL(10,2),
  quantity INTEGER DEFAULT 1,
  order_number TEXT,
  confirmation_url TEXT,
  error_log TEXT,
  attempt_started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drop_purchases_status ON drop_purchases(status);

-- Seed some high-value products to monitor
INSERT INTO drop_products (retailer, product_name, product_url, sku, category, product_type, msrp_price, auto_buy_enabled, auto_buy_max_price, auto_buy_quantity, priority) VALUES
  ('pokemon_center', 'Prismatic Evolutions Booster Box', 'https://www.pokemoncenter.com/product/290-86943/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-booster-box', 'PKM-SV08-BB', 'sealed', 'booster_box', 143.64, true, 155.00, 3, 1),
  ('pokemon_center', 'Prismatic Evolutions Elite Trainer Box', 'https://www.pokemoncenter.com/product/290-86950/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-elite-trainer-box', 'PKM-SV08-ETB', 'sealed', 'etb', 49.99, true, 55.00, 5, 1),
  ('pokemon_center', 'Prismatic Evolutions Super Premium Collection', 'https://www.pokemoncenter.com/product/290-86955/pokemon-tcg-scarlet-and-violet-prismatic-evolutions-super-premium-collection', 'PKM-SV08-SPC', 'sealed', 'collection', 89.99, true, 95.00, 2, 1),
  ('target', 'Prismatic Evolutions Booster Box', 'https://www.target.com/p/-/A-91234567', 'A-91234567', 'sealed', 'booster_box', 143.64, true, 150.00, 2, 2),
  ('target', 'Prismatic Evolutions ETB', 'https://www.target.com/p/-/A-91234568', 'A-91234568', 'sealed', 'etb', 49.99, true, 52.00, 3, 2),
  ('walmart', 'Prismatic Evolutions Booster Box', 'https://www.walmart.com/ip/Pokemon-TCG-Prismatic-Evolutions-BB/123456789', '123456789', 'sealed', 'booster_box', 143.64, true, 150.00, 2, 3),
  ('bestbuy', 'Prismatic Evolutions ETB', 'https://www.bestbuy.com/site/pokemon-tcg-prismatic-evolutions-etb/6598765.p', '6598765', 'sealed', 'etb', 49.99, true, 52.00, 3, 3),
  ('gamestop', 'Prismatic Evolutions Booster Box', 'https://www.gamestop.com/toys-games/trading-cards/products/pokemon-tcg-sv-prismatic-evolutions-bb/400001', '400001', 'sealed', 'booster_box', 143.64, true, 150.00, 2, 4),
  ('pokemon_center', 'Surging Sparks Booster Box', 'https://www.pokemoncenter.com/product/290-86800/pokemon-tcg-scarlet-and-violet-surging-sparks-booster-box', 'PKM-SV07-BB', 'sealed', 'booster_box', 143.64, true, 148.00, 2, 5),
  ('pokemon_center', 'Surging Sparks ETB', 'https://www.pokemoncenter.com/product/290-86805/pokemon-tcg-scarlet-and-violet-surging-sparks-elite-trainer-box', 'PKM-SV07-ETB', 'sealed', 'etb', 49.99, true, 52.00, 3, 5)
ON CONFLICT DO NOTHING;
