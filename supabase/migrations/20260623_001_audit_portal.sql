-- Audit Logs + Portal Enhancements

-- ============================================================
-- AUDIT LOG (immutable activity trail)
-- ============================================================
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL, -- 'trade', 'listing', 'order', 'profile', 'collection', 'dispute', 'auth'
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_own_read" ON audit_logs FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "audit_admin_insert" ON audit_logs FOR INSERT WITH CHECK (true); -- service role inserts

-- ============================================================
-- USER ACTIVITY SESSIONS
-- ============================================================
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  pages_viewed int DEFAULT 0
);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, started_at DESC);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_own" ON user_sessions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- PAYMENT HISTORY (unified view)
-- ============================================================
CREATE TABLE payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_type text NOT NULL CHECK (payment_type IN ('subscription', 'trade_fee', 'marketplace_purchase', 'marketplace_payout', 'auth_fee', 'protect_fee', 'refund')),
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'usd',
  stripe_id text,
  description text,
  related_entity_type text, -- 'trade', 'order', 'subscription', 'authentication'
  related_entity_id uuid,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_payment_history_user ON payment_history(user_id, created_at DESC);
CREATE INDEX idx_payment_history_stripe ON payment_history(stripe_id);

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_own" ON payment_history FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- ============================================================
-- PORTFOLIO SNAPSHOTS (daily value tracking)
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  total_value numeric(12,2),
  total_cards int,
  total_graded int,
  total_sets int,
  most_valuable_card_id uuid REFERENCES cards(id),
  most_valuable_card_value numeric(10,2),
  breakdown_by_set jsonb,
  breakdown_by_rarity jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, snapshot_date)
);
CREATE INDEX idx_portfolio_snapshots_user ON portfolio_snapshots(user_id, snapshot_date DESC);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_own" ON portfolio_snapshots FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- ADMIN: SUSPICIOUS ACTIVITY LOG
-- ============================================================
CREATE TABLE suspicious_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  activity_type text NOT NULL, -- 'rapid_listings', 'value_manipulation', 'fake_trade', 'spam', 'impersonation'
  severity text DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details text,
  auto_detected boolean DEFAULT false,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  resolution text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_suspicious_user ON suspicious_activity(user_id);
CREATE INDEX idx_suspicious_severity ON suspicious_activity(severity) WHERE reviewed_at IS NULL;

ALTER TABLE suspicious_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suspicious_admin_only" ON suspicious_activity FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "suspicious_admin_insert" ON suspicious_activity FOR INSERT WITH CHECK (is_admin(auth.uid()) OR auto_detected = true);
