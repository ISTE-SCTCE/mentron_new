-- Create academy_announcements table for editable pinned messages
CREATE TABLE IF NOT EXISTS academy_announcements (
  id INTEGER PRIMARY KEY,
  message TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the default Kali Linux announcement
INSERT INTO academy_announcements (id, message)
VALUES (1, U&'\U0001F49A Dear Offenso Fam\U0001F49A\nAs promised, today we''re sharing the Kali Linux installation video guide \U0001F4BB\U0001F409\nThis video explains the complete installation process step by step. Please watch it carefully and follow along.\n\n\U0001F517 Watch here: [ https://tinyurl.com/RandDoffenso ]\n\nIf you have any doubts, feel free to reach out.\nLet''s keep learning and growing together \U0001F49A\U0001F680')
ON CONFLICT (id) DO NOTHING;

-- RLS
ALTER TABLE academy_announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read announcements" ON academy_announcements;
DROP POLICY IF EXISTS "Exec can update announcements" ON academy_announcements;

CREATE POLICY "Anyone can read announcements"
  ON academy_announcements FOR SELECT USING (true);

CREATE POLICY "Authenticated users can update announcements"
  ON academy_announcements FOR ALL USING (auth.uid() IS NOT NULL);
