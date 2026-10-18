# Phase 0 — source audit

Date: 17 October 2026. Deliverables: Flutter super-app **and responsive website**. This report records local source evidence, not a live database inspection. Existing migrations may not be deployed. No database connection, migration execution, dependency installation, source cleanup, or application implementation was performed.

## Stop boundary

The user asked to complete work before designing and stop for Astra. The supplied sequence puts tokens, WorldTheme, motion, loaders and the shell in Phase 1, immediately after this audit. This folder therefore contains planning and source inventories only. No visual design has started. Later data and screen phases have dependencies on this foundation and on the decisions below; they are not represented as complete.

## Located references

| Brief reference | Actual local location | Finding |
|---|---|---|
| Mentron Flutter | `C:/Users/Sarvesh R/Downloads/mentron_new-main/mentron_new-main/mentron_flutter` | Base reference; already contains an embedded `lib/mlynq` module and platform product switching. |
| Mentron Next.js | `C:/Users/Sarvesh R/Downloads/mentron_new-main/mentron_new-main` | Reference only. Many pre-existing uncommitted website edits; do not overwrite, extend, or commit them. |
| Lynq React/Vite | `C:/Users/Sarvesh R/Downloads/admin/admin/mlynq` | Contains the specified 11 pages, QR implementation and member email helper. |
| Additional platform SQL | `C:/Users/Sarvesh R/Downloads/admin/admin/supabase` | Later unification/security migrations materially change the older assumptions in the brief. |
| Fresh destination | `C:/Users/Sarvesh R/Downloads/admin/campus_app` | Documentation only at this boundary. |

The generated inventory lists screen files, services, table references, RPCs, migration declarations and source line counts. Direct SDK use must be moved behind repositories in the new app; copying screens unchanged would preserve the existing architecture problems.

## Functional coverage and overlaps

| Area | Existing sources | New product direction |
|---|---|---|
| Boot/auth | Mentron splash, onboarding, login/signup/reset/update/exec login; Lynq OTP/guest login | One auth/session flow; onboarding can reuse landing-page ideas after Astra designs it. |
| Learn | Dashboard/calendar; Notes hierarchy/viewer/upload/folders; Gate; Projects/applications/contributions; Market/orders/activity; Forum; leaderboard/downloads/requests | Preserve behavior, access and protected content; repository-backed screens. |
| Campus | React Home, Events, EventDetail, QR, Attendance, Certificates, History, Notifications, Profile; existing partial Dart port | Audit/reuse working logic rather than port twice. Add attendance/history routes where Dart port lacks dedicated files. |
| Events | Mentron feature events + calendar banners; Lynq event calendar and details | One model/repository and detail/list experience across both worlds, with explicit source IDs. |
| Notifications | Broadcast/FCM/inbox plus Lynq announcements | One inbox with source metadata and read state; do not equate separate source row IDs. |
| Profile | Mentron profile; Lynq member/edit profile; React profile | One cached current profile. No runtime account linking or email-based identity reassignment. |
| Admin | Exec dashboard, payments, buyers, notifications/events, permission management | Isolated dark module; preserve Mentron permission semantics. Website admin access must be server-enforced too. |

## Identity conflict — decision required before implementation

The brief assumes a single Mentron `profiles` table. Current code and later SQL instead show two profile structures:

- Flutter Learn uses `.schema('mentron').from('profiles')`: `full_name`, integer `year`, `department`, text `role`, `iste_id`, `iste_position`, XP, session fields, avatar, etc.
- Embedded Campus reads unqualified `profiles` (public): `name`, text `year`, `branch`, hierarchical `app_role`, `status`, membership and product enrollment fields.
- `20261010133336_integrate_mentron_product_schema.sql` creates `mentron.profiles`; `20260809_consolidation.sql` defines `public.profiles`. Later identity-import code matches verified identities into public profiles. Migration presence does not establish the deployed target project or authoritative schema.
- `20261002_unified_platform_foundation.sql` also creates `iste_memberships` and a trigger syncing claims onto public profiles. That conflicts with making profiles the only source of membership truth unless the existing writer is deliberately reconciled.

**Do not silently pick a second identity, repoint production, map Lynq authority onto Mentron roles, or replay these historical migrations.** The target Supabase project and canonical schema must be confirmed. Recommendation for the requested contract: keep the Mentron profile meaning and role logic, add only missing nullable membership fields, and ensure both clients use the same canonical row. If public profiles is already the deployed canonical identity, use its existing columns and preserve Mentron-specific permissions separately through an approved additive compatibility plan. This report does not approve either live migration path.

## Profiles mapping

Mentron columns are evidenced by Flutter reads and the later Mentron schema snapshot. Public-platform equivalents are shown to avoid proposing duplicate additions if that schema is chosen. All new columns below are candidates pending a complete target schema snapshot; never rename, drop, or retype an existing column.

| Lynq field | Mentron profiles target | Existing public-platform equivalent / constraint |
|---|---|---|
| id | id; must equal canonical auth ID | id; do not rewrite IDs during login |
| name | full_name | name |
| email | email | email; import match uses normalized verified email only |
| roll_number | roll_number | roll_number |
| branch | department | branch |
| department | department | branch; conflicting branch/department values require review |
| year | year (integer; validate conversion) | year (text); do not alter type |
| phone | phone | phone |
| role | Preserve existing role; no automatic elevation | app_role hierarchy differs; explicit authority mapping required |
| status | new nullable status (text, constrained after audit) | status already account_status enum |
| suspended_until | new nullable suspended_until (timestamptz) | suspended_until |
| membership_id | iste_id, only if it is the same ISTE identifier | iste_membership_id |
| membership_type | new nullable membership_plan if same concept as plan_type | membership_plan; inconsistent source values require reconciliation |
| plan_type | same membership_plan candidate | membership_plan |
| iste_id | iste_id | iste_membership_id if equivalent; do not overwrite conflicting IDs |
| is_iste_member | new nullable is_iste_member (boolean) | is_iste_member |
| is_registered | new nullable is_registered (boolean) | is_registered |
| validity_end | new nullable expiry_date (date or timestamptz after semantics review) | expiry_date (date); inclusive end-day/timezone rule needs agreement |
| forum_name | new nullable forum (text) | forum |

Never let a self-edit profile request update role, permissions, suspension, membership claims or validity. Ownership RLS alone does not protect privileged columns. Existing self-update guards and role functions must be preserved, understood and tested.

## Events and collision recommendation

**Recommendation for a fresh build against the original Mentron schema: use `lynq_events` for the incompatible Campus event shape.** Mentron events use UUID IDs, `event_date`, numeric `registration_fee`, `start_date`/`end_date`; Mentron registrations reference UUID events. Lynq SQL uses BIGINT event IDs, `date`, multi-day/session attendance, `allowed_roles`, member/non-member pricing, poster and certificate fields. These IDs and lifecycle semantics cannot be safely merged by adding nullable columns alone.

| Resource | Proposed handling | Evidence/guard |
|---|---|---|
| Mentron events | Keep existing events and registrations | Never convert IDs or retarget old registrations implicitly. |
| Lynq events | `lynq_events` if importing into original Mentron namespace | If the already-integrated platform is the approved target, reuse public.events and mentron.events through repository adapters instead of duplicating them again. |
| Event calendar | Preserve event_cal as calendar data | Not automatically a second registration system. Use explicit links; no title/date heuristic deduplication. |
| Attendance | `lynq_attendance` / session tables if collision or incompatible existing shape | Current platform also has session_attendance; preserve session/day semantics and uniqueness. |
| Certificates | `lynq_certificates` if colliding, else certificates | Preserve issue/finalization/eligibility and template metadata. |
| QR tokens | `lynq_qr_tokens` if colliding, else qr_tokens | All ownership references to canonical profiles.id; atomic one-use validation. |
| Announcements | Retain source via notifications adapter | Broadcast notifications already exist; one UI does not require destructive table merging. |
| event_posters | Distinguish table references from Storage bucket | Observed certificate code uses `storage.from('event_posters')`; do not invent a table from that call. Inventory reports raw references separately. |

One domain Event should normalize source, original ID, title, schedule/timezone, venue, eligibility, pricing, registration and attendance state. Source-qualified IDs prevent BIGINT/UUID collisions. Public routes use stable normalized identifiers. No database naming choice has been implemented; this recommendation is presented for the Phase 0 review required by the brief.

## QR and membership findings

The full `qrSecurity.js`, `member_emails.js`, AuthContext and all 11 page files were inspected through source reads and a generated call inventory. The legacy QR format is:

1. Timestamp in milliseconds; expiry 30 seconds later.
2. First 32 lowercase hex characters of SHA-256 over `userId:timestamp:secret`.
3. Register `user_id`, `token_hash`, `expires_at`, `is_used=false` in qr_tokens.
4. JSON payload fields in order: `uid`, `token`, `ts`.
5. AES-256-GCM key from SHA-256(secret), random 16-byte IV, 128-bit authentication tag via Web Crypto defaults. Envelope: unpadded Base64URL IV, period, standard Base64 ciphertext with tag.

Legacy generation warns and still displays a QR when registration fails. Signing/encryption material is also supplied to browser code with a fallback. These are existing weaknesses, not suitable security guarantees. There is no attendance-validation function in this JS file; actual scanner/server validation must be audited too.

Later SQL `20261003120000_session_attendance_qr_atomic.sql` has authority checks, a locked token row, owner/hash/expiry/replay checks, session attendance and token consumption in one transaction. Preserve this behavior or equivalent protection if migrating. Do not downgrade to client-side validation. Exact legacy compatibility and correcting client-held secret issuance may require a versioned server-issued token path; the user must resolve that protocol decision before implementation. `.env` does not make a browser-bundled secret private.

Membership conflicts:

- React AuthContext calls membership valid when an identifier exists, regardless of expiry.
- Existing embedded Flutter additionally checks the membership flag and expiry; suspension/auth status handling differs.
- The hardcoded email list is a legacy enrollment hint, not verified authority. Do not copy personal email addresses into a shipped bundle or this report.
- Older check_member_email SQL returns name, phone and membership identifier to anonymous callers. New behavior must avoid unauthenticated profile disclosure; verify latest deployed grants before rewriting.
- Account suspension/status must gate protected operations server-side; failed profile fetch must not manufacture an authorized member.

Required tests later: cross-language fixed vectors; encryption round-trip and tamper rejection; Unicode IDs; malformed envelope; expiry at the exact boundary; future timestamp handling; token-registration failure; simultaneous/repeated scans; unauthorized scanner; wrong owner/session; membership missing/expired/suspended; date-only expiry semantics. No QR changes or tests have been implemented in this documentation phase.

## Website scope and architecture assumptions

Assumption: 'website too' means a complete responsive companion for both worlds, not just a promotional landing page. Build in a fresh `campus_app/web` folder after design approval. A separate React/TypeScript web client is proposed because browsers need semantic navigation, accessible forms, linkable routes and browser-native file flows; the existing Next.js site stays reference only. Framework selection remains an implementation decision, not a dependency installation performed here.

Shared backend and domain contracts, separate Flutter/web presentation. Both use profiles-only identity, the same permissions, events, QR and certificate rules. Share language-neutral contract fixtures for QR/membership; Dart and TypeScript implementations must pass identical vectors. Website work includes login/signup/reset, Learn features, Campus features and privileged admin routes within the existing feature scope. Retain public entry only as needed for access; Astra owns its visual treatment.

Platform constraints to account for:

- Browsers cannot enforce native screenshot blocking, arbitrary device brightness, certificate pinning or native keystore guarantees. Never label website content as screenshot-proof.
- Protected content still needs server authorization and controlled URLs. No unrestricted offline caching of private PDFs or membership data; browser cache and logout cleanup need separate review.
- Web Crypto requires a secure context; camera/share/notifications depend on browser support and permission. Provide honest fallbacks after browser compatibility checks.
- PDF generation and expensive parsing need background workers on web and supported isolates on Flutter; HTML-template fidelity is not automatically provided by the Dart pdf package.
- Route refresh/deep links, keyboard navigation, focus, reduced-motion, small/large screens, per-user cache isolation and multiple open tabs are acceptance requirements.

Proposed structure after the design boundary: `mobile/` (Flutter feature-first data/domain/presentation), `web/` (feature-first web client), `contracts/` (versioned fixtures/contracts), `supabase/migrations/` (new additive migration files only), `supabase/data_migration/` (separate one-time import), `docs/`. No scaffold is created yet to avoid starting the design foundation prematurely.

## Other risks and preservation requirements

- Existing Flutter mixes Provider and Riverpod. Choose one shared profile state boundary and avoid duplicate auth listeners during consolidation.
- Learn and Exec scaffolds still poll session state every 30 seconds; replace with auth streams and resume checks while retaining device/session enforcement.
- Existing duplicate/old themes, glass/liquid widgets, motion helpers and partial port code require consolidation only in the new destination. Never delete reference files.
- Native-only imports/plugins require platform adapters; a Flutter web build cannot be assumed to support them unchanged.
- Certificate sources use templates, signed Storage URLs, placeholders, jsPDF/html2canvas, student lookup, coordinator/chair names and finalization. Layout equivalence needs representative sanitized assets and rendered comparison after design.
- The new code must remove hardcoded backend config, including platform config, and avoid copying any real .env values. Public publishable keys are distinct from private signing/service secrets.
- Preserve content protection, device guards, audit logging, encrypted offline storage and FCM where supported. Their existence in source is not proof that each current implementation is secure or measured.
- Existing historical migrations include destructive operations and side effects; copying the migration directory wholesale would violate the new brief. Deliver only reviewed new additive idempotent files; never execute them.
- One-time import must start with SELECT-only diagnostics, stop on duplicate/unverified/unmatched emails, preserve canonical IDs and roles, translate all foreign keys, be rerun-safe and report counts. No silent authority import, credential/session-token transfer or overwrite of current records. Historical QR tokens are ephemeral: preserve expiry/used flags and never reactivate them.

## Short implementation sequence after Astra resumes

1. Approve Phase 0 identity/backend, event collision, membership/QR decisions and website scope. Obtain read-only schema evidence if needed; no migration application is authorized.
2. Astra handles Phase 1 visual foundation for Flutter and responsive web: tokens, WorldTheme, typography/assets, shell/navigation, loading/empty/error states and motion/reduced-motion rules.
3. Build repository interfaces and one cached current profile per client, env/platform adapters and cache strategy; write additive migration files and the separate dry-run-first import for review.
4. Implement Learn, then Campus, then unified Events/Notifications/Profile/Today. Preserve permissions and behavior; keep admin lazy and isolated.
5. Measure native frame/startup/memory performance on real devices; measure browser loading/runtime separately. Do not claim the brief's targets without evidence.
6. Run Flutter analysis/tests, website type/lint/build and browser checks, QR/membership/repository tests, offline/reduced-motion/accessibility checks. Report after each phase and commit only this new project when a repository is initialized; never include reference edits.

## Validation at this boundary

Documentation/source inventory only. Flutter analysis and app launch are not applicable to an unscaffolded project. Flutter/Dart were not available on the current command path or the common checked installation paths; this is not proof they are absent from the computer. No performance measurements have been taken. The source inventories distinguish observed declarations from actual deployed schema and do not print source secrets or personal email lists.
