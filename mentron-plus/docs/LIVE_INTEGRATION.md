# Live integration — 18 October 2026

Latest release status is in [RELEASE.md](RELEASE.md). The approved release security migration has now made both certificate buckets private and added initial forum-counter protection; earlier public-certificate warnings below describe the pre-fix state. Live checks confirmed anonymous certificate-object access is denied and an active owner retains access. The website includes a Node/Vercel file service and deployment checks. Public-host email and transaction acceptance remain deployment work, and native release parity is not claimed.

## Backend and identity

The selected shared backend is **iste-admin**, project `vwxbgklgkcbwrvtwypfs`. Both clients use a publishable key, persisted SDK sessions, server-validated users, and the existing `public.profiles` account. `enroll_current_user` links an active, verified account to the selected product; study records use the existing compatibility schema `mentron`. No duplicate auth accounts or user import were created.

The website uses password login, signup, password reset/recovery, shared profile editing, sign-out, auth events, and visibility/resume checks. Profile edits whitelist ordinary identity fields and cannot submit role or membership claims. Account status, expiry, role, membership, private ownership, and note access are enforced in the database as well as the interface. The public auth settings currently enable email/password signup with automatic email confirmation; email delivery and production callback configuration have not been verified.

## Connected website functionality

- Shared and separate product landing pages; separate Mentron and mlynq login pages using one session.
- Live dashboard, paginated notes/projects/events/marketplace/forum, search, private document links, bookmarks, recently opened resources, replies and helpful votes. Department/group, semester, and subject filters now query the whole note collection before pagination; saved notes are fetched in bounded ID batches and paginated globally. Facet metadata is fetched separately in pages without document URLs.
- Pending resource/project submissions, marketplace listings, CV uploads for project applications, and manually verified UPI receipt submissions. Uploaded CVs and receipts use private buckets. PDF CVs have a 10 MB client limit; JPG/PNG receipts have a 5 MB limit and signature checks. These checks do not replace server-side malware scanning.
- Owned certificates, session attendance, applications, orders, notifications, and canonical profile editing.
- Manager-only event/announcement publishing, resource/project/listing approval, payment verification and delivery status, and the coordinator QR scanner. Publication retains the original pending submission and uses its id to prevent duplicate publication on retry.
- Personal check-in QR uses a random server-issued secret with a persisted digest and a 30-second expiry. The new coordinator endpoint delegates consumption to the existing atomic attendance operation. Direct legacy issuance/scan calls are blocked. Deploy the coordinator UI together with this database version.

Payment submission records a receipt awaiting manual verification. It does not automatically debit, settle, refund, or confirm a payment. The website checks for the reviewed payment capability before displaying payment instructions.

## Authorized database changes

Applied successfully after separate explicit approvals:

1. `20261018035130_mentronplus_access_guards_and_checkin.sql`: restrictive access/ownership policies, write guards, scoped certificate reads, secure QR issuance and consumption, legacy QR endpoint revocation.
2. `20261018044604_mentronplus_payment_and_application_guards.sql`: manager-only payment-setting mutations, immutable application submissions, required CV checks, receipt ownership/existence validation, duplicate-order checks, and an authenticated readiness function.

Applied files are retained unchanged, including their original review comments. Existing user/product records were not imported, deleted, or reassigned. Further database changes still require review under the original brief.

## Verification completed

- User signed in with an existing iste-admin account in the browser. Dashboard loaded 247 notes and 9 events, and the session restored in a separate verification tab.
- The personal QR image rendered successfully after applying the access migration. The image/token was not included in screenshots or logs.
- Anonymous certificate access and QR issuance are blocked; an inactive test identity cannot read notes or attendance; direct legacy scanner execution is blocked.
- A transaction rolled back after confirming an ordinary member cannot update payment settings, is not a manager, and can access the enabled payment flow.
- Production website build passes. Nine web domain/upload tests pass. Flutter analysis is clean; four foundation widget tests and three profile/membership tests pass. The native client now supports canonical profile editing, application/order history, and marking owned notifications read. Native auth and profile loading have moved into an account repository so account screens no longer call the Supabase client directly.
- A rolled-back token test confirms QR version 2, a 64-character random secret, the 30-second expiry, and blocked legacy scanner execution. The anonymous mlynq login was inspected on a separate local origin without signing the user out; its narrow viewport has no horizontal document overflow. Screenshot: `docs/previews/mlynq-login-live.png`.

## Remaining release work

This is a live integration, not a completed production release of every item in the original brief.

- Configure/verify Supabase Auth callback allowlisting for the actual website domain and local callback URLs (`http://127.0.0.1:4173/` with world/flow query parameters). Native recovery uses `mentronplus://auth-callback`; verify the allowlist and end-to-end email/deep-link delivery on Android and iOS. No password was changed during testing.
- Native Flutter currently covers authentication, shared identity/profile editing, enrolled worlds, live collection browsing, private notes/certificates, notifications/read status, application/order history, attendance, and QR display. Full native contribution, checkout, moderation, protected media, device/session guards, push notifications, offline encrypted content, PDF generation, and feature parity remain pending. Foundation and domain tests do not replace an authenticated physical-device acceptance run.
- No live payment, application, publication, or attendance record was fabricated for testing. Receipt upload/verification, project application review, certificate ownership/downloads, and a real coordinator scan need a controlled end-to-end acceptance run. Existing event sessions are historical; no attendee was marked present.
- Department/group, semester, subject, and saved-note filtering work across the complete library. The original folder-management workflow and native uploads/viewer protection remain pending. Member note contributions currently accept external HTTPS document links. The selected backend has no GATE tables; ordinary subject folders are no longer queried as if they were GATE folders. The GATE route shows an unavailable state with a link to study resources. Connecting the original GATE data requires a separately reviewed backend/import change.
- Certificates are opened from existing files; native certificate PDF generation and signing are not implemented. Existing certificate storage buckets are public and require a separately reviewed privacy transition, including compatibility with other ISTE clients.
- Supabase security advisors still report pre-existing mutable-search-path and callable-definer warnings, RLS-enabled tables without policies, and disabled leaked-password protection. The broader ISTE platform needs a separate audit; the two migrations do not establish global security completeness. See [function search path guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable), [definer function exposure](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), and [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- No Android/iOS signed release, public hosting, real-device performance measurements, push credentials, or production SMTP validation. Flutter JavaScript web release builds; WebAssembly compatibility is limited by the secure-storage web dependency.
- Git work is uncommitted because no author identity is configured. No invented author identity was used.

## Brand decisions

Mentron+ is the shared product; the two worlds are Mentron and mlynq. The common message is “Find your tribe. Build your next chapter.” The requested mlynq login tagline was removed. Inter replaces decorative serif headings. The supplied ISTE mark is a small header/footer credit. The new mlynq vector logo is in `web/public/brand`; Mentron's final supplied logo remains pending. External ISTE footer navigation is limited to Join ISTE, Contact, and Forums. The extra FAQ and “Your next aha” closing section were removed.

## Subtle depth pass

The shared landing hero, both product landing heroes, signed-in dashboard artwork, and both login illustrations use a shared CSS perspective treatment. Decorative hero layers sit at slightly different depths; fine-pointer movement adds at most 2.4 degrees of rotation, reduced to 1.7 degrees on login and 1.6 on dashboards. Form controls and primary copy remain stationary. The effect schedules work only on pointer movement, coalesces updates into one animation frame, resets on pointer exit/hidden documents, and disables motion for touch/coarse pointers and reduced-motion preferences. It adds no 3D runtime or WebGL dependency. Screenshots are in `docs/previews/mlynq-subtle-depth.png` and `docs/previews/mentron-hero-depth.png`.

Live browser checks confirmed a 27-result Computer Science/S3 filter across more than one page, and a temporary bookmark saved on page two appeared in Saved notes on page one; the bookmark was removed afterward. Browser inspection confirmed a transformed login illustration with an untransformed form and no desktop document overflow. The Mentron hero also fits the narrow 375px preview without horizontal document overflow. Final website and Flutter JavaScript release builds pass; the existing secure-storage WebAssembly limitation remains. No database migrations or persistent record mutations were performed for this pass.

## Common hero reference refresh

The common Mentron+ landing now follows the requested Artesa reference: oversized condensed Anton lettering, a rough painted strip, concrete and tire textures, custom tribe lettering, and a paper sticker with subtle pointer depth. The palette uses warm charcoal, cream, and chartreuse. Product entry links lead to the existing separate Mentron and mlynq landing pages. The common login action preserves the existing authenticated redirect. The small ISTE header credit and restricted external footer links remain.

Anton is bundled locally with its OFL license. Reference texture provenance is recorded in `web/public/brand/HERO_ASSETS.md`. Mobile inspection at 375px confirmed no horizontal document overflow; both world entry links were exercised. Separate world themes remain scoped independently. This pass changes no authentication logic or database records.

## Continuous common landing and paint scroll

The common page's pastel ribbon, world cards, and illustrated closing section have been replaced with a continuous asphalt/cream/chartreuse treatment. The two worlds use condensed headings and unboxed copy; the shared footer uses the same surface, paint edge, typography, and original Mentron+ spray-can artwork. The requested ISTE links remain Join ISTE, Contact, and Forums.

Native scroll drives a sticky two-world scene: the SVG can traverses and rotates across a rough lime paint trail. The footer can also follows entry progress. Scroll handlers use passive listeners and a single pending animation frame, clean up on unmount, and never intercept scrolling. Reduced-motion mode shows the full painted state without a pinned section or moving can; short mobile viewports use normal document flow. Artwork is decorative and hidden from assistive technology.

Browser checks confirmed changing can/trail transforms at scroll positions 0 and 0.445, and footer transforms at entry progress 0.266 and 0.541. The 375px layout has no horizontal overflow; world links remain clear of the can, and the new mlynq entry opens the existing separate page. Browser error logs are empty. Production build passes (Vite reports its standard 500kB chunk-size advisory). Screenshots: `docs/previews/common-paint-desktop.png`, `common-paint-mobile.png`, and `common-paint-footer.png`. No authentication, backend, or database changes were made in this pass.

## Notes flow and backend synchronization

Restored the original website's year → semester → group/department → subject → PYQ/video/custom folder → notes flow. Subject names come from existing ROOT folders plus published note metadata, including empty subject folders and normalized dash variants. Virtual Settings rows remain hidden as configuration. Folder-backed notes are queried separately from unfiled subject resources. Breadcrumb URLs retain context on refresh and browser back/forward. All-notes, saved-notes, contributions, global title/description/subject search, deterministic pagination, and context-prefilled contributions are available. Pending contributions still target subject review; the existing pending-note schema does not carry a custom-folder destination.

Read-only comparison with the original Mentron backend confirmed identical notes/folder metadata fingerprints and counts: 247 notes and 255 folders. No data import or schema change was needed. The selected shared backend remains iste-admin. Its other current catalog counts are 9 public events, 1 marketplace listing, 0 projects, 0 questions, and 0 announcements. Empty collections are displayed honestly. This is client synchronization with the shared backend, not a cross-database replication service.

Published notes/projects, events, owned notifications and attendance use one scoped Realtime channel. Revalidation also runs when a tab resumes, connectivity returns, and every 60 seconds while visible, covering folders and other tables not in the existing publication. Requests coalesce during in-flight refreshes; unmounts cancel state updates and dispose listeners/channels. Background refreshes retain the current content until a successful response; failed reads clear data and surface a retry. Event details now include their real details, perks and poster gallery. Dashboard announcements use the live table.

The existing notes use `/api/files/notes_bucket/...` backed by R2, not migrated Supabase objects. The new same-origin file service verifies the SDK user, active canonical Mentron enrollment, and a visible note row using the caller's JWT and existing RLS before fetching R2. It has no service-role database key, anonymous access, permissive CORS, or public storage URLs. Responses are private/no-store. The browser fetches with its session header and creates a temporary document link, revoked when its dialog closes. Storage credentials remain server-only in ignored local configuration and are absent from the client build. A production Node entry point serves the built website and the same file handler; runtime storage settings and public hosting remain deployment work.

Read-only R2 metadata verification checked all 178 distinct note files: 176 exist and 2 are missing. The missing legacy links affect two Foundation of Computing entries in Year 1 / S2 / Group B / PYQ - Web Design: `1776747307342-FOC_-_PYQ.pdf` and `1776747496808-FOC_-_PREDICTED.pdf`. Their records were preserved and replacement links were requested. Local original project files did not contain replacement PDFs. The full audit report remains in ignored `.tools/note-file-audit.json`.

A real module PDF was retrieved through authenticated access; the document dialog reached View document without an error. Automated browser controls blocked opening the temporary blob navigation, so the final PDF-tab visual check must be performed manually. No blocked navigation was retried through another browser or indirect mechanism. Browser checks also confirmed 7 PYQs and the custom Electronics Notes folder, browser-back context, the 247-result all-notes library, a temporary saved note appearing in Saved notes (then removed), and all 9 events including a real poster/detail gallery. No event registration, payment, application, publication, or attendance record was created.

18 website tests cover existing access/domain/upload rules, hierarchy scoping and virtual folders, Realtime invalidation/cleanup, and HTTP file authorization/path traversal/private headers. All pass. The production build passes. Dependency advisories for nanoid/source-map-js were fixed compatibly; the install audit reports zero vulnerabilities. Earlier native build/test results remain historical; this pass changes the website and its file service only. No database migrations or original-app source edits were performed.

The user subsequently confirmed no replacement links are available and requested a missing-file report instead. The report is [MISSING_NOTE_FILES.md](MISSING_NOTE_FILES.md); no file restoration is pending for this request. Global Python search returned 44 backend results over two pages (24 + 20) with zero duplicate IDs. The two original missing PDFs remain documented rather than replaced or removed.
