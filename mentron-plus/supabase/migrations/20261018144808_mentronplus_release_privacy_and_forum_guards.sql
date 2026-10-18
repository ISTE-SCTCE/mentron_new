-- REVIEW ONLY. Do not apply until the shared ISTE certificate issuers/viewers
-- have been checked. Existing public certificate links will stop working.
-- No existing records or objects are removed. Previously downloaded copies and
-- already-issued signed URLs cannot be revoked by this change.
BEGIN;

CREATE OR REPLACE FUNCTION mentronplus_private.guard_forum_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF current_user NOT IN ('postgres','supabase_admin','service_role')
 AND NOT mentronplus_private.manager()
 AND (NEW.upvotes IS DISTINCT FROM 0 OR NEW.is_best_answer IS DISTINCT FROM false) THEN
  RAISE EXCEPTION 'New replies cannot set votes or best-answer status';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION mentronplus_private.guard_forum_insert() FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE TRIGGER mentronplus_forum_insert_guard BEFORE INSERT ON mentron.forum_answers
FOR EACH ROW EXECUTE FUNCTION mentronplus_private.guard_forum_insert();

-- Decode exactly once. Malformed values do not authorize any object.
CREATE OR REPLACE FUNCTION mentronplus_private.decode_object_path(value text)
RETURNS text LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE position integer:=1; output bytea:=''::bytea; piece text;
BEGIN
 IF value IS NULL OR length(value)>4096 THEN RETURN NULL; END IF;
 WHILE position<=length(value) LOOP
  piece:=substr(value,position,1);
  IF piece='%' THEN
   IF substr(value,position+1,2) !~ '^[a-fA-F0-9]{2}$' THEN RETURN NULL; END IF;
   output:=output||decode(substr(value,position+1,2),'hex');position:=position+3;
  ELSE
   output:=output||convert_to(piece,'UTF8');position:=position+1;
  END IF;
 END LOOP;
 RETURN convert_from(output,'UTF8');
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END; $$;

CREATE OR REPLACE FUNCTION mentronplus_private.certificate_reference_matches(value text,bucket text,object_name text,bare_path boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE SET search_path=pg_catalog AS $$
DECLARE parts text[];
BEGIN
 IF value IS NULL OR value='' OR bucket NOT IN ('issued-certificates','certificates') THEN RETURN false; END IF;
 -- Bare storage_path values are literal keys, never URL-decoded.
 IF bare_path AND value !~ '^https?://' THEN
  RETURN bucket='issued-certificates' AND value=object_name;
 END IF;
 parts:=regexp_match(value,'^https://vwxbgklgkcbwrvtwypfs[.]supabase[.]co/storage/v1/object/(?:public|sign|authenticated)/(issued-certificates|certificates)/([^?#]+)(?:[?#].*)?$');
 RETURN coalesce(parts[1]=bucket AND mentronplus_private.decode_object_path(parts[2])=object_name,false);
END; $$;

CREATE OR REPLACE FUNCTION mentronplus_private.can_read_certificate_object(bucket text,object_name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT mentronplus_private.active_account() AND (
  mentronplus_private.manager() OR EXISTS(
   SELECT 1 FROM public.certificates c WHERE c.user_id=(SELECT auth.uid()) AND (
    mentronplus_private.certificate_reference_matches(c.storage_path,bucket,object_name,true)
    OR mentronplus_private.certificate_reference_matches(c.certificate_url,bucket,object_name)
    OR mentronplus_private.certificate_reference_matches(c.file_url,bucket,object_name)
   )
  )
 );
$$;
REVOKE ALL ON FUNCTION mentronplus_private.decode_object_path(text),mentronplus_private.certificate_reference_matches(text,text,text,boolean),mentronplus_private.can_read_certificate_object(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION mentronplus_private.can_read_certificate_object(text,text) TO authenticated;

-- Restrictive guards intersect with legacy permissive/public policies.
-- Separate permissive grants keep owner/manager access functional.
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_anon_guard') THEN
  CREATE POLICY mentronplus_cert_anon_guard ON storage.objects AS RESTRICTIVE FOR ALL TO anon
 USING(bucket_id NOT IN ('issued-certificates','certificates'))
 WITH CHECK(bucket_id NOT IN ('issued-certificates','certificates'));
 END IF;
END $policy$;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_read_guard') THEN
  CREATE POLICY mentronplus_cert_read_guard ON storage.objects AS RESTRICTIVE FOR SELECT TO authenticated
 USING(bucket_id NOT IN ('issued-certificates','certificates') OR mentronplus_private.can_read_certificate_object(bucket_id,name));
 END IF;
END $policy$;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_read') THEN
  CREATE POLICY mentronplus_cert_read ON storage.objects FOR SELECT TO authenticated
 USING(bucket_id IN ('issued-certificates','certificates') AND mentronplus_private.can_read_certificate_object(bucket_id,name));
 END IF;
END $policy$;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_insert_guard') THEN
  CREATE POLICY mentronplus_cert_insert_guard ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated
 WITH CHECK(bucket_id NOT IN ('issued-certificates','certificates') OR mentronplus_private.manager());
 END IF;
END $policy$;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_update_guard') THEN
  CREATE POLICY mentronplus_cert_update_guard ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated
 USING(bucket_id NOT IN ('issued-certificates','certificates') OR mentronplus_private.manager())
 WITH CHECK(bucket_id NOT IN ('issued-certificates','certificates') OR mentronplus_private.manager());
 END IF;
END $policy$;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_delete_guard') THEN
  CREATE POLICY mentronplus_cert_delete_guard ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated
 USING(bucket_id NOT IN ('issued-certificates','certificates') OR mentronplus_private.manager());
 END IF;
END $policy$;
DO $policy$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='mentronplus_cert_manage') THEN
  CREATE POLICY mentronplus_cert_manage ON storage.objects FOR ALL TO authenticated
 USING(bucket_id IN ('issued-certificates','certificates') AND mentronplus_private.manager())
 WITH CHECK(bucket_id IN ('issued-certificates','certificates') AND mentronplus_private.manager());
 END IF;
END $policy$;

UPDATE storage.buckets SET public=false WHERE id IN ('issued-certificates','certificates');
COMMIT;
