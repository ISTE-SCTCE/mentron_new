-- Add require_iste_id column to notes table
-- This flag is set by the uploader and gates access for non-ISTE members.

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS require_iste_id BOOLEAN NOT NULL DEFAULT FALSE;
