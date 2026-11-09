/**
 * Buduje PRAWDZIWY, instalowalny plik APK (Capacitor + Gradle) i kopiuje go do
 * `public/telepakt.apk`, skąd strona (Render static site) serwuje go pod /telepakt.apk.
 *
 * Wymagania: JDK 21 (JAVA_HOME), Android SDK (ANDROID_HOME) - Gradle dociągnie brakujące
 * platformy, jeśli licencje są zaakceptowane.
 *
 * Uruchomienie:  npm run build:apk
 *
 * Poprzednia wersja tego skryptu składała "APK" ręcznie z JSZip (atrapa classes.dex,
 * tekstowy manifest, fałszywy podpis) - Android odrzucał taki plik błędem
 * "problem z analizą pakietu" ("error while parsing the package").
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const androidDir = path.join(root, 'android');
const publicApk = path.join(root, 'public', 'telepakt.apk');
const builtApk = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit', env: process.env });

// 1. Frontend -> dist -> android/app/src/main/assets/public
run('npm run build');
run('npx cap sync android');
// Poprzedni public/telepakt.apk został skopiowany do dist/ - nie może wylądować wewnątrz nowego APK.
fs.rmSync(path.join(androidDir, 'app', 'src', 'main', 'assets', 'public', 'telepakt.apk'), { force: true });

// 2. Gradle (debug podpisany kluczem debug => instalowalny przez sideload)
const gradlew = process.platform === 'win32' ? '.\\gradlew.bat' : './gradlew';
run(`${gradlew} assembleDebug --no-daemon`, androidDir);

// 3. Publikacja do public/
fs.copyFileSync(builtApk, publicApk);
console.log(`\nGotowe: ${publicApk} (${(fs.statSync(publicApk).size / 1048576).toFixed(1)} MB)`);
