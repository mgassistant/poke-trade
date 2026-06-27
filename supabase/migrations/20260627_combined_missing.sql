-- Shipping Workflow Enhancement
-- Adds shipping_method to trade_offers and shipping_details table

-- Add shipping columns to trade_offers
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS shipping_method text DEFAULT 'direct' CHECK (shipping_method IN ('direct', 'verified'));
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS verification_fee_paid boolean DEFAULT false;

-- Shipping details table for the full workflow
CREATE TABLE IF NOT EXISTS trade_shipping_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  -- Sender (person who initiated trade) shipping info
  sender_tracking text,
  sender_carrier text,
  sender_shipped_at timestamptz,
  sender_photos text[] DEFAULT '{}',
  sender_received_at timestamptz,
  sender_confirmed boolean DEFAULT false,
  -- Receiver shipping info
  receiver_tracking text,
  receiver_carrier text,
  receiver_shipped_at timestamptz,
  receiver_photos text[] DEFAULT '{}',
  receiver_received_at timestamptz,
  receiver_confirmed boolean DEFAULT false,
  -- Auth center (for verified trades)
  auth_center_received_sender timestamptz,
  auth_center_received_receiver timestamptz,
  auth_center_verified boolean DEFAULT false,
  auth_center_notes text,
  auth_center_cross_ship_sender_tracking text,
  auth_center_cross_ship_receiver_tracking text,
  -- Inspection window
  inspection_deadline timestamptz,
  -- Dispute
  disputed boolean DEFAULT false,
  dispute_reason text,
  dispute_resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(trade_offer_id)
);

CREATE INDEX IF NOT EXISTS idx_shipping_details_trade ON trade_shipping_details(trade_offer_id);

-- RLS
ALTER TABLE trade_shipping_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shipping_read" ON trade_shipping_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM trade_offers WHERE id = trade_offer_id AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);

CREATE POLICY "shipping_insert" ON trade_shipping_details FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM trade_offers WHERE id = trade_offer_id AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);

CREATE POLICY "shipping_update" ON trade_shipping_details FOR UPDATE USING (
  EXISTS (SELECT 1 FROM trade_offers WHERE id = trade_offer_id AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);
-- Card Show Features: showcase tables, online status, reports
-- Add last_active_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Showcase posts
CREATE TABLE IF NOT EXISTS showcase_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  card_ids text[] NOT NULL DEFAULT '{}',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_showcase_posts_user ON showcase_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_created ON showcase_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_likes ON showcase_posts(likes_count DESC);

-- Showcase likes
CREATE TABLE IF NOT EXISTS showcase_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Showcase comments
CREATE TABLE IF NOT EXISTS showcase_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_showcase_comments_post ON showcase_comments(post_id, created_at);

-- Shared binders
CREATE TABLE IF NOT EXISTS shared_binders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reports table (for price gouging etc)
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'price_gouging',
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_featured ON profiles(is_featured) WHERE is_featured = true;
-- Phase 4: Immutable Trade Documentation
CREATE TABLE IF NOT EXISTS trade_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id uuid NOT NULL,
  event_type text NOT NULL, -- 'created','countered','accepted','rejected','cancelled','shipped','delivered','reviewed','disputed','resolved'
  actor_id uuid NOT NULL,
  details jsonb DEFAULT '{}',
  photos text[] DEFAULT '{}',
  integrity_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trade_events_trade ON trade_events(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_events_type ON trade_events(event_type);
CREATE INDEX IF NOT EXISTS idx_trade_events_created ON trade_events(created_at);
-- Phase 6: Enhanced Community Reputation System
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS communication_rating integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS accuracy_rating integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS shipping_rating integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS condition_rating integer;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_photos text[] DEFAULT '{}';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seller_response text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS seller_response_at timestamptz;

-- Phase 5: Fraud Prevention - flagged listings tracking
CREATE TABLE IF NOT EXISTS fraud_flags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid,
  trade_id uuid,
  user_id uuid NOT NULL,
  risk_score integer NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'low',
  flags text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending', -- 'pending','approved','suspended','banned'
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fraud_flags_user ON fraud_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_status ON fraud_flags(status);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_listing ON fraud_flags(listing_id);
-- Enhanced disputes table
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS reason_category text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_photos text[] DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_description text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_id uuid;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_response text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_evidence text[] DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_decision text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_reasoning text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_decided_by uuid;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS credit_amount numeric(10,2) DEFAULT 0;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS outcome text; -- 'no_action','warning','restriction','suspension','ban','credit','refund','other'

CREATE TABLE IF NOT EXISTS dispute_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachments text[] DEFAULT '{}',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE TABLE IF NOT EXISTS insurance_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  estimated_collection_value numeric(12,2),
  number_of_cards integer,
  has_graded_cards boolean DEFAULT false,
  storage_method text, -- 'home','safe','bank_vault','storage_unit','other'
  consent_to_contact boolean DEFAULT true,
  status text DEFAULT 'new', -- 'new','contacted','quoted','bound','lost'
  admin_notes text,
  referred_to text, -- agent/agency name
  quote_amount numeric(10,2),
  policy_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_status ON insurance_leads(status);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_user ON insurance_leads(user_id);
-- Phase 10: Stripe Connect marketplace model
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_connect_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connect_onboarded boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS connect_payouts_enabled boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS seller_payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL,
  stripe_payout_id text,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  status text DEFAULT 'pending',
  listing_id uuid,
  trade_id uuid,
  platform_fee numeric(10,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_status ON seller_payouts(status);
-- Phase 11: Enterprise security hardening

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

CREATE TABLE IF NOT EXISTS rate_limit_violations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address text NOT NULL,
  endpoint text,
  violation_count integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_ip ON rate_limit_violations(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_violations_created ON rate_limit_violations(created_at DESC);
