-- Add profile_id column to notes table
ALTER TABLE notes
ADD COLUMN profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create an index to improve query performance for user notes
CREATE INDEX IF NOT EXISTS notes_profile_id_idx ON notes(profile_id);
