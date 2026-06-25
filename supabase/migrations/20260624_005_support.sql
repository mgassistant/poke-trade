-- Support Tickets, Replies, and Feedback
-- Migration: 20260624_005_support.sql

-- ============================================================
-- support_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  category text NOT NULL CHECK (category IN ('general','bug_report','feature_request','order_issue','account','trade_dispute','billing','other')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','open','in_progress','waiting_on_user','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  admin_notes text,
  resolution text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);

-- ============================================================
-- support_replies
-- ============================================================
CREATE TABLE IF NOT EXISTS support_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  is_admin boolean NOT NULL DEFAULT false,
  message text NOT NULL,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_replies_ticket_id ON support_replies(ticket_id);

-- ============================================================
-- feedback
-- ============================================================
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text,
  email text,
  type text NOT NULL CHECK (type IN ('suggestion','compliment','complaint','general')),
  message text NOT NULL,
  rating int CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  page_url text,
  is_public boolean NOT NULL DEFAULT false,
  admin_response text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','published','archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_is_public ON feedback(is_public) WHERE is_public = true;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert support tickets
CREATE POLICY "Anyone can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (true);

-- Authenticated users can see their own tickets
CREATE POLICY "Users see own tickets"
  ON support_tickets FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update any ticket
CREATE POLICY "Admins update tickets"
  ON support_tickets FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Anyone can insert replies (validated at API level)
CREATE POLICY "Ticket participants can reply"
  ON support_replies FOR INSERT
  WITH CHECK (true);

-- Users see replies on their own tickets, admins see all
CREATE POLICY "Users see replies on own tickets"
  ON support_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE support_tickets.id = support_replies.ticket_id
      AND (support_tickets.user_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
    )
  );

-- Anyone can submit feedback
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (true);

-- Public feedback visible to all, own feedback visible to author, admins see all
CREATE POLICY "Feedback visibility"
  ON feedback FOR SELECT
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can update feedback
CREATE POLICY "Admins update feedback"
  ON feedback FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Updated_at trigger for support_tickets
CREATE OR REPLACE FUNCTION update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_support_ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_support_ticket_updated_at();
