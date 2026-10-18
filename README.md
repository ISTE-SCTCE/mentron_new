# Mentron+

Mentron+ brings together Mentron study resources/projects and mlynq events, attendance and certificates. This repository contains the release website at its root.

## Deploy

Use branch **main**, framework **Vite**, Node **24**, and the **repository root** (leave the custom root directory empty).

- Install: `npm ci`
- Build: `npm run build`
- Output: `dist`

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the shared iste-admin backend at build and runtime. Set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_BUCKET_NAME` as server-only runtime secrets. The old `NEXT_PUBLIC_*` names do not configure this site. Never commit secrets or prefix R2 credentials with `VITE_`.

Vercel uses the included `vercel.json` and authenticated `api/files/[...path].mjs` function. Do not deploy only the static files: private note documents require that function. Node/Docker deployments can use `npm start`; see the [release guide](docs/RELEASE.md) for configuration, Auth callbacks, compatibility, acceptance checks and rollback.

## Run locally

Copy `.env.example` to `.env.local`, enter configuration privately, then run `npm ci` and `npm run dev -- --port 4173`.

## Verify

Run `npm test`, `npm run build`, and `npm run check:release`. Add `-- --runtime` to the last command when server secrets are configured. Tests use local HTTP fixtures and isolated PostgreSQL; they do not create live user records.

The three reviewed Supabase migrations are included for history and verification. They have already been applied to iste-admin with explicit approval; deployment does not rerun them. Two unavailable legacy PDFs are documented in [the missing-file report](docs/MISSING_NOTE_FILES.md).

The old website and mobile applications are no longer in the current tree. They remain recoverable from earlier Git commits and existing branches. Public email, payment and coordinator acceptance must still be verified on the deployed origin; a full audit of all inherited ISTE backend procedures is not claimed.
