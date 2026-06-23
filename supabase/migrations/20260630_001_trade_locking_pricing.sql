-- Trade Locking, Dynamic Pricing & Trade Protection
-- Adds locked status, fee tracking, protection tiers, card reservation

-- Add 'locked' to trade_status enum (between accepted and completed)
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'locked' AFTER 'accepted';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'in_transit' AFTER 'locked';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'shipped' AFTER 'locked';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'disputed' AFTER 'in_transit';
ALTER TYPE trade_status ADD VALUE IF NOT EXISTS 'awaiting_shipment' AFTER 'accepted';

-- Add new columns to trade_offers
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS locked_at timestamptz;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS fee_amount numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS fee_per_party numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_amount numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS protection_paid boolean DEFAULT false;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS auto_cancel_at timestamptz;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS trade_value numeric(10,2) DEFAULT 0;

-- Add reserved_for_trade_id to collection_items
ALTER TABLE collection_items ADD COLUMN IF NOT EXISTS reserved_for_trade_id uuid REFERENCES trade_offers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_collection_items_reserved ON collection_items(reserved_for_trade_id) WHERE reserved_for_trade_id IS NOT NULL;
