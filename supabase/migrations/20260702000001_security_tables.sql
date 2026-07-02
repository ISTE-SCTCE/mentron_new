-- =============================================================================
-- Mentron Security & Offline Storage — Phase 1, 3 Schema
-- Migration: 20260702000001_security_tables
-- =============================================================================

-- ── Phase 1: Session tracking ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  login_time TIMESTAMP DEFAULT NOW(),
  last_activity TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own sessions
DO $$ BEGIN
  CREATE POLICY "own_sessions_select" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can insert only their own session rows
DO $$ BEGIN
  CREATE POLICY "own_sessions_insert" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can update only their own session rows
DO $$ BEGIN
  CREATE POLICY "own_sessions_update" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Phase 3: Content catalogue ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('video', 'notes')),
  file_url TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read content
DO $$ BEGIN
  CREATE POLICY "authenticated_read_content" ON content
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Phase 3: Access / Audit trail ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content_id UUID,   -- intentionally no FK so notes from the 'notes' table can also be logged
  action VARCHAR(50) NOT NULL CHECK (action IN ('viewed', 'downloaded', 'deleted')),
  timestamp TIMESTAMP DEFAULT NOW(),
  device_info TEXT,
  ip_address VARCHAR(45)
);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Users can read only their own audit rows
DO $$ BEGIN
  CREATE POLICY "own_logs_select" ON access_logs
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can insert only their own log rows
DO $$ BEGIN
  CREATE POLICY "own_logs_insert" ON access_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
