# TelePakt.pl

Polish anti-spam / legal-protection platform (Art. 398 PKE, GDPR): in-call assistant scripts, UKE/UODO complaint generator, call recordings with zero-storage deletion, community number reviews, Twilio SMS objections, PWA + Capacitor Android overlay app.

Originally built in Google AI Studio (Gemini); now maintained with Claude Code. Remote: `https://github.com/matlix/TelePakt` (branch `main`).

## Layout
- `src/` – React 19 + TypeScript + Tailwind 4 SPA (Vite). `App.tsx` picks one of three views: **website** (`PublicWebsite`, default on telepakt.pl), **app** (`AccountApp`: login/registration, profile, settings - nothing else; this is what the Android APK and the PWA show, and it never links to the website) and **studio** (dev-only tools in `StudioApp.tsx`: open `/?studio=1` under `npm run dev`; excluded from the production bundle via `import.meta.env.DEV`, no password in code). `services/` (auth API client, Twilio SMS, spam list, native overlay bridge), `data/` static content, `config.ts` (`VITE_ASSISTANT_NUMBER`).
- `TelePaktMobileApp.tsx` and the other old app screens are no longer used by the production app (kept in git history/for the studio).
- `backend/` – Django 5 + DRF. Project `telepakt_project`, single app `telephony` (models: LegalScript, CallLog, UkeComplaint, CustomerReview, IntegrationCredential, InAppPurchaseReceipt). Endpoints under `/api/telephony/`: conference-bridge, play-formula, recording-callback, zero-storage-delete, reviews, verify-purchase, health.
- `android/` + `capacitor.config.ts` – Capacitor Android wrapper; `scripts/package-apk.js`.
- `deploy_workflows/workflows/` – GitHub Actions templates (ci, build-apk, deploy-render); NOT active until moved to `.github/workflows/`.
- `render.yaml` – Render blueprint: static frontend `telepakt-web`, Python API `telepakt-api` (frankfurt), Postgres `telepakt-db`.
- Accounts live in our own DB (`backend/accounts`, endpoints `/api/auth/`: register, login, logout, me [GET/PATCH/DELETE], password-reset + confirm). Email+password only; session = Bearer token (only its SHA-256 is stored; revoked on logout/password reset). Frontend: `src/services/authService.ts`. Firebase was removed entirely (Nov 2026); Google/Apple sign-in no longer exist. Password-reset codes are e-mailed: set `EMAIL_HOST*` env vars on Render, otherwise they only appear in the server log. `python manage.py create_test_users` makes `test1@telepakt.test`... with random passwords (refuses outside DEBUG without `--force`).

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

## Admin panel (Nov 2026)
- Django admin themed with django-unfold (pinned 0.96.0, the newest that supports Django <5.2; `unfold` must precede `django.contrib.admin`). Layout ported from the `kupus` project: dashboard `templates/admin/index.html` + generic stats page `templates/admin/stats/page.html`, data in `telepakt_project/admin_stats.py` (periods, bucketed series, chart specs), URLs `/admin/stats/{calls,users,feedback}/`. Chart.js is vendored in `backend/static/vendor/` (no CDN). Sidebar lives in `settings.UNFOLD`.
- `telephony/tests_admin.py` smoke-tests every admin page; tests override STORAGES because there is no collectstatic manifest in tests.

## Python version on Render
- Render defaults to the newest Python (3.14.x at the time). Django 5.1 breaks on 3.14 (`copy(Context)` -> `'super' object has no attribute 'dicts'`), which made EVERY admin page return 500 (incl. login) while local 3.12 worked. Pinned via `.python-version` (3.12.8) and `PYTHON_VERSION` in render.yaml; `backend/build.sh` prints versions and fails the build on a bad Python/Django pair; `PythonCompatTests` guards the context copy. If you move to Python 3.14, upgrade Django to >=5.2.8 first.

## Recording the whole conversation (3-way, Nov 2026, untested on a real call)
- Android cannot record call audio, so the overlay button "Nagrywaj całą rozmowę" fetches the TelePakt number (`/forwarding-info/`), opens the dialer (`ACTION_DIAL`); the user calls it and taps Merge. The provider webhook sees the user's own phone as `From` (matches `Profile.phone_protected`), so the bridge records silently (`beep=false`, `waitUrl=""`, `OWN_CALL_LABEL`) and the CallLog belongs to the user. Does not need forwarding.
- App tab "Nagrania" lists/plays/deletes recordings via `/recordings/`, `/recordings/<sid>/audio/` (server streams from the provider; credentials only go to twilio.com / telnyx.com), `/zero-storage-delete/`.
- Unverified assumptions: the empty `waitUrl` really yields silence, and Telnyx RecordingUrl works with `.mp3` + Bearer. Check with a real call first.

## Voice messages, sliders, share-to-cloud (Nov 2026, untested on a real call)
- Per-user `VoiceMessage` (text read by Polly TTS or an own WAV recording stored in the DB) + `Profile.tts_voice/tts_rate`. API: `/voice-settings/`, `/messages/`, `/messages/<id>/audio/` (WAV mono 16-bit, <=60 s/2 MB), `/messages/<id>/speak/`. Defaults are seeded on first list (no recording notice, no threats).
- The overlay builds one slider per active message (max 4). Sliding calls `/speak/`, which finds the user's live own-call (3-way) and asks the provider to play `announce/<token>/` into the conference via participant `AnnounceUrl` (Twilio + Telnyx TeXML). Works only while the call is merged into TelePakt; otherwise the real reason is shown in a toast.
- Own voice: the app records with MediaRecorder and converts to 8 kHz WAV in the browser (`src/utils/wavRecorder.ts`) because providers cannot play webm. Needs RECORD_AUDIO; WebView mic permission handling by Capacitor is unverified.
- Cloud: the 'Chmura' button on a recording opens the Android share sheet (Capacitor Share + Filesystem). Automatic upload to Google Drive/Dropbox is NOT built (needs OAuth app registrations).
- Unverified: that audio played to the TelePakt leg is heard by the other party through the carrier conference, and that Telnyx accepts `Polly.*` voices.

## Slider modes: forwarded call (B) and 3-way (A) (Nov 2026, untested on real calls)
- The overlay answer sliders pick the mode from the phone state. RINGING: `/messages/<id>/arm/` stores an `ArmedMessage` (120 s), then `TelecomManager.endCall()` rejects the call; the carrier's forward-on-busy (code in Settings) sends it to the TelePakt number; the bridge (`conference-bridge`) recognises the forwarded call (ForwardedFrom matches a profile, or a fresh arming exists) and plays the message (own WAV via `<Play>` or Polly `<Say>`) then hangs up (CallLog `formula_played`). OFFHOOK: the user merges a 3-way call with the TelePakt number (button) and the slider calls `/messages/<id>/speak/` (provider participant `AnnounceUrl`).
- The old 'play through the phone speaker' path was removed: Android's echo cancellation silences it for the other party (confirmed on the owner's phone). Needs ANSWER_PHONE_CALLS (alias `phone`). Forwarding UI and Nagrania tab are on again (`FEATURES`).
- Unverified: carriers passing ForwardedFrom (fallback: single fresh arming), forward-on-busy triggered by a reject, Telnyx accepting `Polly.*` voices in `<Say>`.

## Known issues / TODO
- IAP store verification (verify-purchase is still unauthenticated), plaintext `IntegrationCredential.secret_value` (see backend/README.md).
- Components are huge (PublicWebsite 126 KB, AdminPanelHub 90 KB); main JS bundle 1.8 MB - needs code splitting.
- `data/pythonProjectFiles.ts` embeds a stale copy of the Python project as strings.
- APK is debug-signed; set up a release keystore (kept out of git) before Play Store.
- Windows PowerShell shows Polish text as mojibake; files are valid UTF-8.
- Test the APK on the Android emulator (AVD `Pixel_10`; needs free disk space): `adb install -r public/telepakt.apk`.