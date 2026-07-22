-- Migration: Marketplace & Academy Fixes
-- Date: 2026-07-14

-- 1. Alter academy_lectures to support nullable video_url and add notes columns
ALTER TABLE academy_lectures ALTER COLUMN video_url DROP NOT NULL;
ALTER TABLE academy_lectures ADD COLUMN IF NOT EXISTS notes_url TEXT;
ALTER TABLE academy_lectures ADD COLUMN IF NOT EXISTS lecture_type TEXT DEFAULT 'video' CHECK (lecture_type IN ('video', 'notes'));

-- 2. Alter profiles to add phone column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

-- 3. Alter marketplace_orders to add phone_number column
ALTER TABLE marketplace_orders ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- 4. Enable DELETE policy on marketplace_listings for the sellers themselves
DO $$ BEGIN
  CREATE POLICY "Sellers can delete own listings"
    ON marketplace_listings FOR DELETE
    USING (seller_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
