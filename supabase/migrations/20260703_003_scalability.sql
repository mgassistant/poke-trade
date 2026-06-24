-- Phase 12: Scalability — Performance indexes

CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trade_offers(status);
CREATE INDEX IF NOT EXISTS idx_trades_users ON trade_offers(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_collections_user ON collection_items(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_profiles_trust ON profiles(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_verification ON profiles(verification_level);
CREATE INDEX IF NOT EXISTS idx_profiles_connect ON profiles(stripe_connect_id) WHERE stripe_connect_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
