-- ============================================================
-- POKE-TRADE: Functions, Triggers & RLS Policies
-- Run in Supabase SQL Editor (supabase.com/dashboard → SQL Editor)
-- Tables already exist — this adds the missing backend logic
-- ============================================================

-- 1) Utility function: auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Admin check function
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = check_user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Auto-create profile on signup
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

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4) updated_at triggers on all tables
DO $$ BEGIN
  DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
  CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS cards_updated_at ON cards;
  CREATE TRIGGER cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS collections_updated_at ON collections;
  CREATE TRIGGER collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS collection_items_updated_at ON collection_items;
  CREATE TRIGGER collection_items_updated_at BEFORE UPDATE ON collection_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS want_lists_updated_at ON want_lists;
  CREATE TRIGGER want_lists_updated_at BEFORE UPDATE ON want_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS trade_offers_updated_at ON trade_offers;
  CREATE TRIGGER trade_offers_updated_at BEFORE UPDATE ON trade_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS listings_updated_at ON listings;
  CREATE TRIGGER listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS orders_updated_at ON orders;
  CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS offers_updated_at ON offers;
  CREATE TRIGGER offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS reports_updated_at ON reports;
  CREATE TRIGGER reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS disputes_updated_at ON disputes;
  CREATE TRIGGER disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  DROP TRIGGER IF EXISTS subscriptions_updated_at ON subscriptions;
  CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
END $$;

-- ============================================================
-- 5) ROW LEVEL SECURITY
-- ============================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_read" ON profiles;
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Card sets
ALTER TABLE card_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "card_sets_read" ON card_sets;
CREATE POLICY "card_sets_read" ON card_sets FOR SELECT USING (true);
DROP POLICY IF EXISTS "card_sets_admin_insert" ON card_sets;
CREATE POLICY "card_sets_admin_insert" ON card_sets FOR INSERT WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "card_sets_admin_update" ON card_sets;
CREATE POLICY "card_sets_admin_update" ON card_sets FOR UPDATE USING (is_admin(auth.uid()));

-- Cards
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cards_read" ON cards;
CREATE POLICY "cards_read" ON cards FOR SELECT USING (true);
DROP POLICY IF EXISTS "cards_admin_insert" ON cards;
CREATE POLICY "cards_admin_insert" ON cards FOR INSERT WITH CHECK (is_admin(auth.uid()));
DROP POLICY IF EXISTS "cards_admin_update" ON cards;
CREATE POLICY "cards_admin_update" ON cards FOR UPDATE USING (is_admin(auth.uid()));

-- Collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collections_read" ON collections;
CREATE POLICY "collections_read" ON collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
DROP POLICY IF EXISTS "collections_insert" ON collections;
CREATE POLICY "collections_insert" ON collections FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "collections_update" ON collections;
CREATE POLICY "collections_update" ON collections FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "collections_delete" ON collections;
CREATE POLICY "collections_delete" ON collections FOR DELETE USING (auth.uid() = user_id);

-- Collection items
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collection_items_read" ON collection_items;
CREATE POLICY "collection_items_read" ON collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_items.collection_id AND (c.is_public = true OR c.user_id = auth.uid()))
);
DROP POLICY IF EXISTS "collection_items_insert" ON collection_items;
CREATE POLICY "collection_items_insert" ON collection_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "collection_items_update" ON collection_items;
CREATE POLICY "collection_items_update" ON collection_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "collection_items_delete" ON collection_items;
CREATE POLICY "collection_items_delete" ON collection_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM collections c WHERE c.id = collection_items.collection_id AND c.user_id = auth.uid())
);

-- Want lists
ALTER TABLE want_lists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "want_lists_read" ON want_lists;
CREATE POLICY "want_lists_read" ON want_lists FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "want_lists_insert" ON want_lists;
CREATE POLICY "want_lists_insert" ON want_lists FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "want_lists_update" ON want_lists;
CREATE POLICY "want_lists_update" ON want_lists FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "want_lists_delete" ON want_lists;
CREATE POLICY "want_lists_delete" ON want_lists FOR DELETE USING (auth.uid() = user_id);

-- Want list items
ALTER TABLE want_list_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "want_list_items_read" ON want_list_items;
CREATE POLICY "want_list_items_read" ON want_list_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM want_lists w WHERE w.id = want_list_items.want_list_id AND w.user_id = auth.uid())
);
DROP POLICY IF EXISTS "want_list_items_insert" ON want_list_items;
CREATE POLICY "want_list_items_insert" ON want_list_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM want_lists w WHERE w.id = want_list_items.want_list_id AND w.user_id = auth.uid())
);
DROP POLICY IF EXISTS "want_list_items_update" ON want_list_items;
CREATE POLICY "want_list_items_update" ON want_list_items FOR UPDATE USING (
  EXISTS (SELECT 1 FROM want_lists w WHERE w.id = want_list_items.want_list_id AND w.user_id = auth.uid())
);
DROP POLICY IF EXISTS "want_list_items_delete" ON want_list_items;
CREATE POLICY "want_list_items_delete" ON want_list_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM want_lists w WHERE w.id = want_list_items.want_list_id AND w.user_id = auth.uid())
);

-- Trade offers
ALTER TABLE trade_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trade_offers_read" ON trade_offers;
CREATE POLICY "trade_offers_read" ON trade_offers FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
DROP POLICY IF EXISTS "trade_offers_insert" ON trade_offers;
CREATE POLICY "trade_offers_insert" ON trade_offers FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "trade_offers_update" ON trade_offers;
CREATE POLICY "trade_offers_update" ON trade_offers FOR UPDATE USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Trade items
ALTER TABLE trade_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trade_items_read" ON trade_items;
CREATE POLICY "trade_items_read" ON trade_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM trade_offers t WHERE t.id = trade_items.trade_offer_id AND (t.sender_id = auth.uid() OR t.receiver_id = auth.uid()))
);
DROP POLICY IF EXISTS "trade_items_insert" ON trade_items;
CREATE POLICY "trade_items_insert" ON trade_items FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listings_read" ON listings;
CREATE POLICY "listings_read" ON listings FOR SELECT USING (status = 'active' OR auth.uid() = user_id);
DROP POLICY IF EXISTS "listings_insert" ON listings;
CREATE POLICY "listings_insert" ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "listings_update" ON listings;
CREATE POLICY "listings_update" ON listings FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "listings_delete" ON listings;
CREATE POLICY "listings_delete" ON listings FOR DELETE USING (auth.uid() = user_id);

-- Orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_read" ON orders;
CREATE POLICY "orders_read" ON orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
DROP POLICY IF EXISTS "orders_insert" ON orders;
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "orders_update" ON orders;
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "offers_read" ON offers;
CREATE POLICY "offers_read" ON offers FOR SELECT USING (
  auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM listings l WHERE l.id = offers.listing_id AND l.user_id = auth.uid())
);
DROP POLICY IF EXISTS "offers_insert" ON offers;
CREATE POLICY "offers_insert" ON offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "offers_update" ON offers;
CREATE POLICY "offers_update" ON offers FOR UPDATE USING (
  auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM listings l WHERE l.id = offers.listing_id AND l.user_id = auth.uid())
);

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_read" ON reviews;
CREATE POLICY "reviews_read" ON reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "conversations_read" ON conversations;
CREATE POLICY "conversations_read" ON conversations FOR SELECT USING (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);
DROP POLICY IF EXISTS "conversations_insert" ON conversations;
CREATE POLICY "conversations_insert" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = participant_1 OR auth.uid() = participant_2
);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_read" ON messages;
CREATE POLICY "messages_read" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
DROP POLICY IF EXISTS "messages_update" ON messages;
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_read" ON follows;
CREATE POLICY "follows_read" ON follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "follows_insert" ON follows;
CREATE POLICY "follows_insert" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_delete" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Activity feed
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_feed_read" ON activity_feed;
CREATE POLICY "activity_feed_read" ON activity_feed FOR SELECT USING (true);
DROP POLICY IF EXISTS "activity_feed_insert" ON activity_feed;
CREATE POLICY "activity_feed_insert" ON activity_feed FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_read" ON notifications;
CREATE POLICY "notifications_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update" ON notifications;
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
DROP POLICY IF EXISTS "reports_read" ON reports;
CREATE POLICY "reports_read" ON reports FOR SELECT USING (
  auth.uid() = reporter_id OR is_admin(auth.uid())
);
DROP POLICY IF EXISTS "reports_admin_update" ON reports;
CREATE POLICY "reports_admin_update" ON reports FOR UPDATE USING (is_admin(auth.uid()));

-- Disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "disputes_read" ON disputes;
CREATE POLICY "disputes_read" ON disputes FOR SELECT USING (
  auth.uid() = initiator_id OR is_admin(auth.uid())
);
DROP POLICY IF EXISTS "disputes_insert" ON disputes;
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (auth.uid() = initiator_id);
DROP POLICY IF EXISTS "disputes_admin_update" ON disputes;
CREATE POLICY "disputes_admin_update" ON disputes FOR UPDATE USING (is_admin(auth.uid()));

-- Achievements
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "achievements_read" ON achievements;
CREATE POLICY "achievements_read" ON achievements FOR SELECT USING (true);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_read" ON subscriptions;
CREATE POLICY "subscriptions_read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions_read" ON transactions;
CREATE POLICY "transactions_read" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Admin actions
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_actions_read" ON admin_actions;
CREATE POLICY "admin_actions_read" ON admin_actions FOR SELECT USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "admin_actions_insert" ON admin_actions;
CREATE POLICY "admin_actions_insert" ON admin_actions FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- ============================================================
-- 6) Storage buckets & policies
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('card-images', 'card-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-images', 'listing-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-proof', 'trade-proof', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars_read" ON storage.objects;
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "avatars_insert" ON storage.objects;
CREATE POLICY "avatars_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars_update" ON storage.objects;
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "card_images_read" ON storage.objects;
CREATE POLICY "card_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'card-images');
DROP POLICY IF EXISTS "listing_images_read" ON storage.objects;
CREATE POLICY "listing_images_read" ON storage.objects FOR SELECT USING (bucket_id = 'listing-images');
DROP POLICY IF EXISTS "listing_images_insert" ON storage.objects;
CREATE POLICY "listing_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "listing_images_update" ON storage.objects;
CREATE POLICY "listing_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "trade_proof_read" ON storage.objects;
CREATE POLICY "trade_proof_read" ON storage.objects FOR SELECT USING (bucket_id = 'trade-proof' AND auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "trade_proof_insert" ON storage.objects;
CREATE POLICY "trade_proof_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trade-proof' AND auth.uid() IS NOT NULL);

-- ============================================================
-- DONE! All functions, triggers, RLS policies & storage active.
-- ============================================================
