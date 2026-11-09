# TelePakt.pl

Polish anti-spam / legal-protection platform (Art. 398 PKE, GDPR): in-call assistant scripts, UKE/UODO complaint generator, call recordings with zero-storage deletion, community number reviews, Twilio SMS objections, PWA + Capacitor Android overlay app.

Originally built in Google AI Studio (Gemini); now maintained with Claude Code. Remote: `https://github.com/matlix/TelePakt` (branch `main`).

## Layout
- `src/` – React 19 + TypeScript + Tailwind 4 SPA (Vite). `App.tsx` is the root; `components/` holds large feature modules (PublicWebsite, AdminPanelHub, InCallSimulator, TelePaktMobileApp...), `services/` (Firebase auth, referral, Twilio SMS, spam DB, native overlay bridge), `data/` static content (legal scripts/docs, use cases).
- `backend/` – Django 5 + DRF. Project `telepakt_project`, single app `telephony` (models: LegalScript, CallLog, UkeComplaint, CustomerReview, IntegrationCredential, InAppPurchaseReceipt). Endpoints under `/api/telephony/`: conference-bridge, play-formula, recording-callback, zero-storage-delete, reviews, verify-purchase, health.
- `android/` + `capacitor.config.ts` – Capacitor Android wrapper; `scripts/package-apk.js`.
- `deploy_workflows/workflows/` – GitHub Actions templates (ci, build-apk, deploy-render); NOT active until moved to `.github/workflows/`.
- `render.yaml` – Render blueprint: static frontend `telepakt-web`, Python API `telepakt-api` (frankfurt), Postgres `telepakt-db`.
- Auth/data on the frontend is Firebase (`firebase-applet-config.json`, `firestore.rules`).

## Commands
Frontend (Node 20+): `npm install`, `npm run dev` (port 3000), `npm run lint` (tsc), `npm run build`.
Backend: use the venv at `../.venv`; `cd backend && ../../.venv/Scripts/python manage.py check|migrate|runserver`. Set `DJANGO_DEBUG=True` locally (otherwise SSL redirect is forced).

## Deploy
Render builds from GitHub `main`: backend via `backend/build.sh` (pip install, collectstatic, migrate). Pushing to `main` likely triggers production/preprod deploys – confirm before pushing.
Secrets (Twilio SID/token, DJANGO_SECRET_KEY) live in the Render dashboard, never in git. `.env*` is gitignored.

## Recent fixes (Nov 2026)
- APK: `public/telepakt.apk` was a fake zip -> "error while parsing". Now a real Gradle build (`npm run build:apk`, needs JDK 21 + Android SDK). Also fixed Kotlin `@Permission(alias=...)` compile error and switched the overlay foreground service to `specialUse` (`phoneCall` type crashes on Android 14 without MANAGE_OWN_CALLS).
- Backend: `telephony` had NO migrations (tables were never created on Render) -> added `0001_initial`. Twilio webhooks now verify `X-Twilio-Signature`; `DJANGO_SECRET_KEY` is required in prod; IAP receipts are no longer auto-verified; input validation + throttling on reviews; `STORAGES` setting; 14 tests.
- Workflows moved to `.github/workflows` (ci runs lint/build/Django tests; build-apk is manual).
- Expo was considered and rejected: the app is Capacitor + native Kotlin overlay; Expo would mean a rewrite and wouldn't have shown the cause.

## Known issues / TODO
- IAP store verification, zero-storage-delete auth, plaintext `IntegrationCredential.secret_value` (see backend/README.md).
- Components are huge (PublicWebsite 126 KB, AdminPanelHub 90 KB); main JS bundle 1.8 MB - needs code splitting.
- `data/pythonProjectFiles.ts` embeds a stale copy of the Python project as strings.
- APK is debug-signed; set up a release keystore (kept out of git) before Play Store.
- Windows PowerShell shows Polish text as mojibake; files are valid UTF-8.