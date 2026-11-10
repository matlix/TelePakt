# TelePakt.pl

Polish anti-spam / legal-protection platform (Art. 398 PKE, GDPR): in-call assistant scripts, UKE/UODO complaint generator, call recordings with zero-storage deletion, community number reviews, Twilio SMS objections, PWA + Capacitor Android overlay app.

Originally built in Google AI Studio (Gemini); now maintained with Claude Code. Remote: `https://github.com/matlix/TelePakt` (branch `main`).

## Layout
- `src/` – React 19 + TypeScript + Tailwind 4 SPA (Vite). `App.tsx` picks one of three views: **website** (`PublicWebsite`, default on telepakt.pl), **app** (`AccountApp`: login/registration, profile, settings - nothing else; this is what the Android APK and the PWA show, and it never links to the website) and **studio** (dev-only tools in `StudioApp.tsx`: open `/?studio=1` under `npm run dev`; excluded from the production bundle via `import.meta.env.DEV`, no password in code). `services/` (Firebase auth, Twilio SMS, spam list, native overlay bridge), `data/` static content, `config.ts` (`VITE_ASSISTANT_NUMBER`).
- `TelePaktMobileApp.tsx` and the other old app screens are no longer used by the production app (kept in git history/for the studio).
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

## Product rules (decided with the owner, Nov 2026)
- Consumer focus. No claims about SHA-256 / 'accepted by courts' / '100% legal'; no threatening scripts (stalking, statute of limitations, fine threats).
- Payments only through store billing (Google Play, App Store, Galaxy Store, AppGallery) - no BLIK/card/direct payment copy.
- No sample data in the production client (no fake reviews, report counts, numbers). The 'check number' list starts empty; absence of a report is NOT shown as 'safe'.
- Assistant phone number comes from `VITE_ASSISTANT_NUMBER` (not set until Twilio exists).
- Penalties cite art. 444 + 446 PKE (not art. 445, which concerns data-protection duties).
- Recordings are deleted from Twilio after download (`erase_recording`) and after `RETENTION_DAYS`.

## Recent fixes (Nov 2026)
- APK: `public/telepakt.apk` was a fake zip -> "error while parsing". Now a real Gradle build (`npm run build:apk`, needs JDK 21 + Android SDK). Also fixed Kotlin `@Permission(alias=...)` compile error and switched the overlay foreground service to `specialUse` (`phoneCall` type crashes on Android 14 without MANAGE_OWN_CALLS).
- Backend: `telephony` had NO migrations (tables were never created on Render) -> added `0001_initial`. Twilio webhooks now verify `X-Twilio-Signature`; `DJANGO_SECRET_KEY` is required in prod; IAP receipts are no longer auto-verified; input validation + throttling on reviews; `STORAGES` setting; 14 tests.
- Workflows moved to `.github/workflows` (ci runs lint/build/Django tests; build-apk is manual).
- Expo was considered and rejected: the app is Capacitor + native Kotlin overlay; Expo would mean a rewrite and wouldn't have shown the cause.

## Telephony providers (Nov 2026, untested against real accounts)
- `backend/telephony/providers.py`: Twilio + Telnyx (TeXML) adapters; credentials entered in Django admin ("Dostawcy telefonii", secret Fernet-encrypted with a key derived from `DJANGO_SECRET_KEY`). Health checks run in a background thread from `/health/` every `PROVIDER_CHECK_INTERVAL` s (300); 2 failures -> `failing`, next provider by priority is used. Telnyx webhooks use `?provider=telnyx&token=...` (token shown in admin).
- Failover covers API actions and the number shown in the app (`/forwarding-info/`); the user's GSM forwarding code is fixed to one number, so after a switch they must re-enter the code.
- Silent recording: overlay button -> `/start-recording/` (looks up the call by `ForwardedFrom`). Telnyx needs `PlayBeep=false` (already set). No recording announcement anywhere by owner's decision.
- Overlay "Przekieruj do TelePakt" rejects the ringing call (`TelecomManager.endCall`, needs `ANSWER_PHONE_CALLS`) so the carrier's forward-on-busy sends it to the provider; carrier-dependent.

## Known issues / TODO
- IAP store verification, zero-storage-delete auth, plaintext `IntegrationCredential.secret_value` (see backend/README.md).
- Components are huge (PublicWebsite 126 KB, AdminPanelHub 90 KB); main JS bundle 1.8 MB - needs code splitting.
- `data/pythonProjectFiles.ts` embeds a stale copy of the Python project as strings.
- APK is debug-signed; set up a release keystore (kept out of git) before Play Store.
- Windows PowerShell shows Polish text as mojibake; files are valid UTF-8.
- Firebase: project is `nawiniesie-1486388636550` (AI Studio). Email/Password sign-in must be enabled in the console (Authentication > Sign-in method) or login/registration fail with `auth/operation-not-allowed`. After editing `firestore.rules` deploy them (`firebase deploy --only firestore:rules`): clients may no longer set their own paid plan.
- Test the APK on the Android emulator (AVD `Pixel_10`; needs free disk space): `adb install -r public/telepakt.apk`.