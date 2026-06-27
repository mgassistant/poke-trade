-- Add cash balance columns to trade_offers for uneven trade compensation
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS cash_offer numeric(10,2) DEFAULT 0;
ALTER TABLE trade_offers ADD COLUMN IF NOT EXISTS cash_want numeric(10,2) DEFAULT 0;
