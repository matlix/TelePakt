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
- Android only (owner, Nov 21 2026: iPhone/iOS and the Apple App Store are out for now; no iOS copy on the website/app). Payments only through store billing (Google Play, Galaxy Store, AppGallery) - no BLIK/card/direct payment copy.
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

## Sliders speak through a 3-way call (Nov 2026, untested on real calls)
- Only the 3-way mode exists. The overlay (Kotlin) shows, while a call is active, the red button "Połącz z TelePakt (3-way)" (dials the TelePakt number directly with CALL_PHONE; merging the calls stays a manual tap because Android has no merge API for normal apps) and a "Wybierz odpowiedź" slider that reveals one slider per active `VoiceMessage`. Sliding calls `/messages/<id>/speak/`, which finds the user's live own-call and asks the provider to play `announce/<token>/` into the conference (participant `AnnounceUrl`). While the phone is only ringing the overlay shows a hint.
- Removed on purpose (owner, 2026-11-11): the "reject the ringing call -> forward to TelePakt -> TelePakt plays the message" mode (ArmedMessage, /arm/, forwarded-call playback, forwarding settings, ANSWER_PHONE_CALLS) and the speaker playback (Android echo cancellation silences it for the other party). Re-adding the forwarding mode is described in git history (commits 99ff47f, 7e01f8d).
- Unverified: that audio played to the TelePakt leg is heard by the other party through the carrier conference, and that Telnyx accepts `Polly.*` voices in conference announcements.

## Nov 12 2026 additions (untested on a real call unless noted)
- Announce into the Telnyx conference: lookup is by FriendlyName WITHOUT the Status filter (single-leg 3-way conference may be `init`); a ReadTimeout on the AnnounceUrl POST is treated as "probably playing" (Telnyx fetched the message URL in the same second in prod logs). The "no conference" error lists what Telnyx sees.
- Profil: "Wykryj numer z telefonu" reads the SIM number(s) (READ_PHONE_NUMBERS, SubscriptionManager; may be empty on many carriers). Backend still stores ONE protected number - with dual SIM a call from the other SIM is not recognised as an own call.
- Carrier check: after the phone permission is granted the app reads CarrierConfig `support_conference_call_bool` per SIM, reports it to `POST /api/auth/carrier-report/` (Profile.conference_supported/carrier_note, visible in admin) and shows an apology card when no SIM allows 3-way. The copy promises a refund; automatic refunds are NOT built (no store billing yet; later: Google Play refund API).
- Auto-merge: optional AccessibilityService `MergeAccessibilityService` (Settings row "Automatyczne scalanie rozmowy"). Armed for 90 s only after tapping "Połącz z TelePakt (3-way)"; looks only at the dialer's windows, clicks "Scal/Merge", and if not visible opens the "More/Więcej/Show more" menu (retries every ~6 s, closing the menu with Back). Verified on the emulator's Google Dialer up to opening the menu; the final "Merge" click is unverified (emulator cannot create a second call). Settings shows the last button labels it saw ("Diagnostyka") to tune matching to a user's dialer. Android 13 sideload needs "Allow restricted settings"; Google Play may reject accessibility use for this purpose.
- Komunikaty: fields labelled (Nazwa na suwaku / Rodzaj komunikatu / Treść komunikatu); per message `use_recording` switch keeps the own recording while letting the user choose recording or AI voice (`plays_audio` drives the overlay); default texts shortened without greetings (migration 0006 rewrites only unedited old defaults).

## Default-dialer mode (Nov 21 2026; incoming/outgoing UI verified on emulator, 3-way sequence NOT verified on a real call)
- TelePakt can be set as the default Phone app (ROLE_DIALER; banner "Ustaw TelePakt jako Telefon" + Settings row). Code in `android/.../dialer/`: `TelePaktInCallService` (system binds it; notification with full-screen intent + Odbierz/Odrzuć), `InCallActivity` (programmatic UI: answer/reject, mute, speaker, hold, DTMF keypad, add call, merge, Bluetooth, proximity wake lock), `DialerActivity` (dial pad + recents from CallLog + `tel:` intents), `CallManager` (call state + the one-tap sequence), `TelePaktApi`.
- One tap on a message in the call screen: `CallManager.startThreeWay` fetches the TelePakt number (`/forwarding-info/`), `TelecomManager.placeCall`, waits for ACTIVE, merges like AOSP Dialer (`conference(conferenceableCalls[0])` else `mergeConference()`, retried every 4 s up to 4 times), then POSTs `/messages/<id>/speak/` (retries on 409). Status/error text is shown in the TelePakt panel of the call screen.
- In this mode the old overlay (`CallReceiver`) does nothing; the overlay + AccessibilityService remain as the fallback for users who keep their own Phone app. Emergency numbers go through the normal `placeCall`.
- Not built: contacts browser, voicemail, call blocking, SMS, video calls. Unverified: real carrier merge, Bluetooth routing, lock-screen behaviour on real phones, other makers' quirks.

## Dialer features added Nov 21 2026 (emulator-tested; community data needs deploy + real use)
- Blocklist: `dialer/Blocklist.kt` uses the system BlockedNumberContract (only the default dialer may write); blocked numbers never reach the app. UI: "Zablokuj i zgłoś jako niechciany" on the call screen, long-press on a recent call (block/unblock/report). Verified on the emulator (blocked number never reaches Telecom).
- Community reports: `NumberReport` model (migration 0007), `GET /api/telephony/number-reputation/?number=` and `POST /api/telephony/report-number/` (auth required, one report per user+number, 100/day cap). A warning is shown ONLY when >=3 distinct users reported the number (`REPORT_THRESHOLD`); absence of reports is never shown as 'safe'. Reported third-party numbers are personal data - mention in the privacy policy before relying on it.
- Missed-call notification with "Oddzwoń" (the system one only exists for the stock dialer); call screen is brought to the front when a call is answered elsewhere (Bluetooth/notification); recents refresh on resume.
- 3-way failure handling: the disconnect cause from Telecom is shown in the TelePakt panel (e.g. "rozłączona przez TelePakt/sieć (NORMAL)" = the remote side hung up) and the held original call is resumed automatically.
- Emulator quirk: calls accepted via `adb emu gsm accept` hang up by themselves after ~6-10 s (also with the stock dialer), and a second `gsm call` replaces the first, so merge/call-waiting cannot be tested there.

## Nov 22 2026: credit gating, tester account, phone basics (emulator-tested except the server side)
- Credit: `Profile.credit_seconds` + env `TELEPAKT_REQUIRE_CREDIT=1` (default OFF; turn on only when top-ups exist). With it on and 0 credit (testers exempt): `/forwarding-info/`, `/start-recording/`, `/messages/<id>/speak/` return 402 `no_credit`, the bridge webhook says "Brak środków" and hangs up, `/me` has `telephonyEnabled/creditMinutes`, the call screen shows a grey 'functions off' note and the app is a plain phone (dialing, contacts, blocking, voicemail keep working). Own 3-way calls deduct recording seconds in the recording callback (once per call, never below 0). Top-ups: admin edits credit_seconds (store billing later).
- Tester account (`Profile.is_tester`, set in admin): app installs error capture + screen log (`src/services/diagnostics.ts`) -> `POST /api/auth/client-log/` (403 for normal accounts) -> admin 'Dziennik klienta' + server log lines `CLIENT[...]`. Settings shows 'Tryb testowy': autotest (API checks + native `runNativeSelfTest`: default dialer, permissions, SIMs, blocklist round trip, contacts/call log reads, own logcat), balance check (`GET /api/telephony/provider-balance/`, Telnyx `GET /v2/balance`, Twilio balance; admin action 'Sprawdź saldo'), and a paid 'Test połączenia' (`CallManager.startSoloTest`: one call to TelePakt + one message, <=3/day per phone, refused if the balance does not cover `ESTIMATED_TEST_COST_USD`=0.50 x2 - an assumption, NOT a Telnyx price; no Poland rate was found).
- Phone basics: contacts + favourites (`ContactsActivity`), blocklist screen with earlier-call counts (`BlocklistActivity`; only the user blocks, TelePakt never auto-blocks), voicemail button, quick SMS replies (opens the SMS app with text, no SMS permission), dual-SIM chooser + same SIM for the TelePakt leg, quiet hours (unknown numbers ring silently via `silenceRinger`, nothing is rejected), warning before dialing foreign / 70x premium numbers not in contacts.
- UKE: Nagrania has 'Zawiadomienie UKE' = a text draft only. By owner's decision recordings are never published or attached by us: the user saves a copy (Chmura/e-mail) and attaches their own. Community reports are NOT tied to recordings.

## First-run setup wizard (Nov 22 2026)
- `src/components/SetupWizard.tsx`: full-screen, shown after login on Android until the required steps are done (phone access, default Phone app OR overlay mode, notifications); contacts and call log are recommended and skippable (`setup_skipped_v1` in localStorage). Each step has 'Po co to?', numbered 'Jak to włączyć', one action button, and after a refused request an 'Otwórz ustawienia TelePakt' fallback. State comes from the plugin's `getPermissionStates` (refreshes on focus and every 2 s because the WebView does not always report focus after system dialogs). Plugin: `getPermissionStates`, `requestPermissionGroup(contacts|calllog|notifications)`, `openAppSettings`.
- Finding: becoming the default Phone app grants READ_CONTACTS, READ_CALL_LOG and POST_NOTIFICATIONS automatically (flag GRANTED_BY_ROLE on the emulator), so on the recommended path the wizard ends after step 2. The refusal/manual-settings path and the overlay alternative were not exercised.

## Known issues / TODO
- IAP store verification (verify-purchase is still unauthenticated), plaintext `IntegrationCredential.secret_value` (see backend/README.md).
- Components are huge (PublicWebsite 126 KB, AdminPanelHub 90 KB); main JS bundle 1.8 MB - needs code splitting.
- `data/pythonProjectFiles.ts` embeds a stale copy of the Python project as strings.
- APK is debug-signed; set up a release keystore (kept out of git) before Play Store.
- Windows PowerShell shows Polish text as mojibake; files are valid UTF-8.
- Test the APK on the Android emulator (AVD `Pixel_10`; needs free disk space): `adb install -r public/telepakt.apk`.