-- Add year column to event_cal table for academic year targeting
-- Values: 'General' (all years), '1st', '2nd', '3rd', '4th'
ALTER TABLE event_cal ADD COLUMN IF NOT EXISTS year TEXT DEFAULT 'General';
