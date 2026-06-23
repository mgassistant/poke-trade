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
