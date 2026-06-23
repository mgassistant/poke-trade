CREATE TABLE IF NOT EXISTS insurance_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  estimated_collection_value numeric(12,2),
  number_of_cards integer,
  has_graded_cards boolean DEFAULT false,
  storage_method text, -- 'home','safe','bank_vault','storage_unit','other'
  consent_to_contact boolean DEFAULT true,
  status text DEFAULT 'new', -- 'new','contacted','quoted','bound','lost'
  admin_notes text,
  referred_to text, -- agent/agency name
  quote_amount numeric(10,2),
  policy_number text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_status ON insurance_leads(status);
CREATE INDEX IF NOT EXISTS idx_insurance_leads_user ON insurance_leads(user_id);
