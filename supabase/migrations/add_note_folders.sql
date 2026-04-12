-- Migration: Add note_folders table and folder_id column to notes
-- Run this in the Supabase SQL editor

-- 1. Create the note_folders table
CREATE TABLE IF NOT EXISTS note_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    semester TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add folder_id column to notes table
ALTER TABLE notes
    ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES note_folders(id) ON DELETE SET NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_note_folders_subject ON note_folders(subject, department, year, semester);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);

-- 4. Row Level Security for note_folders
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read folders
CREATE POLICY "note_folders_select" ON note_folders
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert folders
CREATE POLICY "note_folders_insert" ON note_folders
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Allow folder creator or exec/core/admin to delete
CREATE POLICY "note_folders_delete" ON note_folders
    FOR DELETE TO authenticated USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid()
            AND role IN ('exec', 'core', 'admin')
        )
    );
