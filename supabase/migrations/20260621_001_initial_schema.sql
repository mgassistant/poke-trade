-- Poke-Trade Initial Schema
-- Full production database with RLS

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'elite');
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'declined', 'countered', 'completed', 'cancelled');
CREATE TYPE listing_status AS ENUM ('active', 'sold', 'cancelled', 'expired');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'completed', 'refunded', 'disputed');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'declined', 'countered', 'expired');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
CREATE TYPE review_type AS ENUM ('trade', 'sale');

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = check_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  bio text,
  location text,
  trade_score numeric(4,2) DEFAULT 0,
  trader_level int DEFAULT 1 CHECK (trader_level BETWEEN 1 AND 6),
  total_trades int DEFAULT 0,
  total_sales int DEFAULT 0,
  is_verified boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  is_admin boolean DEFAULT false,
  subscription_tier subscription_tier DEFAULT 'free',
  stripe_customer_id text,
  stripe_connect_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_trade_score ON profiles(trade_score DESC);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- CARD SETS
-- ============================================================
CREATE TABLE card_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  series text NOT NULL,
  release_date date,
  total_cards int DEFAULT 0,
  symbol_url text,
  logo_url text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_card_sets_name ON card_sets(name);
CREATE INDEX idx_card_sets_series ON card_sets(series);

-- ============================================================
-- CARDS
-- ============================================================
CREATE TABLE cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES card_sets(id) ON DELETE CASCADE,
  name text NOT NULL,
  number text NOT NULL,
  rarity text,
  card_type text,
  hp int,
  illustrator text,
  image_url text,
  market_value numeric(10,2),
  reverse_holo boolean DEFAULT false,
  first_edition boolean DEFAULT false,
  supertype text,
  subtypes text[],
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(set_id, number)
);
CREATE INDEX idx_cards_name ON cards(name);
CREATE INDEX idx_cards_set_id ON cards(set_id);
CREATE INDEX idx_cards_rarity ON cards(rarity);
CREATE INDEX idx_cards_market_value ON cards(market_value DESC NULLS LAST);
CREATE TRIGGER cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- COLLECTIONS
-- ============================================================
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE TRIGGER collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- COLLECTION ITEMS
-- ============================================================
CREATE TABLE collection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  quantity int DEFAULT 1 CHECK (quantity > 0),
  condition text DEFAULT 'near_mint',
  purchase_price numeric(10,2),
  purchase_date date,
  current_value numeric(10,2),
  is_graded boolean DEFAULT false,
  grading_company text,
  grade text,
  notes text,
  photos text[],
  for_trade boolean DEFAULT false,
  for_sale boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_card_id ON collection_items(card_id);
CREATE INDEX idx_collection_items_for_trade ON collection_items(for_trade) WHERE for_trade = true;
CREATE INDEX idx_collection_items_for_sale ON collection_items(for_sale) WHERE for_sale = true;
CREATE TRIGGER collection_items_updated_at BEFORE UPDATE ON collection_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- WANT LISTS
-- ============================================================
CREATE TABLE want_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Want List',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_want_lists_user_id ON want_lists(user_id);
CREATE TRIGGER want_lists_updated_at BEFORE UPDATE ON want_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE want_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  want_list_id uuid NOT NULL REFERENCES want_lists(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  desired_condition text,
  desired_grade text,
  max_budget numeric(10,2),
  trade_preferred boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(want_list_id, card_id)
);
CREATE INDEX idx_want_list_items_want_list_id ON want_list_items(want_list_id);
CREATE INDEX idx_want_list_items_card_id ON want_list_items(card_id);

-- ============================================================
-- TRADE OFFERS
-- ============================================================
CREATE TABLE trade_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status trade_status DEFAULT 'pending',
  cash_amount numeric(10,2),
  notes text,
  shipping_tracking_sender text,
  shipping_tracking_receiver text,
  shipped_at_sender timestamptz,
  shipped_at_receiver timestamptz,
  received_at_sender timestamptz,
  received_at_receiver timestamptz,
  completed_at timestamptz,
  parent_trade_id uuid REFERENCES trade_offers(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (sender_id != receiver_id)
);
CREATE INDEX idx_trade_offers_sender ON trade_offers(sender_id);
CREATE INDEX idx_trade_offers_receiver ON trade_offers(receiver_id);
CREATE INDEX idx_trade_offers_status ON trade_offers(status);
CREATE TRIGGER trade_offers_updated_at BEFORE UPDATE ON trade_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE trade_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_item_id uuid REFERENCES collection_items(id),
  card_id uuid NOT NULL REFERENCES cards(id),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_trade_items_trade_offer ON trade_items(trade_offer_id);
CREATE INDEX idx_trade_items_user ON trade_items(user_id);

-- ============================================================
-- LISTINGS (MARKETPLACE)
-- ============================================================
CREATE TABLE listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  condition text DEFAULT 'near_mint',
  is_graded boolean DEFAULT false,
  grading_company text,
  grade text,
  price numeric(10,2) NOT NULL CHECK (price > 0),
  shipping_cost numeric(10,2) DEFAULT 0,
  accepts_offers boolean DEFAULT true,
  open_to_trades boolean DEFAULT false,
  photos text[] DEFAULT '{}',
  status listing_status DEFAULT 'active',
  featured_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listings_card_id ON listings(card_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_price ON listings(price) WHERE status = 'active';
CREATE INDEX idx_listings_created ON listings(created_at DESC) WHERE status = 'active';
CREATE INDEX idx_listings_featured ON listings(featured_at DESC NULLS LAST) WHERE status = 'active';
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  seller_id uuid NOT NULL REFERENCES profiles(id),
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  seller_payout numeric(10,2) NOT NULL,
  stripe_payment_intent_id text,
  status order_status DEFAULT 'pending',
  shipping_tracking text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (buyer_id != seller_id)
);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_listing ON orders(listing_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- OFFERS (on marketplace listings)
-- ============================================================
CREATE TABLE offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  status offer_status DEFAULT 'pending',
  counter_amount numeric(10,2),
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_offers_listing ON offers(listing_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_offers_status ON offers(status);
CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trade_offer_id uuid REFERENCES trade_offers(id),
  order_id uuid REFERENCES orders(id),
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  review_type review_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  CHECK (reviewer_id != reviewee_id),
  CHECK (trade_offer_id IS NOT NULL OR order_id IS NOT NULL)
);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- ============================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CHECK (participant_1 != participant_2),
  UNIQUE(participant_1, participant_2)
);
CREATE INDEX idx_conversations_p1 ON conversations(participant_1);
CREATE INDEX idx_conversations_p2 ON conversations(participant_2);

CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ============================================================
-- ACTIVITY FEED
-- ============================================================
CREATE TABLE activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  data jsonb,
  related_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activity_feed_user ON activity_feed(user_id, created_at DESC);
CREATE INDEX idx_activity_feed_type ON activity_feed(activity_type);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id),
  reported_listing_id uuid REFERENCES listings(id),
  report_type text NOT NULL,
  reason text NOT NULL,
  details text,
  status report_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_reports_status ON reports(status);
CREATE TRIGGER reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DISPUTES
-- ============================================================
CREATE TABLE disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id),
  trade_offer_id uuid REFERENCES trade_offers(id),
  initiator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  details text,
  status dispute_status DEFAULT 'open',
  resolution text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (order_id IS NOT NULL OR trade_offer_id IS NOT NULL)
);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_type text NOT NULL,
  achieved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);
CREATE INDEX idx_achievements_user ON achievements(user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id text,
  tier subscription_tier DEFAULT 'free',
  status text DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  stripe_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_transactions_stripe ON transactions(stripe_id);

-- ============================================================
-- ADMIN ACTIONS
-- ============================================================
CREATE TABLE admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  target_user_id uuid REFERENCES profiles(id),
  target_listing_id uuid REFERENCES listings(id),
  details text,
  performed_at timestamptz DEFAULT now()
);
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_performed ON admin_actions(performed_at DESC);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: public read, own write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Card sets/cards: public read
ALTER TABLE card_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "card_sets_read" ON card_sets FOR SELECT USING (true);
CREATE POLICY "card_sets_admin_insert" ON card_sets FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "card_sets_admin_update" ON card_sets FOR UPDATE USING (is_admin(auth.uid()));

ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cards_read" ON cards FOR SELECT USING (true);
CREATE POLICY "cards_admin_insert" ON cards FOR INSERT WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "cards_admin_update" ON cards FOR UPDATE USING (is_admin(auth.uid()));

-- Collections: public read if is_public, own CRUD
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_read" ON collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "collections_insert" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "collections_update" ON collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "collections_delete" ON collections FOR DELETE USING (auth.uid() = user_id);

-- Collection items: read if collection visible, own CRUD
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_items_read" ON collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND (is_public = true OR user_id = auth.uid()))
);
CREATE POLICY "collection_items_insert" ON collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND user_id = auth.uid())
);
CREATE POLICY "collection_items_update" ON collection_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND user_id = auth.uid())
);
CREATE POLICY "collection_items_delete" ON collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM collections WHERE id = collection_id AND user_id = auth.uid())
);

-- Want lists: own CRUD
ALTER TABLE want_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "want_lists_read" ON want_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "want_lists_insert" ON want_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "want_lists_update" ON want_lists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "want_lists_delete" ON want_lists FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE want_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "want_list_items_read" ON want_list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM want_lists WHERE id = want_list_id AND user_id = auth.uid())
);
CREATE POLICY "want_list_items_insert" ON want_list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM want_lists WHERE id = want_list_id AND user_id = auth.uid())
);
CREATE POLICY "want_list_items_update" ON want_list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM want_lists WHERE id = want_list_id AND user_id = auth.uid())
);
CREATE POLICY "want_list_items_delete" ON want_list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM want_lists WHERE id = want_list_id AND user_id = auth.uid())
);

-- Trade offers: participants can read, sender can insert
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_offers_read" ON trade_offers FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "trade_offers_insert" ON trade_offers FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "trade_offers_update" ON trade_offers FOR UPDATE USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

ALTER TABLE trade_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_items_read" ON trade_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM trade_offers WHERE id = trade_offer_id AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);
CREATE POLICY "trade_items_insert" ON trade_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listings: active are public, own CRUD
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "listings_read" ON listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
CREATE POLICY "listings_insert" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "listings_update" ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "listings_delete" ON listings FOR DELETE USING (auth.uid() = user_id);

-- Orders: buyer or seller
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_read" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Offers: buyer can CRUD, listing owner can read/update
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers_read" ON offers FOR SELECT USING (
  auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);
CREATE POLICY "offers_insert" ON offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "offers_update" ON offers FOR UPDATE USING (
  auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);

-- Reviews: public read, own insert
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Conversations/messages: participants only
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_read" ON conversations FOR SELECT USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id AND (participant_1 = auth.uid() OR participant_2 = auth.uid()))
);

-- Follows: public read, own CRUD
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_read" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Activity feed: public read, own insert
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_feed_read" ON activity_feed FOR SELECT USING (true);
CREATE POLICY "activity_feed_insert" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: own only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reports: own insert, admin read
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_read" ON reports FOR SELECT USING (
  auth.uid() = reporter_id OR is_admin(auth.uid())
);
CREATE POLICY "reports_admin_update" ON reports FOR UPDATE USING (is_admin(auth.uid()));

-- Disputes: participants + admin
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_read" ON disputes FOR SELECT USING (
  auth.uid() = initiator_id OR is_admin(auth.uid())
);
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (auth.uid() = initiator_id);
CREATE POLICY "disputes_admin_update" ON disputes FOR UPDATE USING (is_admin(auth.uid()));

-- Achievements: public read
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_read" ON achievements FOR SELECT USING (true);

-- Subscriptions: own only
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Transactions: own only
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transactions_read" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Admin actions: admin only
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_actions_read" ON admin_actions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "admin_actions_insert" ON admin_actions FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-proof', 'trade-proof', false);

-- Storage policies
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "card_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'card-images');
CREATE POLICY "listing_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "listing_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "listing_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "trade_proof_read" ON storage.objects FOR SELECT USING (bucket_id = 'trade-proof' AND auth.uid() IS NOT NULL);
CREATE POLICY "trade_proof_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trade-proof' AND auth.uid() IS NOT NULL);
