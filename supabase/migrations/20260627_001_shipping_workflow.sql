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
