-- AI Usage Tracking Table
-- Tracks every AI call for cost monitoring and per-user caps

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feature TEXT NOT NULL, -- 'card_scan', 'card_scan_batch', 'card_scan_binder'
  model TEXT NOT NULL, -- 'gpt-4o', 'gpt-4o-mini', 'tesseract'
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  estimated_cost_cents INT DEFAULT 0, -- cost in cents for easy aggregation
  input_type TEXT, -- 'camera', 'upload', 'batch', 'binder'
  success BOOLEAN DEFAULT true,
  request_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying usage
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date ON ai_usage_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage_log(feature, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_daily ON ai_usage_log(user_id, (created_at::date));

-- View for daily per-user aggregation
CREATE OR REPLACE VIEW ai_usage_daily AS
SELECT
  user_id,
  created_at::date AS usage_date,
  feature,
  COUNT(*) AS call_count,
  SUM(total_tokens) AS total_tokens,
  SUM(estimated_cost_cents) AS total_cost_cents,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) AS success_count
FROM ai_usage_log
GROUP BY user_id, created_at::date, feature;
