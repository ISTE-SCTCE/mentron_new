-- REVIEW ONLY: generated against iste-admin on 18 October 2026.
-- Adds restrictive policies; existing permissive policies remain in place.
-- Apply only after regression testing Mentron, mlynq, and the ISTE admin client.
BEGIN;
CREATE SCHEMA IF NOT EXISTS mentronplus_private;
REVOKE ALL ON SCHEMA mentronplus_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA mentronplus_private TO authenticated;

CREATE OR REPLACE FUNCTION mentronplus_private.active_account()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$ SELECT EXISTS (
 SELECT 1 FROM public.profiles p JOIN auth.users u ON u.id=p.id
 WHERE p.id=auth.uid() AND u.email_confirmed_at IS NOT NULL AND u.deleted_at IS NULL
 AND p.status='active' AND (p.suspended_until IS NULL OR p.suspended_until<=now())
); $$;
CREATE OR REPLACE FUNCTION mentronplus_private.manager()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$ SELECT mentronplus_private.active_account()
 AND public.is_authority_at_least('forum_execcom'::public.app_role); $$;
CREATE OR REPLACE FUNCTION mentronplus_private.member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$ SELECT mentronplus_private.active_account() AND EXISTS(
 SELECT 1 FROM public.profiles WHERE id=auth.uid() AND is_iste_member
 AND nullif(iste_membership_id,'') IS NOT NULL
 AND (expiry_date IS NULL OR expiry_date >= (now() AT TIME ZONE 'Asia/Kolkata')::date)
); $$;
REVOKE ALL ON FUNCTION mentronplus_private.active_account(), mentronplus_private.manager(), mentronplus_private.member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION mentronplus_private.active_account(), mentronplus_private.manager(), mentronplus_private.member() TO authenticated;


DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.notes;
CREATE POLICY mentronplus_guard_select ON mentron.notes AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (NOT require_iste_id OR mentronplus_private.member() OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.notes;
CREATE POLICY mentronplus_guard_insert ON mentron.notes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.notes;
CREATE POLICY mentronplus_guard_update ON mentron.notes AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.notes;
CREATE POLICY mentronplus_guard_delete ON mentron.notes AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.note_folders;
CREATE POLICY mentronplus_guard_select ON mentron.note_folders AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (true));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.note_folders;
CREATE POLICY mentronplus_guard_insert ON mentron.note_folders AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (created_by=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.note_folders;
CREATE POLICY mentronplus_guard_update ON mentron.note_folders AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (created_by=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (created_by=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.note_folders;
CREATE POLICY mentronplus_guard_delete ON mentron.note_folders AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (created_by=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.profiles;
CREATE POLICY mentronplus_guard_select ON mentron.profiles AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (id=(SELECT auth.uid()) OR mentronplus_private.manager() OR EXISTS(
 SELECT 1 FROM mentron.projects pr JOIN mentron.project_applications pa ON pa.project_id=pr.id
 WHERE (pr.posted_by=(SELECT auth.uid()) AND pa.profile_id=profiles.id)
 OR (pa.profile_id=(SELECT auth.uid()) AND pr.posted_by=profiles.id))));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.profiles;
CREATE POLICY mentronplus_guard_insert ON mentron.profiles AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (false));

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.profiles;
CREATE POLICY mentronplus_guard_delete ON mentron.profiles AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (false));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.profiles;
CREATE POLICY mentronplus_guard_update ON mentron.profiles AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (id=(SELECT auth.uid()))) WITH CHECK (id=(SELECT auth.uid()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.pending_notes;
CREATE POLICY mentronplus_guard_select ON mentron.pending_notes AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.pending_notes;
CREATE POLICY mentronplus_guard_insert ON mentron.pending_notes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.pending_notes;
CREATE POLICY mentronplus_guard_update ON mentron.pending_notes AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (profile_id=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.pending_notes;
CREATE POLICY mentronplus_guard_delete ON mentron.pending_notes AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.pending_projects;
CREATE POLICY mentronplus_guard_select ON mentron.pending_projects AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (posted_by=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.pending_projects;
CREATE POLICY mentronplus_guard_insert ON mentron.pending_projects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (posted_by=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.pending_projects;
CREATE POLICY mentronplus_guard_update ON mentron.pending_projects AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (posted_by=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (posted_by=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.pending_projects;
CREATE POLICY mentronplus_guard_delete ON mentron.pending_projects AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (posted_by=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.user_sessions;
CREATE POLICY mentronplus_guard_select ON mentron.user_sessions AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.user_sessions;
CREATE POLICY mentronplus_guard_insert ON mentron.user_sessions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.user_sessions;
CREATE POLICY mentronplus_guard_update ON mentron.user_sessions AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (user_id=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.user_sessions;
CREATE POLICY mentronplus_guard_delete ON mentron.user_sessions AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.projects;
CREATE POLICY mentronplus_guard_select ON mentron.projects AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (is_approved OR posted_by=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.projects;
CREATE POLICY mentronplus_guard_insert ON mentron.projects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.projects;
CREATE POLICY mentronplus_guard_update ON mentron.projects AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.projects;
CREATE POLICY mentronplus_guard_delete ON mentron.projects AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.project_applications;
CREATE POLICY mentronplus_guard_select ON mentron.project_applications AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) OR EXISTS(SELECT 1 FROM mentron.projects p WHERE p.id=project_id AND p.posted_by=(SELECT auth.uid())) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.project_applications;
CREATE POLICY mentronplus_guard_insert ON mentron.project_applications AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) AND NOT EXISTS(SELECT 1 FROM mentron.projects p WHERE p.id=project_id AND p.posted_by=(SELECT auth.uid()))));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.project_applications;
CREATE POLICY mentronplus_guard_update ON mentron.project_applications AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (EXISTS(SELECT 1 FROM mentron.projects p WHERE p.id=project_id AND p.posted_by=(SELECT auth.uid())) OR mentronplus_private.manager())) WITH CHECK (EXISTS(SELECT 1 FROM mentron.projects p WHERE p.id=project_id AND p.posted_by=(SELECT auth.uid())) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.project_applications;
CREATE POLICY mentronplus_guard_delete ON mentron.project_applications AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (EXISTS(SELECT 1 FROM mentron.projects p WHERE p.id=project_id AND p.posted_by=(SELECT auth.uid())) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.forum_questions;
CREATE POLICY mentronplus_guard_select ON mentron.forum_questions AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (true));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.forum_questions;
CREATE POLICY mentronplus_guard_insert ON mentron.forum_questions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (author_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.forum_questions;
CREATE POLICY mentronplus_guard_update ON mentron.forum_questions AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (author_id=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (author_id=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.forum_questions;
CREATE POLICY mentronplus_guard_delete ON mentron.forum_questions AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (author_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.forum_answers;
CREATE POLICY mentronplus_guard_select ON mentron.forum_answers AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (true));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.forum_answers;
CREATE POLICY mentronplus_guard_insert ON mentron.forum_answers AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (author_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.forum_answers;
CREATE POLICY mentronplus_guard_update ON mentron.forum_answers AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (author_id=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (author_id=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.forum_answers;
CREATE POLICY mentronplus_guard_delete ON mentron.forum_answers AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (author_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.forum_votes;
CREATE POLICY mentronplus_guard_select ON mentron.forum_votes AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid())));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.forum_votes;
CREATE POLICY mentronplus_guard_insert ON mentron.forum_votes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid())));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.forum_votes;
CREATE POLICY mentronplus_guard_update ON mentron.forum_votes AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()))) WITH CHECK (user_id=(SELECT auth.uid()));

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.forum_votes;
CREATE POLICY mentronplus_guard_delete ON mentron.forum_votes AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid())));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.marketplace_listings;
CREATE POLICY mentronplus_guard_select ON mentron.marketplace_listings AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (status='live' OR seller_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.marketplace_listings;
CREATE POLICY mentronplus_guard_insert ON mentron.marketplace_listings AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (seller_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.marketplace_listings;
CREATE POLICY mentronplus_guard_update ON mentron.marketplace_listings AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (seller_id=(SELECT auth.uid()) OR mentronplus_private.manager())) WITH CHECK (seller_id=(SELECT auth.uid()) OR mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.marketplace_listings;
CREATE POLICY mentronplus_guard_delete ON mentron.marketplace_listings AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (seller_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON mentron.marketplace_orders;
CREATE POLICY mentronplus_guard_select ON mentron.marketplace_orders AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (buyer_id=(SELECT auth.uid()) OR EXISTS(SELECT 1 FROM mentron.marketplace_listings l WHERE l.id=listing_id AND l.seller_id=(SELECT auth.uid())) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON mentron.marketplace_orders;
CREATE POLICY mentronplus_guard_insert ON mentron.marketplace_orders AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (buyer_id=(SELECT auth.uid())));

DROP POLICY IF EXISTS mentronplus_guard_update ON mentron.marketplace_orders;
CREATE POLICY mentronplus_guard_update ON mentron.marketplace_orders AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON mentron.marketplace_orders;
CREATE POLICY mentronplus_guard_delete ON mentron.marketplace_orders AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON public.certificates;
CREATE POLICY mentronplus_guard_select ON public.certificates AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.certificates;
CREATE POLICY mentronplus_guard_insert ON public.certificates AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.certificates;
CREATE POLICY mentronplus_guard_update ON public.certificates AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.certificates;
CREATE POLICY mentronplus_guard_delete ON public.certificates AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_block_anon ON public.certificates;
CREATE POLICY mentronplus_block_anon ON public.certificates AS RESTRICTIVE FOR ALL TO anon USING(false) WITH CHECK(false);

DROP POLICY IF EXISTS mentronplus_guard_select ON public.attendance;
CREATE POLICY mentronplus_guard_select ON public.attendance AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.attendance;
CREATE POLICY mentronplus_guard_insert ON public.attendance AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.attendance;
CREATE POLICY mentronplus_guard_update ON public.attendance AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.attendance;
CREATE POLICY mentronplus_guard_delete ON public.attendance AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_block_anon ON public.attendance;
CREATE POLICY mentronplus_block_anon ON public.attendance AS RESTRICTIVE FOR ALL TO anon USING(false) WITH CHECK(false);

DROP POLICY IF EXISTS mentronplus_guard_select ON public.session_attendance;
CREATE POLICY mentronplus_guard_select ON public.session_attendance AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (profile_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.session_attendance;
CREATE POLICY mentronplus_guard_insert ON public.session_attendance AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.session_attendance;
CREATE POLICY mentronplus_guard_update ON public.session_attendance AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.session_attendance;
CREATE POLICY mentronplus_guard_delete ON public.session_attendance AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_block_anon ON public.session_attendance;
CREATE POLICY mentronplus_block_anon ON public.session_attendance AS RESTRICTIVE FOR ALL TO anon USING(false) WITH CHECK(false);

DROP POLICY IF EXISTS mentronplus_guard_select ON public.events;
CREATE POLICY mentronplus_guard_select ON public.events AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (true));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.events;
CREATE POLICY mentronplus_guard_insert ON public.events AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.events;
CREATE POLICY mentronplus_guard_update ON public.events AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.events;
CREATE POLICY mentronplus_guard_delete ON public.events AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON public.event_sessions;
CREATE POLICY mentronplus_guard_select ON public.event_sessions AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (true));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.event_sessions;
CREATE POLICY mentronplus_guard_insert ON public.event_sessions AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.event_sessions;
CREATE POLICY mentronplus_guard_update ON public.event_sessions AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.event_sessions;
CREATE POLICY mentronplus_guard_delete ON public.event_sessions AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON public.announcements;
CREATE POLICY mentronplus_guard_select ON public.announcements AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (true));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.announcements;
CREATE POLICY mentronplus_guard_insert ON public.announcements AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.announcements;
CREATE POLICY mentronplus_guard_update ON public.announcements AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager())) WITH CHECK (mentronplus_private.manager());

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.announcements;
CREATE POLICY mentronplus_guard_delete ON public.announcements AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_select ON public.qr_tokens;
CREATE POLICY mentronplus_guard_select ON public.qr_tokens AS RESTRICTIVE FOR SELECT TO authenticated USING (mentronplus_private.active_account() AND (user_id=(SELECT auth.uid()) OR mentronplus_private.manager()));

DROP POLICY IF EXISTS mentronplus_guard_insert ON public.qr_tokens;
CREATE POLICY mentronplus_guard_insert ON public.qr_tokens AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (mentronplus_private.active_account() AND (false));

DROP POLICY IF EXISTS mentronplus_guard_update ON public.qr_tokens;
CREATE POLICY mentronplus_guard_update ON public.qr_tokens AS RESTRICTIVE FOR UPDATE TO authenticated USING (mentronplus_private.active_account() AND (false)) WITH CHECK (false);

DROP POLICY IF EXISTS mentronplus_guard_delete ON public.qr_tokens;
CREATE POLICY mentronplus_guard_delete ON public.qr_tokens AS RESTRICTIVE FOR DELETE TO authenticated USING (mentronplus_private.active_account() AND (false));

-- Column guards complement row ownership. SECURITY INVOKER preserves current_user.
CREATE OR REPLACE FUNCTION mentronplus_private.guard_forum_counters()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF current_user NOT IN ('postgres','supabase_admin','service_role') AND NOT mentronplus_private.manager()
 AND (NEW.author_id IS DISTINCT FROM OLD.author_id OR NEW.question_id IS DISTINCT FROM OLD.question_id
 OR NEW.upvotes IS DISTINCT FROM OLD.upvotes OR NEW.is_best_answer IS DISTINCT FROM OLD.is_best_answer) THEN
 RAISE EXCEPTION 'Only the authorised service can change answer ownership or counters';
 END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS mentronplus_forum_guard ON mentron.forum_answers;
CREATE TRIGGER mentronplus_forum_guard BEFORE UPDATE ON mentron.forum_answers
FOR EACH ROW EXECUTE FUNCTION mentronplus_private.guard_forum_counters();

CREATE OR REPLACE FUNCTION mentronplus_private.guard_listing()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,mentron AS $$
BEGIN
 IF current_user NOT IN ('postgres','supabase_admin','service_role') AND NOT mentronplus_private.manager() THEN
  IF TG_OP='INSERT' AND NEW.status <> 'pending_review' THEN RAISE EXCEPTION 'Listings require review'; END IF;
  IF TG_OP='UPDATE' AND (NEW.seller_id IS DISTINCT FROM OLD.seller_id OR NEW.status IS DISTINCT FROM OLD.status) THEN
   RAISE EXCEPTION 'Seller and publication status are protected';
  END IF;
 END IF;
 IF NEW.price<=0 THEN RAISE EXCEPTION 'Price must be positive'; END IF;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS mentronplus_listing_guard ON mentron.marketplace_listings;
CREATE TRIGGER mentronplus_listing_guard BEFORE INSERT OR UPDATE ON mentron.marketplace_listings
FOR EACH ROW EXECUTE FUNCTION mentronplus_private.guard_listing();

CREATE OR REPLACE FUNCTION mentronplus_private.guard_order()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public,mentron AS $$
DECLARE listing mentron.marketplace_listings%ROWTYPE;
BEGIN
 IF NOT mentronplus_private.active_account() THEN RAISE EXCEPTION 'Active account required'; END IF;
 SELECT * INTO listing FROM mentron.marketplace_listings WHERE id=NEW.listing_id FOR UPDATE;
 IF NOT FOUND OR listing.status<>'live' OR listing.seller_id=auth.uid() THEN RAISE EXCEPTION 'Listing unavailable'; END IF;
 IF NEW.buyer_id IS DISTINCT FROM auth.uid() OR NEW.order_status<>'pending_verification'
 OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN RAISE EXCEPTION 'Invalid order'; END IF;
 NEW.amount:=listing.price;
 RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS mentronplus_order_guard ON mentron.marketplace_orders;
CREATE TRIGGER mentronplus_order_guard BEFORE INSERT ON mentron.marketplace_orders
FOR EACH ROW EXECUTE FUNCTION mentronplus_private.guard_order();

-- Version 2: random server-issued token, only a digest is persisted.
-- Existing legacy QR issuers must migrate to this endpoint before deployment.
CREATE OR REPLACE FUNCTION public.issue_attendance_token()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,extensions AS $$
DECLARE secret text; row_id bigint; deadline timestamptz;
BEGIN
 IF NOT public.platform_product_access('mlynq') THEN RAISE EXCEPTION 'Active mlynq account required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 IF EXISTS(SELECT 1 FROM public.qr_tokens WHERE user_id=auth.uid() AND created_at>now()-interval '3 seconds') THEN
  RAISE EXCEPTION 'Please wait before generating another token';
 END IF;
 secret:=encode(extensions.gen_random_bytes(32),'hex');
 deadline:=now()+interval '30 seconds';
 INSERT INTO public.qr_tokens(user_id,token_hash,expires_at,is_used)
 VALUES(auth.uid(),encode(extensions.digest(secret,'sha256'),'hex'),deadline,false) RETURNING id INTO row_id;
 RETURN jsonb_build_object('v',2,'uid',auth.uid(),'token_id',row_id,'token',secret,'expires_at',deadline);
END; $$;
REVOKE ALL ON FUNCTION public.issue_attendance_token() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.issue_attendance_token() TO authenticated;

CREATE OR REPLACE FUNCTION public.consume_attendance_token(p_session_id uuid,p_user_id uuid,p_token_id integer,p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,public,extensions AS $$
BEGIN
 IF NOT mentronplus_private.manager() THEN RAISE EXCEPTION 'Coordinator access required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=p_user_id AND status='active'
 AND (suspended_until IS NULL OR suspended_until<=now())) THEN RAISE EXCEPTION 'Account inactive'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.event_sessions WHERE id=p_session_id
 AND session_date=(now() AT TIME ZONE 'Asia/Kolkata')::date) THEN RAISE EXCEPTION 'Session is not open today'; END IF;
 IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'Invalid token'; END IF;
 RETURN public.mark_session_attendance_atomic(p_session_id,p_user_id,p_token_id,encode(extensions.digest(p_token,'sha256'),'hex'));
END; $$;
REVOKE ALL ON FUNCTION public.consume_attendance_token(uuid,uuid,integer,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.consume_attendance_token(uuid,uuid,integer,text) TO authenticated;

-- Restrict legacy scan RPCs so callers cannot skip the version-2 checks.
REVOKE EXECUTE ON FUNCTION public.mark_session_attendance_atomic(uuid,uuid,integer,text) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_attendance_atomic(integer,uuid,integer,uuid) FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_attendance_atomic(integer,uuid,integer,uuid,integer) FROM PUBLIC,anon,authenticated;

-- Do not expose certificate records through an unscoped SECURITY DEFINER RPC.
CREATE OR REPLACE FUNCTION public.get_student_certificates(p_user_id uuid)
RETURNS TABLE(id uuid,event_id bigint,event_title text,event_date date,category text,student_name text,cert_url text,file_url text,issued_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
 SELECT c.id,c.event_id,e.title,e.date,e.category,c.student_name,c.certificate_url,c.file_url,c.issued_at
 FROM public.certificates c JOIN public.events e ON e.id=c.event_id
 WHERE c.user_id=p_user_id AND (p_user_id=auth.uid() OR mentronplus_private.manager())
 ORDER BY c.issued_at DESC NULLS LAST;
$$;
REVOKE ALL ON FUNCTION public.get_student_certificates(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_student_certificates(uuid) TO authenticated;
COMMIT;
