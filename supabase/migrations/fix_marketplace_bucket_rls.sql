-- -----------------------------------------------------------------------------
-- Fix: Make marketplace storage buckets publicly readable.
--
-- The EXECOM Payment Manager renders payment screenshots from
-- marketplace_orders.payment_proof_url. If the bucket is private the URL
-- returns HTTP 403 and the image never loads.
--
-- Run this in Supabase Dashboard ? SQL Editor, or via `supabase db push`.
-- -----------------------------------------------------------------------------

-- 1. Payment-proof screenshots (EXECOM must be able to see buyer screenshots)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-payment-proofs', 'marketplace-payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Listing images (buyers browse these, should be public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-images', 'marketplace-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. GPay QR image (buyers need to see QR to pay)
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketplace-qr', 'marketplace-qr', true)
ON CONFLICT (id) DO UPDATE SET public = true;
