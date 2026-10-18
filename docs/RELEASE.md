# Mentron+ website release candidate

18 October 2026 · Node 24 · shared backend: iste-admin.

The release website is at the repository root on `main`. The old application files have been removed from the current tree and remain recoverable from Git history. No custom hosting root directory is needed.

## Replace the existing website

For Vercel, select the `main` branch, leave Root Directory empty (repository root), Framework Preset to Vite, Install Command to `npm ci`, Build Command to `npm run build`, and Output Directory to `dist`. The included `vercel.json` and `api/files/[...path].mjs` supply the authenticated note endpoint. Keep the API function: a static-only upload of `dist` cannot open private R2 notes. Hash routes start at `/#/landing`; login is `/#/mentron-login` or `/#/mlynq-login`.

Set the two build/runtime variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to the selected iste-admin project. The new environment names differ from the old Next.js `NEXT_PUBLIC_*` names. Configure `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_BUCKET_NAME` as server-only runtime secrets. Values already exist locally but are deliberately excluded from Git. Never prefix an R2 secret with `VITE_`. Use the same Supabase project for build and runtime.

A Node/Docker host is also supported: build with `npm ci && npm run build`, then `npm start`. Set `HOST=0.0.0.0`, the hosting port, and `PUBLIC_ORIGIN` to the HTTPS origin. The supplied Dockerfile builds and runs as a nonroot user; only the public Supabase values are build arguments, and storage credentials are runtime environment values. `/healthz` checks process availability, not external backend availability.

Before switching the public domain, add the exact origin and callback URLs to Supabase Auth's redirect allowlist. This app uses `/?world=learn&flow=confirm`, `/?world=campus&flow=confirm` and matching `flow=recovery` callbacks. Test signup confirmation and password recovery with a mailbox you control. Custom SMTP, its rate limit, and DNS/delivery must be verified by the hosting/backend owner; no email credentials were supplied to this task. See [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) and [SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp).

## Security changes and compatibility

Codex Security Standard audit `ce65f81f-6b52-4b6f-adf0-0bcfbf6814b9` completed with two medium findings: forged initial forum-answer counters and public certificate object access. Website executable source, server, tests and included migrations were reviewed; native demo/platform and all inherited ISTE database procedures were not exhaustively audited. This is not a certification of the entire shared platform.

The user explicitly approved both fixes, including the old certificate-link impact. Migration `20261018144808_mentronplus_release_privacy_and_forum_guards.sql` was applied to iste-admin. Both certificate buckets are now private; object access requires an active owner or manager. Anonymous object SELECT returned zero rows, while an active certificate owner's request returned its object. No existing certificate/note records or files were removed. Existing signed links may remain valid until expiry, and downloaded copies cannot be revoked.

The new clients sign the actual bucket named by an explicit stored certificate URL before using a legacy bare-path fallback. Older ISTE viewers that directly open public certificate URLs must be updated to request signed URLs. The old issuer may still store a public-shaped URL as a reference, but it no longer grants public file access. This compatibility impact was accepted before applying the change.

Production responses add CSP, frame denial, no-referrer, nosniff and camera-only permissions. Note responses remain private/no-store. Hidden files, source maps and unknown API routes are denied. Startup/build checks reject missing required configuration; the browser build is checked for storage and privileged credential literals. The common landing uses original SVG grain/tread textures; reference-only third-party textures are not shipped.

## Verification and release boundary

Run `npm test`, `npm run build`, and `npm run check:release -- --runtime` from the repository root. Tests include an isolated PostgreSQL database that demonstrates the original forged-counter path, applies the migration twice, rejects forged values, enforces private owner/other-user/anonymous/inactive access, preserves manager operations, and covers malformed/encoded references. HTTP tests cover file authorization, private caching, headers and static-file denial. These tests create no live orders, attendance, applications or publications.

Final local result: 21 tests passed; production build and all seven release checks passed on Node 24.19.0. The dependency install audit reported zero vulnerabilities. The main bundle has Vite's 500 KB advisory (about 149 KB compressed); it is an advisory, not a failed check. Production browser inspection restored the real account and original notes hierarchy with no console errors. Hosted Vercel/Docker deployment itself has not been executed in this task.

Public-domain email delivery, a real coordinator scan, controlled receipt verification/delivery, and a real project application/review still need deployment acceptance. The hosting switch is left to the user as requested; no public domain was changed. The two unavailable legacy PDFs remain in [MISSING_NOTE_FILES.md](MISSING_NOTE_FILES.md), with records preserved. The GATE library is explicitly unavailable because the selected backend has no GATE data. Saved/recent resources are device-local. Native signed binaries, physical-device acceptance and full native parity are outside this website release.

The shared backend still has inherited advisor warnings (mutable search paths, broadly executable definer functions, and disabled leaked-password protection). They were not bulk-altered because other ISTE products depend on that backend. A wider review is needed before claiming the whole backend is fully audited. [Function search-path guidance](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable).

Rollback of the website is the hosting provider's previous deployment or the previous main branch. Do not reopen certificate buckets as an automatic rollback: that would restore the privacy exposure. Keep the security migration and restore a compatible signed-link client instead.
