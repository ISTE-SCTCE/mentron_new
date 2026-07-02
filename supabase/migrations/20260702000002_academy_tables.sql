-- Migration: Add Offenso Academy Folders and Video Lectures
-- Date: 2026-07-02

-- 1. Create academy_folders table
CREATE TABLE IF NOT EXISTS academy_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create academy_lectures table
CREATE TABLE IF NOT EXISTS academy_lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES academy_folders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE academy_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_lectures ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for academy_folders
DO $$ BEGIN
  CREATE POLICY "academy_folders_select" ON academy_folders
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "academy_folders_insert" ON academy_folders
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "academy_folders_delete" ON academy_folders
    FOR DELETE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. RLS Policies for academy_lectures
DO $$ BEGIN
  CREATE POLICY "academy_lectures_select" ON academy_lectures
    FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "academy_lectures_insert" ON academy_lectures
    FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "academy_lectures_delete" ON academy_lectures
    FOR DELETE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('exec', 'core', 'admin')
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
