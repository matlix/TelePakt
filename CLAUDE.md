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

## Known issues / TODO
- `settings.py` has an insecure fallback `SECRET_KEY`; fail hard when unset in production.
- `STATICFILES_STORAGE` is deprecated in Django 5.1+ (use `STORAGES`).
- `package.json` name is still `react-example`; `.env.example` is AI Studio boilerplate; `@google/genai` dependency is a Gemini leftover.
- Several components are huge (PublicWebsite 126 KB, AdminPanelHub 90 KB); main JS bundle is 1.8 MB – needs code splitting.
- README/render.yaml show mojibake (UTF-8 mis-decoded) in Polish text; re-save as UTF-8.
- `data/pythonProjectFiles.ts` embeds a copy of the Python project as strings – may drift from `backend/`.
- README badge points to `matlix/telepakt` (lowercase), repo is `matlix/TelePakt`.
