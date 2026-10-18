# Mentron+

Mentron+ brings together Mentron (study resources and projects) and mlynq (events, attendance, and certificates). The website and Flutter application use the existing **iste-admin** Supabase project and its canonical `public.profiles` accounts.

Current implementation and release limits: [Live integration](docs/LIVE_INTEGRATION.md). Earlier phase reports below are historical design checkpoints.

Website deployment and acceptance: [Release guide](docs/RELEASE.md). Delivery is a separate `release/mentron-plus` branch in `ISTE-SCTCE/mentron_new`, with hosting root `mentron-plus/web`.

- [Phase 1 report](docs/PHASE_1_REPORT.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Original audit](docs/PHASE_0_AUDIT.md)
- [Source inventory](docs/SOURCE_INVENTORY.md)
- [Design handoff](docs/ASTRA_HANDOFF.md)

## Run the website

Use Node 24, matching `.nvmrc`, CI and the Docker runtime.

```sh
cd web
npm install
npm run dev -- --port 4173
```

Copy `web/.env.example` to `web/.env.local` and set the project URL and publishable key. Open http://127.0.0.1:4173. Build with `npm run build`. Account and product records are live; bookmarks, recently opened resources, and world preference are local to the browser. Private recent-resource and bookmark entries clear on sign-out. Never place a service-role or secret key in either client.

## Run Flutter

Validated with Flutter 3.44.3 / Dart 3.12.2.

```sh
cd mobile
flutter pub get
flutter analyze
flutter test
flutter run --dart-define-from-file=env.local.json
```

Configure `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `AUTH_REDIRECT_URL` in the ignored `mobile/env.local.json`. Android and iOS scaffolds are included; release signing and native device verification are pending. `web/` is the separate responsive website. The Flutter client has live authentication and browsing; its complete feature parity remains pending.

All new work lives in this folder. Original application sources remain read-only references. Two explicitly reviewed and authorized access/QR/payment migrations were applied to iste-admin on 18 October 2026. No public deployment or one-time user import was performed.

Landing routes: `#/landing` (shared), `#/learn-landing`, and `#/campus-landing`. Login routes: `#/mentron-login` and `#/mlynq-login`. Both share the same real account session. Private routes require an active account.

Latest website branding and login update: [Mentron+ brand and login notes](docs/BRAND_AND_LOGIN.md).

## Authenticated note files

The existing note PDFs live in R2, while note metadata and access rules live in the shared iste-admin backend. Set the server-only `R2_*` variables shown in `web/.env.example` in the ignored `web/.env.local` for local work, and as runtime secrets on the hosting server. Never use a `VITE_` prefix for storage credentials. Vite development and preview include the authenticated file endpoint.

For production, run `npm run build` followed by `npm start` in `web/`. The Node server serves the website and `/api/files/notes_bucket/...` on the same origin. It validates the signed-in user, active Mentron enrollment, and note visibility under the caller's database policies before streaming a private file. A static-only host needs this API service behind the same origin; uploading only `dist/` does not provide the note file endpoint. The server binds to `127.0.0.1:4173` by default; configure `HOST` and `PORT` for the deployment environment.

The notes browser preserves year → semester → group/department → subject → PYQ/video/custom folder → resources. Breadcrumbs and browser history retain each selection. Published content revalidates through existing Realtime tables; other collections refresh on resume/reconnect and every minute while the tab is visible. Saved notes and recent history remain local to the browser.
