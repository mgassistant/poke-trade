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
