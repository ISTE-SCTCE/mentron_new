-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: add_event_dates
-- Adds start_date and end_date columns to public.events
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Backfill existing events with reasonable defaults
UPDATE public.events SET start_date = event_date WHERE start_date IS NULL;
UPDATE public.events SET end_date = event_date + interval '2 hours' WHERE end_date IS NULL;
