-- Poke-Trade Multi-Channel Marketplace Migration
-- Run in Supabase SQL Editor
-- Created: June 29, 2026

-- ═══ PHASE 1: Extend shop_products with marketplace-ready fields ═══
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS upc TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS set_name TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS card_name TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS card_number TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS rarity TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS grade TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS grading_company TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'Pokémon';
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS shipping_weight_oz NUMERIC(6,2);
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS shipping_length_in NUMERIC(5,2);
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS shipping_width_in NUMERIC(5,2);
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS shipping_height_in NUMERIC(5,2);
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS handling_days INTEGER DEFAULT 3;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS return_policy TEXT DEFAULT '30-day returns';
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS marketplace_ready BOOLEAN DEFAULT false;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS listing_template TEXT;
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS ebay_price NUMERIC(10,2);
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS tcgplayer_price NUMERIC(10,2);
ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS amazon_price NUMERIC(10,2);

-- SKU index
CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_products_sku ON shop_products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shop_products_upc ON shop_products(upc) WHERE upc IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shop_products_marketplace_ready ON shop_products(marketplace_ready) WHERE marketplace_ready = true;

-- ═══ PHASE 2: Marketplace channel tables ═══
CREATE TABLE IF NOT EXISTS marketplace_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  api_type TEXT,
  auth_type TEXT,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO marketplace_channels (name, slug, api_type, auth_type) VALUES
  ('eBay', 'ebay', 'rest', 'oauth2'),
  ('TCGPlayer', 'tcgplayer', 'rest', 'api_key'),
  ('Amazon', 'amazon', 'rest', 'oauth2'),
  ('Walmart Marketplace', 'walmart', 'rest', 'oauth2'),
  ('Shopify', 'shopify', 'rest', 'oauth2'),
  ('TikTok Shop', 'tiktok', 'rest', 'oauth2'),
  ('Whatnot', 'whatnot', 'rest', 'oauth2'),
  ('CardTrader', 'cardtrader', 'rest', 'api_key'),
  ('Cardmarket', 'cardmarket', 'rest', 'oauth2'),
  ('CSV Export', 'csv', 'csv', 'manual')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES marketplace_channels(id),
  account_name TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  seller_id TEXT,
  status TEXT DEFAULT 'active',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES shop_products(id),
  channel_id UUID REFERENCES marketplace_channels(id),
  marketplace_account_id UUID REFERENCES marketplace_accounts(id),
  external_listing_id TEXT,
  external_sku TEXT,
  title TEXT,
  description TEXT,
  price NUMERIC(10,2),
  quantity INTEGER DEFAULT 0,
  listing_status TEXT DEFAULT 'draft',
  sync_status TEXT DEFAULT 'pending',
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  channel_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, channel_id, marketplace_account_id)
);

CREATE TABLE IF NOT EXISTS marketplace_listing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_listing_id UUID REFERENCES marketplace_listings(id),
  event_type TEXT NOT NULL,
  message TEXT,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES marketplace_channels(id),
  marketplace_account_id UUID REFERENCES marketplace_accounts(id),
  external_order_id TEXT NOT NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  order_status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  fulfillment_status TEXT DEFAULT 'unfulfilled',
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping NUMERIC(10,2) DEFAULT 0,
  tax NUMERIC(10,2) DEFAULT 0,
  marketplace_fees NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  shipping_address JSONB,
  tracking_number TEXT,
  shipping_carrier TEXT,
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, external_order_id)
);

CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace_order_id UUID REFERENCES marketplace_orders(id),
  product_id UUID REFERENCES shop_products(id),
  marketplace_listing_id UUID REFERENCES marketplace_listings(id),
  external_sku TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC(10,2),
  raw_payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_sync_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES marketplace_channels(id),
  job_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES marketplace_channels(id),
  rule_type TEXT NOT NULL,
  value NUMERIC(10,2),
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  apply_to_category TEXT,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mkt_listings_product ON marketplace_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_channel ON marketplace_listings(channel_id);
CREATE INDEX IF NOT EXISTS idx_mkt_listings_status ON marketplace_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_channel ON marketplace_orders(channel_id);
CREATE INDEX IF NOT EXISTS idx_mkt_orders_status ON marketplace_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_mkt_events_listing ON marketplace_listing_events(marketplace_listing_id);
CREATE INDEX IF NOT EXISTS idx_mkt_sync_channel ON marketplace_sync_jobs(channel_id);

-- RLS
ALTER TABLE marketplace_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read channels" ON marketplace_channels FOR SELECT USING (true);
CREATE POLICY "Admin manage channels" ON marketplace_channels FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin only accounts" ON marketplace_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage listings" ON marketplace_listings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage mkt orders" ON marketplace_orders FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage mkt order items" ON marketplace_order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage sync jobs" ON marketplace_sync_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin manage pricing rules" ON marketplace_pricing_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

ALTER TABLE marketplace_listing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin view listing events" ON marketplace_listing_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
