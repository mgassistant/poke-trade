-- Trust & Safety System
-- Identity verification, escrow, fraud detection, trade limits

-- ============================================================
-- IDENTITY VERIFICATION
-- ============================================================
CREATE TABLE identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('email', 'phone', 'government_id', 'address')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'verified', 'failed', 'expired')),
  stripe_identity_session_id text, -- For Stripe Identity
  phone_number text,
  verification_code text,
  code_expires_at timestamptz,
  attempts int DEFAULT 0,
  verified_at timestamptz,
  metadata jsonb, -- Additional verification data
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_identity_user ON identity_verifications(user_id);
CREATE INDEX idx_identity_type_status ON identity_verifications(verification_type, status);
CREATE TRIGGER identity_updated_at BEFORE UPDATE ON identity_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE identity_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "identity_own" ON identity_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "identity_insert" ON identity_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "identity_update" ON identity_verifications FOR UPDATE USING (auth.uid() = user_id);

-- Add verification fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_level text DEFAULT 'none' CHECK (verification_level IN ('none', 'email', 'phone', 'verified', 'trusted'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score numeric(5,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trade_count_this_month int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_trade_reset_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason text;

-- ============================================================
-- ESCROW TRANSACTIONS
-- ============================================================
CREATE TABLE escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Can be for marketplace order or trade
  order_id uuid REFERENCES orders(id),
  trade_offer_id uuid REFERENCES trade_offers(id),
  -- Parties
  payer_id uuid NOT NULL REFERENCES profiles(id),
  payee_id uuid NOT NULL REFERENCES profiles(id),
  -- Financial
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) DEFAULT 0,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  -- Status
  status text DEFAULT 'pending' CHECK (status IN (
    'pending',        -- awaiting payment
    'funded',         -- money received, held
    'inspection',     -- buyer reviewing (48hr window)
    'releasing',      -- releasing to seller
    'released',       -- seller paid out
    'disputed',       -- dispute opened
    'refunded',       -- refunded to buyer
    'partial_refund'  -- partial refund
  )),
  -- Inspection window
  inspection_deadline timestamptz, -- 48hr from delivery confirmation
  inspection_passed boolean,
  -- Timestamps
  funded_at timestamptz,
  released_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (order_id IS NOT NULL OR trade_offer_id IS NOT NULL)
);
CREATE INDEX idx_escrow_order ON escrow_transactions(order_id);
CREATE INDEX idx_escrow_trade ON escrow_transactions(trade_offer_id);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_payer ON escrow_transactions(payer_id);
CREATE INDEX idx_escrow_payee ON escrow_transactions(payee_id);
CREATE TRIGGER escrow_updated_at BEFORE UPDATE ON escrow_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow_parties" ON escrow_transactions FOR SELECT USING (
  auth.uid() = payer_id OR auth.uid() = payee_id OR is_admin(auth.uid())
);

-- ============================================================
-- LISTING FLAGS (suspicious listing detection)
-- ============================================================
CREATE TABLE listing_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  flag_type text NOT NULL CHECK (flag_type IN (
    'price_too_low',      -- Below 30% market value
    'price_too_high',     -- Above 300% market value
    'duplicate_image',    -- Same images as another listing
    'stock_image',        -- Detected as stock/stolen image
    'new_account',        -- Listed by account < 7 days old
    'rapid_listing',      -- Too many listings in short time
    'reported_by_user',   -- User flagged it
    'counterfeit_pattern' -- AI detected counterfeit indicators
  )),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  auto_detected boolean DEFAULT true,
  details text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  resolution text CHECK (resolution IN ('approved', 'removed', 'warning', 'ban', NULL)),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_listing_flags_listing ON listing_flags(listing_id);
CREATE INDEX idx_listing_flags_unreviewed ON listing_flags(reviewed_at) WHERE reviewed_at IS NULL;

ALTER TABLE listing_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "flags_admin" ON listing_flags FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "flags_insert" ON listing_flags FOR INSERT WITH CHECK (true); -- service role + auto

-- ============================================================
-- TRADE LIMITS (new user restrictions)
-- ============================================================
CREATE TABLE trade_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_level text NOT NULL UNIQUE,
  max_trades_per_week int NOT NULL,
  max_trade_value numeric(10,2) NOT NULL,
  max_listings int NOT NULL,
  max_listing_value numeric(10,2) NOT NULL,
  can_sell boolean DEFAULT false,
  requires_tracking_above numeric(10,2) DEFAULT 25,
  requires_photos_above numeric(10,2) DEFAULT 50,
  created_at timestamptz DEFAULT now()
);

-- Insert default limits
INSERT INTO trade_limits (verification_level, max_trades_per_week, max_trade_value, max_listings, max_listing_value, can_sell) VALUES
  ('none', 0, 0, 0, 0, false),
  ('email', 3, 100, 5, 50, false),
  ('phone', 10, 500, 25, 250, true),
  ('verified', 50, 5000, 100, 2500, true),
  ('trusted', 999, 99999, 999, 99999, true);

-- ============================================================
-- PHOTO REQUIREMENTS
-- ============================================================
CREATE TABLE listing_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  photo_type text NOT NULL CHECK (photo_type IN ('front', 'back', 'closeup', 'packaging', 'grading_label')),
  is_primary boolean DEFAULT false,
  upload_hash text, -- For duplicate detection
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_listing_photos_listing ON listing_photos(listing_id);
CREATE INDEX idx_listing_photos_hash ON listing_photos(upload_hash);

ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_read" ON listing_photos FOR SELECT USING (true);
CREATE POLICY "photos_insert" ON listing_photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM listings WHERE id = listing_id AND user_id = auth.uid())
);

-- ============================================================
-- DISPUTE EVIDENCE
-- ============================================================
CREATE TABLE dispute_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES profiles(id),
  evidence_type text NOT NULL CHECK (evidence_type IN ('photo', 'screenshot', 'tracking', 'message', 'video', 'document')),
  file_url text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_dispute_evidence_dispute ON dispute_evidence(dispute_id);

ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evidence_parties" ON dispute_evidence FOR SELECT USING (
  EXISTS (SELECT 1 FROM disputes WHERE id = dispute_id AND (initiator_id = auth.uid() OR is_admin(auth.uid())))
);
CREATE POLICY "evidence_insert" ON dispute_evidence FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- ============================================================
-- USER BLOCKS
-- ============================================================
CREATE TABLE user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);
CREATE INDEX idx_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_blocks_blocked ON user_blocks(blocked_id);

ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blocks_own" ON user_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert" ON user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete" ON user_blocks FOR DELETE USING (auth.uid() = blocker_id);
