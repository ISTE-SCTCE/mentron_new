-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: marketplace_tables
-- Mentron Peer-to-Peer Marketplace — all core tables + RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE marketplace_category AS ENUM (
    'textbook', 'electronics', 'project_components', 'stationery', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_condition AS ENUM ('new', 'like_new', 'used');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_status AS ENUM (
    'pending_review', 'live', 'sold', 'removed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_order_status AS ENUM (
    'pending_verification', 'payment_confirmed', 'delivered', 'refunded', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Table: marketplace_listings ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL CHECK (char_length(title) <= 120),
  description  TEXT,
  category     marketplace_category NOT NULL DEFAULT 'other',
  condition    marketplace_condition NOT NULL DEFAULT 'used',
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  images       TEXT[] NOT NULL DEFAULT '{}',
  status       marketplace_status NOT NULL DEFAULT 'pending_review',
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS marketplace_listings_seller_idx
  ON marketplace_listings(seller_id);

CREATE INDEX IF NOT EXISTS marketplace_listings_status_idx
  ON marketplace_listings(status);

CREATE INDEX IF NOT EXISTS marketplace_listings_created_idx
  ON marketplace_listings(created_at DESC);

-- ── Table: marketplace_orders ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id             UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount                 NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  payment_proof_url      TEXT,
  utr_number             TEXT,
  disclaimer_accepted_at TIMESTAMP WITH TIME ZONE,
  order_status           marketplace_order_status NOT NULL DEFAULT 'pending_verification',
  created_at             TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivery_deadline      TIMESTAMP WITH TIME ZONE,
  verified_by            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at            TIMESTAMP WITH TIME ZONE
);

-- Trigger to calculate delivery_deadline automatically on insert
CREATE OR REPLACE FUNCTION set_delivery_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;
  NEW.delivery_deadline := NEW.created_at + INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER tr_set_delivery_deadline
BEFORE INSERT ON marketplace_orders
FOR EACH ROW
EXECUTE FUNCTION set_delivery_deadline();

CREATE INDEX IF NOT EXISTS marketplace_orders_buyer_idx
  ON marketplace_orders(buyer_id);

CREATE INDEX IF NOT EXISTS marketplace_orders_listing_idx
  ON marketplace_orders(listing_id);

CREATE INDEX IF NOT EXISTS marketplace_orders_status_idx
  ON marketplace_orders(order_status);

CREATE INDEX IF NOT EXISTS marketplace_orders_created_idx
  ON marketplace_orders(created_at ASC);

-- ── Table: marketplace_listing_views ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketplace_listing_views (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  viewer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at   TIMESTAMP WITH TIME ZONE DEFAULT now(),
  viewed_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Unique constraint for daily dedup: one "unique visitor" row per (listing, viewer, day).
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_listing_views_daily_unique_idx
  ON marketplace_listing_views(listing_id, viewer_id, viewed_date);

CREATE INDEX IF NOT EXISTS marketplace_listing_views_listing_idx
  ON marketplace_listing_views(listing_id);

CREATE INDEX IF NOT EXISTS marketplace_listing_views_viewed_idx
  ON marketplace_listing_views(viewed_at DESC);

-- ── Table: payment_settings ───────────────────────────────────────────────────
-- Single-row config table. Seeded with a default row on creation.

CREATE TABLE IF NOT EXISTS payment_settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_image_url  TEXT,
  upi_id        TEXT,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Ensure exactly one row exists
INSERT INTO payment_settings (qr_image_url, upi_id)
VALUES (NULL, NULL)
ON CONFLICT DO NOTHING;

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listing_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an EXECOM admin?
CREATE OR REPLACE FUNCTION is_execom()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role IN ('exec', 'core', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── marketplace_listings policies ─────────────────────────────────────────────

-- All authenticated users can view live listings
CREATE POLICY "Anyone can view live listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'live' OR seller_id = auth.uid() OR is_execom());

-- Sellers can insert their own listings
CREATE POLICY "Sellers can create listings"
  ON marketplace_listings FOR INSERT
  WITH CHECK (seller_id = auth.uid());

-- Sellers can update/delete only their own listings (except status — handled by EXECOM)
CREATE POLICY "Sellers can edit own listings"
  ON marketplace_listings FOR UPDATE
  USING (seller_id = auth.uid() OR is_execom())
  WITH CHECK (seller_id = auth.uid() OR is_execom());

-- EXECOM can do everything
CREATE POLICY "EXECOM can manage all listings"
  ON marketplace_listings FOR ALL
  USING (is_execom())
  WITH CHECK (is_execom());

-- ── marketplace_orders policies ───────────────────────────────────────────────

-- Buyers read their own orders; EXECOM reads all
CREATE POLICY "Buyers can view own orders"
  ON marketplace_orders FOR SELECT
  USING (buyer_id = auth.uid() OR is_execom());

-- Sellers can see orders for their listings (to know when to hand over)
CREATE POLICY "Sellers can view orders for their listings"
  ON marketplace_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_listings
      WHERE marketplace_listings.id = marketplace_orders.listing_id
        AND marketplace_listings.seller_id = auth.uid()
    )
  );

-- Buyers can create orders
CREATE POLICY "Buyers can create orders"
  ON marketplace_orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Only EXECOM can update order_status and verified_by
CREATE POLICY "EXECOM can update orders"
  ON marketplace_orders FOR UPDATE
  USING (is_execom())
  WITH CHECK (is_execom());

-- ── marketplace_listing_views policies ────────────────────────────────────────

-- Listing owners can read views of their own listings
CREATE POLICY "Sellers can view listing analytics"
  ON marketplace_listing_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_listings
      WHERE marketplace_listings.id = marketplace_listing_views.listing_id
        AND marketplace_listings.seller_id = auth.uid()
    )
    OR is_execom()
  );

-- Any authenticated user can log a view (dedup handled by unique index + ON CONFLICT)
CREATE POLICY "Anyone can log a view"
  ON marketplace_listing_views FOR INSERT
  WITH CHECK (viewer_id = auth.uid());

-- ── payment_settings policies ─────────────────────────────────────────────────

-- Any authenticated user can read payment settings (to fetch QR / UPI ID at checkout)
CREATE POLICY "Anyone can read payment settings"
  ON payment_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only EXECOM can update payment settings
CREATE POLICY "EXECOM can update payment settings"
  ON payment_settings FOR UPDATE
  USING (is_execom())
  WITH CHECK (is_execom());
