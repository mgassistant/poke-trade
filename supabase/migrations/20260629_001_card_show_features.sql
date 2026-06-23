-- Card Show Features: showcase tables, online status, reports
-- Add last_active_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Showcase posts
CREATE TABLE IF NOT EXISTS showcase_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  card_ids text[] NOT NULL DEFAULT '{}',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_showcase_posts_user ON showcase_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_created ON showcase_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_showcase_posts_likes ON showcase_posts(likes_count DESC);

-- Showcase likes
CREATE TABLE IF NOT EXISTS showcase_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Showcase comments
CREATE TABLE IF NOT EXISTS showcase_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES showcase_posts(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_showcase_comments_post ON showcase_comments(post_id, created_at);

-- Shared binders
CREATE TABLE IF NOT EXISTS shared_binders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_code text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reports table (for price gouging etc)
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'price_gouging',
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for online status queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_featured ON profiles(is_featured) WHERE is_featured = true;
