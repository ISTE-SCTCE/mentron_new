-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: broadcast_notifications
-- EXECOM Notification Manager — broadcasts from exec to all users
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS broadcast_notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL CHECK (char_length(title) <= 65),
  body             TEXT NOT NULL CHECK (char_length(body) <= 240),
  created_by       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name  TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'SCHEDULED'
                     CHECK (status IN ('DRAFT', 'SCHEDULED', 'SENT', 'FAILED', 'CANCELLED')),
  scheduled_for    TIMESTAMP WITH TIME ZONE,   -- NULL = send immediately
  sent_at          TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS broadcast_notifications_status_scheduled_idx
  ON broadcast_notifications(status, scheduled_for)
  WHERE status = 'SCHEDULED';

CREATE INDEX IF NOT EXISTS broadcast_notifications_created_idx
  ON broadcast_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS broadcast_notifications_sent_idx
  ON broadcast_notifications(sent_at DESC)
  WHERE status = 'SENT';

-- ── Row Level Security ──────────────────────────────────────────────────────
ALTER TABLE broadcast_notifications ENABLE ROW LEVEL SECURITY;

-- EXECOM (exec / core / admin) can do everything
CREATE POLICY "Execom can manage broadcast notifications"
  ON broadcast_notifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
    )
  );

-- All authenticated users can READ sent notifications (for in-app inbox)
CREATE POLICY "Users can view sent broadcasts"
  ON broadcast_notifications FOR SELECT
  USING (
    status = 'SENT'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
    )
  );

-- ── Trigger: auto-update updated_at ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_broadcast_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER broadcast_notifications_updated_at
  BEFORE UPDATE ON broadcast_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_broadcast_notifications_updated_at();

-- ── Sample seed data (comment out in production) ────────────────────────────
-- INSERT INTO broadcast_notifications (title, body, created_by, created_by_name, status, scheduled_for)
-- VALUES (
--   'Welcome to Mentron!',
--   'Stay tuned for upcoming events, announcements, and opportunities from ISTE SCTCE.',
--   auth.uid(),
--   'EXECOM',
--   'SCHEDULED',
--   now() + interval '1 hour'
-- );
