import { API_URL } from '../config';
import { authService } from './authService';
import { NativeOverlayBridge } from './nativeOverlayBridge';

/**
 * Diagnostyka konta TESTOWEGO (Profile.is_tester ustawia admin): dziennik ekranów, użycia i błędów wysyłany na serwer
 * (admin > Dziennik klienta + log serwera) oraz autotest funkcji aplikacji. Zwykłe konta niczego nie wysyłają -
 * serwer odpowiada 403, a aplikacja w ogóle nie włącza tego modułu.
 */

type Level = 'info' | 'warn' | 'error';
interface LogEvent { level: Level; source: string; screen?: string; message: string; details?: string }
export interface StepResult { name: string; ok: boolean; detail: string }

let queue: LogEvent[] = [];
let installed = false;
let screenName = '';

async function flush(): Promise<void> {
  const token = authService.getToken();
  if (!token || queue.length === 0) return;
  const batch = queue.splice(0, 100);
  try {
    await authService.clientLog(batch);
  } catch (err) {
    queue = [...batch.slice(0, 50), ...queue].slice(0, 200);  // spróbujemy później; nie rośnie bez końca
    console.warn('client-log flush failed', err);
  }
}

export function logEvent(e: LogEvent): void {
  queue.push({ screen: screenName, ...e });
  if (queue.length >= 20) void flush();
}

export function setScreen(name: string): void {
  screenName = name;
  logEvent({ level: 'info', source: 'nav', message: `Ekran: ${name}` });
}

/** Włącza przechwytywanie błędów JS i okresową wysyłkę dziennika (tylko dla kont testowych). */
export function installTesterLogging(): void {
  if (installed) return;
  installed = true;
  window.addEventListener('error', ev => {
    logEvent({ level: 'error', source: 'js', message: String(ev.message).slice(0, 400), details: `${ev.filename}:${ev.lineno}:${ev.colno}\n${ev.error?.stack ?? ''}` });
  });
  window.addEventListener('unhandledrejection', ev => {
    const reason: any = ev.reason;
    logEvent({ level: 'error', source: 'js', message: `Nieobsłużone odrzucenie: ${String(reason?.message ?? reason).slice(0, 400)}`, details: String(reason?.stack ?? '') });
  });
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    logEvent({ level: 'error', source: 'console', message: args.map(a => (a instanceof Error ? a.message : String(a))).join(' ').slice(0, 400) });
  };
  window.setInterval(() => void flush(), 10000);
  logEvent({ level: 'info', source: 'app', message: 'Start dziennika konta testowego', details: navigator.userAgent });
}

async function api(path: string, method = 'GET'): Promise<{ status: number; body: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${authService.getToken() ?? ''}`, 'Content-Type': 'application/json' },
    body: method === 'POST' ? '{}' : undefined,
  });
  let body: any = null;
  try { body = await res.json(); } catch { /* odpowiedź bez JSON */ }
  return { status: res.status, body };
}

/** Autotest: kroki API + natywne; każdy wynik trafia na serwer. Niczego nie kosztuje (bez rozmów). */
export async function runSelfTest(onStep: (s: StepResult) => void): Promise<StepResult[]> {
  const results: StepResult[] = [];
  const rec = (name: string, ok: boolean, detail: string) => {
    const s = { name, ok, detail };
    results.push(s);
    onStep(s);
    logEvent({ level: ok ? 'info' : 'error', source: 'autotest', message: `${ok ? 'OK' : 'BŁĄD'}: ${name}`, details: detail });
  };
  const check = async (name: string, path: string, accept: number[] = [200], method = 'GET') => {
    try {
      const { status, body } = await api(path, method);
      const ok = accept.includes(status);
      rec(name, ok, `HTTP ${status}${body?.error ? ` - ${body.error}` : ''}`);
      return body;
    } catch (err: any) {
      rec(name, false, `wyjątek: ${err?.message ?? err}`);
      return null;
    }
  };

  rec('Przeglądarka / WebView', true, `${navigator.userAgent} | ${window.innerWidth}x${window.innerHeight}`);
  await check('Konto (me)', '/api/auth/me/');
  await check('Komunikaty (lista)', '/api/telephony/messages/');
  await check('Ustawienia głosu', '/api/telephony/voice-settings/');
  await check('Nagrania (lista)', '/api/telephony/recordings/');
  // 402 = brak środków (oczekiwane, gdy konto ich nie ma): to też poprawne działanie
  await check('Numer TelePakt (forwarding-info)', '/api/telephony/forwarding-info/', [200, 402]);
  await check('Reputacja numeru', '/api/telephony/number-reputation/?number=500123456');
  await check('Saldo dostawcy', '/api/telephony/provider-balance/');

  if (NativeOverlayBridge.isNative()) {
    try {
      const native = await NativeOverlayBridge.runNativeSelfTest();
      native.forEach(s => rec(s.name, s.ok, s.detail));
    } catch (err: any) {
      rec('Autotest natywny', false, `wyjątek: ${err?.message ?? err}`);
    }
    try {
      const log = await NativeOverlayBridge.getAppLog();
      logEvent({ level: 'info', source: 'native-log', message: 'Log aplikacji (logcat)', details: log });
    } catch (err: any) {
      logEvent({ level: 'warn', source: 'native-log', message: `Log aplikacji niedostępny: ${err?.message ?? err}` });
    }
  } else {
    rec('Część natywna', false, 'pominięta: to nie jest aplikacja na Androidzie');
  }
  logEvent({ level: 'info', source: 'screen', message: 'Tekst ekranu po autotestach', details: document.body.innerText.slice(0, 6000) });
  await flush();
  return results;
}

export interface Balance { provider: string; balance: number; currency: string; estimated_test_cost_usd: number; enough_for_full_test: boolean }

export async function fetchBalance(): Promise<Balance> {
  const { status, body } = await api('/api/telephony/provider-balance/');
  if (status !== 200) throw new Error(body?.error || `Saldo niedostępne (HTTP ${status})`);
  return body as Balance;
}

const LIVE_LIMIT_PER_DAY = 3;

function liveKey() { return `live_tests:${new Date().toISOString().slice(0, 10)}`; }

/**
 * Test połączenia z TelePakt: jedna rozmowa do TelePakt + odtworzenie komunikatu (ok. minuty u dostawcy).
 * Zabezpieczenia: najwyżej 3 testy dziennie na telefonie i odmowa, gdy saldo dostawcy nie pokrywa kosztu.
 */
export async function runLiveTest(): Promise<StepResult> {
  const finish = (ok: boolean, detail: string): StepResult => {
    logEvent({ level: ok ? 'info' : 'error', source: 'live-test', message: `Test połączenia: ${ok ? 'OK' : 'BŁĄD'}`, details: detail });
    void flush();
    return { name: 'Test połączenia z TelePakt', ok, detail };
  };
  let used = 0;
  try { used = Number(localStorage.getItem(liveKey()) || 0); } catch { /* brak pamięci lokalnej */ }
  if (used >= LIVE_LIMIT_PER_DAY) return finish(false, `Limit ${LIVE_LIMIT_PER_DAY} testów połączenia dziennie został wyczerpany.`);
  let balance: Balance;
  try {
    balance = await fetchBalance();
  } catch (err: any) {
    return finish(false, `Nie sprawdzono salda dostawcy, więc nie dzwonię: ${err.message}`);
  }
  if (!balance.enough_for_full_test) {
    return finish(false, `Saldo ${balance.provider}: ${balance.balance} ${balance.currency} nie pokrywa kosztu testu (szacunek ${balance.estimated_test_cost_usd} USD, wymagamy dwukrotności).`);
  }
  try { localStorage.setItem(liveKey(), String(used + 1)); } catch { /* ignoruj */ }
  await NativeOverlayBridge.startLiveTest();
  for (let i = 0; i < 55; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const res = await NativeOverlayBridge.getLiveTestResult();
    if (res.finished && res.result) return finish(res.result.ok, res.result.detail);
  }
  return finish(false, 'Brak wyniku testu po 110 s.');
}
