-- Trade Protection Redesign: add protection columns to trade_offers
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS trade_protection_selected boolean DEFAULT false;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_fee_total numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_fee_each numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS sender_tier text DEFAULT 'free';
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS receiver_tier text DEFAULT 'free';
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS declared_trade_value numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS sender_auth_status text DEFAULT 'none';
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS sender_auth_amount numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS receiver_auth_status text DEFAULT 'none';
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS receiver_auth_amount numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_terms_accepted_at timestamptz;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_terms_version text DEFAULT '1.0';
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_max_benefit numeric(10,2) DEFAULT 0;

-- Update shipping_method check constraint: change 'verified' to 'protected'
-- Drop old constraint if it exists, then add new one
DO $$
BEGIN
  -- Try to drop the old constraint (name may vary)
  BEGIN
    ALTER TABLE trade_offers DROP CONSTRAINT IF EXISTS trade_offers_shipping_method_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
  BEGIN
    ALTER TABLE trade_offers DROP CONSTRAINT IF EXISTS check_shipping_method;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;
END $$;

-- Migrate any existing 'verified' values to 'protected'
UPDATE trade_offers SET shipping_method = 'protected' WHERE shipping_method = 'verified';

-- Add new constraint
ALTER TABLE trade_offers ADD CONSTRAINT trade_offers_shipping_method_check
  CHECK (shipping_method IN ('direct', 'protected'));
