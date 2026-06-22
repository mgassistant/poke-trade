-- Trade Negotiation System Enhancement
-- Adds versioned counter offers, expanded statuses, authentication add-ons

-- Update trade status enum with full lifecycle
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'agreed';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'awaiting_shipment';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'disputed';

-- ============================================================
-- TRADE OFFER VERSIONS (Negotiation History)
-- ============================================================
CREATE TABLE trade_offer_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  proposed_by uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL CHECK (action IN ('initial', 'counter', 'accept', 'decline', 'cancel')),
  -- Snapshot of the offer at this version
  cash_amount numeric(10,2),
  notes text,
  -- Items offered/wanted stored as JSONB snapshots
  items_offered jsonb NOT NULL DEFAULT '[]',
  items_wanted jsonb NOT NULL DEFAULT '[]',
  -- Value estimates at time of version
  offered_value numeric(10,2),
  wanted_value numeric(10,2),
  created_at timestamptz DEFAULT now(),
  UNIQUE(trade_offer_id, version_number)
);
CREATE INDEX idx_trade_versions_offer ON trade_offer_versions(trade_offer_id, version_number);

-- ============================================================
-- TRADE AUTHENTICATION ADD-ONS
-- ============================================================
CREATE TABLE trade_authentications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES profiles(id),
  auth_provider text NOT NULL, -- 'psa', 'cgc', 'bgs', 'poke-trade-verify'
  auth_tier text NOT NULL,     -- 'basic', 'premium', 'elite'
  fee numeric(10,2) NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'shipped_to_auth', 'in_review', 'verified', 'failed', 'cancelled')),
  tracking_to_auth text,
  tracking_from_auth text,
  result jsonb, -- authentication result details
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_trade_auth_offer ON trade_authentications(trade_offer_id);
CREATE TRIGGER trade_auth_updated_at BEFORE UPDATE ON trade_authentications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRADE SHIPPING
-- ============================================================
CREATE TABLE trade_shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  shipper_id uuid NOT NULL REFERENCES profiles(id),
  receiver_id uuid NOT NULL REFERENCES profiles(id),
  tracking_number text,
  carrier text, -- 'usps', 'ups', 'fedex', etc.
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'in_transit', 'delivered', 'confirmed')),
  shipped_at timestamptz,
  delivered_at timestamptz,
  confirmed_at timestamptz,
  proof_photos text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_trade_shipments_offer ON trade_shipments(trade_offer_id);
CREATE INDEX idx_trade_shipments_shipper ON trade_shipments(shipper_id);
CREATE TRIGGER trade_shipments_updated_at BEFORE UPDATE ON trade_shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRADE CONTRACTS (generated on agreement)
-- ============================================================
CREATE TABLE trade_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid UNIQUE NOT NULL REFERENCES trade_offers(id) ON DELETE CASCADE,
  party_a uuid NOT NULL REFERENCES profiles(id),
  party_b uuid NOT NULL REFERENCES profiles(id),
  -- Final agreed terms
  items_a_sends jsonb NOT NULL,
  items_b_sends jsonb NOT NULL,
  cash_amount numeric(10,2),
  cash_direction text, -- 'a_to_b' or 'b_to_a'
  total_value_a numeric(10,2),
  total_value_b numeric(10,2),
  -- Authentication add-on
  authentication_required boolean DEFAULT false,
  auth_provider text,
  auth_fee numeric(10,2),
  -- Escrow (future: Poke-Trade Protect)
  escrow_enabled boolean DEFAULT false,
  escrow_amount numeric(10,2),
  -- Agreement
  agreed_at timestamptz DEFAULT now(),
  party_a_confirmed boolean DEFAULT false,
  party_b_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- TRADE FEE TRACKING
-- ============================================================
CREATE TABLE trade_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_offer_id uuid NOT NULL REFERENCES trade_offers(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  fee_type text NOT NULL CHECK (fee_type IN ('platform_trade_fee', 'authentication_fee', 'escrow_fee', 'protect_fee')),
  amount numeric(10,2) NOT NULL,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'waived', 'refunded')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_trade_fees_offer ON trade_fees(trade_offer_id);
CREATE INDEX idx_trade_fees_user ON trade_fees(user_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Trade versions: participants only
ALTER TABLE trade_offer_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_versions_read" ON trade_offer_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM trade_offers WHERE id = trade_offer_id AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);
CREATE POLICY "trade_versions_insert" ON trade_offer_versions FOR INSERT WITH CHECK (
  auth.uid() = proposed_by
);

-- Trade authentications: participants only
ALTER TABLE trade_authentications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_auth_read" ON trade_authentications FOR SELECT USING (
  EXISTS (SELECT 1 FROM trade_offers WHERE id = trade_offer_id AND (sender_id = auth.uid() OR receiver_id = auth.uid()))
);
CREATE POLICY "trade_auth_insert" ON trade_authentications FOR INSERT WITH CHECK (
  auth.uid() = requested_by
);

-- Trade shipments: participants only
ALTER TABLE trade_shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_shipments_read" ON trade_shipments FOR SELECT USING (
  auth.uid() = shipper_id OR auth.uid() = receiver_id
);
CREATE POLICY "trade_shipments_insert" ON trade_shipments FOR INSERT WITH CHECK (
  auth.uid() = shipper_id
);
CREATE POLICY "trade_shipments_update" ON trade_shipments FOR UPDATE USING (
  auth.uid() = shipper_id OR auth.uid() = receiver_id
);

-- Trade contracts: participants only
ALTER TABLE trade_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_contracts_read" ON trade_contracts FOR SELECT USING (
  auth.uid() = party_a OR auth.uid() = party_b
);

-- Trade fees: own fees only
ALTER TABLE trade_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_fees_read" ON trade_fees FOR SELECT USING (
  auth.uid() = user_id OR is_admin(auth.uid())
);
