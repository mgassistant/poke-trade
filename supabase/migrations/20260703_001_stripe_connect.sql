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
