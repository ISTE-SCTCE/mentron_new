# Person 3: shared Mlynq and Mentron platform

Status on 10 October 2026: implementation and isolated checks complete; production schema, account/content transfer, Firebase deployment and client release pending. Automatic approval review rejected the broad production migration and the account export. Do not use the CLI to bypass either rejection.

## Delivered behavior

The website root selects a product. Original product designs remain under `/mlynq/...` and `/mentron/...`; old Mentron links redirect to the new namespace. Shared signup, password login, email OTP and recovery use ISTE-admin. Product switching keeps the same session and asks users to join an unenrolled product. The Android app provides the same two product choices and separate navigation, version 1.1.0+8.

Canonical `public.profiles` controls enrollment, active status, roles and ISTE membership. Mentron feature data lives in the `mentron` schema; its profile compatibility fields follow the canonical identity. Client edits cannot grant roles, permissions or ISTE membership. Analytics records owned, enrolled-product activity, with an authority-only live summary at `/mentron/analytics/live`.

Private migrated files use `/api/files/...`, which verifies shared authentication and the applicable feature access. Native PDF/video/download clients resolve these paths to the platform host and attach a token only to that HTTPS endpoint. Existing R2 content remains in its existing bucket; the transfer covers Supabase Storage, not a wholesale R2 copy.

## Database package

Use the separate `ISTE-SCTCE/admin_copy` change with:

- `supabase/migrations/20261010070611_integrate_mentron_product_schema.sql`
- `supabase/migrations/20261010072945_verified_mentron_identity_import.sql`
- `supabase/scripts/migrate-mentron.mjs`, `mentron-transfer.mjs` and `mentron-catalog.json`
- `supabase/tests/person3_schema.test.mjs` and `mentron-transfer.test.mjs`

The source is Mentron `ysllolnoyezfdllqocgv`; the destination is ISTE-admin `vwxbgklgkcbwrvtwypfs`. Aggregate inspection found 346 nondeleted confirmed source Auth records, 294 source profiles, 40 feature tables and 22 objects across 9 storage buckets. Counts can change before cutover and must be refreshed with approval.

Existing verified destination accounts match by normalized email and retain their destination password, UUID, roles and memberships. Newly created accounts receive a destination UUID, no copied password and no destination email confirmation; they must prove mailbox ownership using email OTP. Source Auth UUIDs are remapped in foreign keys, nested values and storage paths. An existing canonical orphan profile can retain its UUID, but receives no verified login until mailbox proof. Ambiguous, unverified or inactive destination matches stop for review. Deleted/unconfirmed/banned source accounts are excluded.

Source administrator claims, self-asserted ISTE membership, device sessions and FCM tokens are not activated. Legacy `admins` and `user_sessions` rows are archived rather than enabled. The destination retains the first sanitized feature snapshot and a private identity map; the source is never deleted or changed. Password hashes are not exported or copied. Storage goes into `mentron-<legacy bucket>` and is byte-verified with SHA-256. CVs, notes, payment proofs, academy lectures and project files are private.

## Approved cutover sequence

1. Obtain explicit approval for the two production migrations and the scoped account/content export and transfer. Review both SQL files, take database backups, and arrange a short source write freeze. Do not release the clients before the destination is ready.
2. Apply the two reviewed migrations, in order, through the Supabase migration tool. The import helper is operator-only; neither clients nor `service_role` can invoke it. Verify API schema `mentron`, bucket isolation, RLS, Realtime publication and migration history.
3. In the admin repository, run the approved read-only transfer preview:

   ```text
   node supabase/scripts/migrate-mentron.mjs --approved-production-migration
   ```

   Check eligibility, table counts and file counts without exposing account lists or credentials. The unflagged command performs no live operations. The approval flag records operator intent; it does not replace approval.
4. After reviewing the preview, run the approved write transfer:

   ```text
   node supabase/scripts/migrate-mentron.mjs --approved-production-migration --write
   ```

   It requires the migrations already applied. Feature writes are one transaction with deferred foreign keys and an operator-only history-preservation flag; Auth mapping and storage are separate resumable phases. A differing target file or changing source digest blocks release. Keep a failed partial transfer private, review it, then resume. Never silently accept changed source data.
5. Reconcile row counts, identity-map coverage and every foreign key; confirm both products' existing memberships, destination roles and password logins are unchanged. Verify files through an authorized user, another user's denied access, expired membership, and an unenrolled/suspended user. Run Supabase security advisors and review findings. Test actual shared signup/confirmation/OTP/recovery and product switching with designated test accounts. Isolated tests do not prove these production flows.
6. Configure ISTE-admin Auth redirect allowlists for the shared site callback and password recovery paths, and verify email delivery/OTP settings. The website is intended for `https://mentron.istesctce.in`; update the trusted native file host if deployment uses another host.
7. Bind destination `PLATFORM_SUPABASE_SERVICE_ROLE_KEY` in Firebase Secret Manager. `PLATFORM_SUPABASE_URL`, if specified, must be ISTE-admin. Deploy the reviewed Firebase functions only after the destination migration/transfer checks. Existing R2 environment credentials remain server-only. Remove obsolete source Supabase server credentials from the new deployment. Recheck scheduled broadcasts and marketplace approval with canonical active executives.
8. Release the website and Android app together after all checks. Confirm legacy route redirects and version 1.1.0+8 on devices. Keep the source database and snapshots available for rollback; route traffic back to old clients if cutover validation fails. Avoid destructive rollback of shared users or memberships.

## Validation

The Next production build and TypeScript checks passed. Anonymous browser checks covered both product landings, shared login, protected-route redirects and no horizontal overflow at 390px/1366px. Flutter product/access and private-file-header tests passed; a debug Android APK builds. Database checks run in isolated PGlite against a fixture and cover enrollment, RLS, protected fields, verified matching, new UUIDs, password preservation, mailbox-proof gating and imported history. Transfer mapping and Firebase canonical-authority tests passed.

Production authentication, live migration, real file transfer, deployment and device testing remain pending approval. This work does not complete the separate certificate lifecycle migration or authorize deleting the remaining legacy attendance tables.

## Final UI phase requested by the user

After the backend transfer and production access checks are complete, improve both Mentron and Mlynq websites and Flutter modules. Preserve Mentron's dark purple/cyan identity and Mlynq's existing teal/light dashboard identity; maintain distinct product designs. Review navigation, dashboards, notes/events, forms, loading/error/empty states and phone layouts across both products. Verify touch targets, text scaling, keyboard navigation and contrast while retaining all product functions. This phase is intentionally pending until backend combination is finished.
