-- REVIEW ONLY. Requires 20261018035130_mentronplus_access_guards_and_checkin.
-- Closes the inherited enrolled-user write policy on payment settings.
-- Existing rows and payment destinations are preserved.
BEGIN;
ALTER TABLE mentron.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY mentronplus_payment_select ON mentron.payment_settings AS RESTRICTIVE
FOR SELECT TO authenticated USING (mentronplus_private.active_account());
CREATE POLICY mentronplus_payment_insert ON mentron.payment_settings AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (mentronplus_private.manager());
CREATE POLICY mentronplus_payment_update ON mentron.payment_settings AS RESTRICTIVE
FOR UPDATE TO authenticated USING (mentronplus_private.manager()) WITH CHECK (mentronplus_private.manager());
CREATE POLICY mentronplus_payment_delete ON mentron.payment_settings AS RESTRICTIVE
FOR DELETE TO authenticated USING (mentronplus_private.manager());

CREATE FUNCTION mentronplus_private.guard_application()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,mentron AS $$
DECLARE project mentron.projects%ROWTYPE;
BEGIN
 IF NOT mentronplus_private.active_account() THEN RAISE EXCEPTION 'Active account required'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT * INTO project FROM mentron.projects WHERE id=NEW.project_id;
  IF NOT FOUND OR NOT project.is_approved OR project.posted_by=auth.uid()
   OR NEW.profile_id IS DISTINCT FROM auth.uid() OR NEW.status<>'pending' THEN
   RAISE EXCEPTION 'Invalid project application';
  END IF;
  IF project.cv_required AND nullif(NEW.cv_url,'') IS NULL THEN RAISE EXCEPTION 'CV required'; END IF;
  IF nullif(NEW.cv_url,'') IS NOT NULL AND
   NEW.cv_url NOT LIKE '%/mentron-cv_bucket/'||auth.uid()::text||'/%' THEN RAISE EXCEPTION 'Invalid CV reference'; END IF;
 ELSE
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.project_id IS DISTINCT FROM OLD.project_id
   OR NEW.profile_id IS DISTINCT FROM OLD.profile_id OR NEW.message IS DISTINCT FROM OLD.message
   OR NEW.cv_url IS DISTINCT FROM OLD.cv_url OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
   RAISE EXCEPTION 'Application identity and submission are immutable';
  END IF;
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER mentronplus_application_guard BEFORE INSERT OR UPDATE ON mentron.project_applications
FOR EACH ROW EXECUTE FUNCTION mentronplus_private.guard_application();

CREATE FUNCTION mentronplus_private.guard_payment_submission()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,mentron,storage AS $$
BEGIN
 IF NEW.buyer_id IS DISTINCT FROM auth.uid() OR NOT mentronplus_private.active_account() THEN
  RAISE EXCEPTION 'Active buyer account required';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.buyer_id::text||NEW.listing_id::text,1));
 IF EXISTS(SELECT 1 FROM mentron.marketplace_orders WHERE buyer_id=NEW.buyer_id
  AND listing_id=NEW.listing_id AND order_status IN ('pending_verification','payment_confirmed','delivered')) THEN
  RAISE EXCEPTION 'An order already exists for this listing';
 END IF;
 IF NEW.disclaimer_accepted_at IS NULL OR NEW.disclaimer_accepted_at>now()+interval '1 minute'
  OR NEW.utr_number IS NULL OR NEW.utr_number !~ '^[A-Za-z0-9]{6,40}$'
  OR NEW.phone_number IS NULL OR NEW.phone_number !~ '^[+]?[0-9 ()-]{10,18}$'
  OR NEW.payment_proof_url IS NULL OR NEW.payment_proof_url NOT LIKE auth.uid()::text||'/%'
  OR NOT EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id='mentron-marketplace-payment-proofs'
    AND name=NEW.payment_proof_url) THEN RAISE EXCEPTION 'Valid payment receipt and contact details required'; END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER mentronplus_payment_submission BEFORE INSERT ON mentron.marketplace_orders
FOR EACH ROW EXECUTE FUNCTION mentronplus_private.guard_payment_submission();
REVOKE ALL ON FUNCTION mentronplus_private.guard_application(),mentronplus_private.guard_payment_submission() FROM PUBLIC,anon,authenticated;

-- The website keeps payment submission unavailable until this reviewed fix is installed.
CREATE FUNCTION public.mentronplus_payment_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
 SELECT mentronplus_private.active_account() AND public.platform_product_access('mentron');
$$;
REVOKE ALL ON FUNCTION public.mentronplus_payment_ready() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.mentronplus_payment_ready() TO authenticated;
COMMIT;
