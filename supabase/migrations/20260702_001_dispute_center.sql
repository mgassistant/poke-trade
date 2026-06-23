-- Enhanced disputes table
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS reason_category text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_photos text[] DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_description text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_id uuid;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_response text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS respondent_evidence text[] DEFAULT '{}';
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_decision text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_reasoning text;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_decided_by uuid;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS decided_at timestamptz;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS credit_amount numeric(10,2) DEFAULT 0;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS outcome text; -- 'no_action','warning','restriction','suspension','ban','credit','refund','other'

CREATE TABLE IF NOT EXISTS dispute_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  attachments text[] DEFAULT '{}',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
