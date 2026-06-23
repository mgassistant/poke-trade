-- Trust Score & Identity Verification migration
-- Add verification columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_level integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_data jsonb DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score integer DEFAULT 100;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_score_updated_at timestamptz;

-- Add trust score filter columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS min_trade_trust_score integer DEFAULT 0;
