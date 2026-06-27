-- PSA Cert lookup cache — avoids re-calling the rate-limited API
CREATE TABLE IF NOT EXISTS psa_cert_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cert_number text NOT NULL UNIQUE,
  cert_data jsonb NOT NULL DEFAULT '{}',
  card_name text,
  card_grade text,
  grade_description text,
  year text,
  brand text,
  population integer DEFAULT 0,
  population_higher integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_psa_cache_cert ON psa_cert_cache(cert_number);
CREATE INDEX IF NOT EXISTS idx_psa_cache_grade ON psa_cert_cache(card_grade);
