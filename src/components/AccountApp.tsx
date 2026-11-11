/**
 * Aplikacja TelePakt (Android / PWA) - celowo minimalna:
 *   1. logowanie i rejestracja (e-mail + hasło, konta na backendzie TelePakt),
 *   2. profil użytkownika,
 *   3. ustawienia (uprawnienia nakładki połączeń, dokumenty prawne, wylogowanie, usunięcie konta).
 *
 * Funkcja "tarczy" (nakładka z suwakiem nad przychodzącym połączeniem) działa natywnie
 * w systemie Android - ta aplikacja tylko zarządza kontem i uprawnieniami.
 * Nie ma tu żadnych odnośników do strony internetowej.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Cloud, Copy, Info, MessageSquare, Mic, Play, RefreshCw, ShieldAlert, PhoneForwarded, Eye, EyeOff, LogOut, Mail, Lock, Phone, Trash2, User, CheckCircle2, AlertCircle, ChevronRight, Settings } from 'lucide-react';
import { UserAccount } from '../types';
import { authService } from '../services/authService';
import { NativeOverlayBridge, OverlayStatus } from '../services/nativeOverlayBridge';
import { API_URL, FEATURES } from '../config';
import { recordingsService, RecordingItem } from '../services/recordingsService';
import { MessagesTab } from './MessagesTab';
import { LegalDocumentModal, LegalDocType } from './LegalDocumentModal';
import logoImage from '../assets/images/telepakt_logo_icon_1793197547893.jpg';

const APP_VERSION = '1.0.0';

/** Numer w formacie polskim: 9 cyfr, opcjonalnie z prefiksem +48. Zwraca null, jeśli niepoprawny. */
export function normalizePolishPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('48') && digits.length === 11 ? digits.slice(2) : digits;
  if (local.length !== 9) return null;
  return `+48 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}

const inputClass =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500';

function Logo({ size = 'w-20 h-20' }: { size?: string }) {
  return (
    <div className={`${size} rounded-3xl overflow-hidden border border-cyan-500/40 shadow-lg shadow-cyan-500/20 bg-slate-900 mx-auto`}>
      <img src={logoImage} alt="TelePakt" className="w-full h-full object-cover" />
    </div>
  );
}

/* ------------------------------------------------------------------ Logowanie / rejestracja */

function AuthScreen({ onLegal }: { onLegal: (doc: LegalDocType) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetStep, setResetStep] = useState<'none' | 'code'>('none');
  const [code, setCode] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (mode === 'register' && !accepted) {
      setError('Zaakceptuj Regulamin i Politykę Prywatności, aby założyć konto.');
      return;
    }
    setBusy(true);
    try {
      if (resetStep === 'code') {
        await authService.confirmPasswordReset(email, code, password);
        await authService.loginWithEmail(email, password);
      } else if (mode === 'register') await authService.registerWithEmail(name, email, password);
      else await authService.loginWithEmail(email, password);
    } catch (err: any) {
      setError(err.message || 'Wystąpił błąd. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setInfo(null);
    try {
      await authService.resetPassword(email);
      setResetStep('code');
      setPassword('');
      setInfo('Jeśli konto z tym adresem istnieje, wysłaliśmy 8-cyfrowy kod (ważny 15 minut). Wpisz go poniżej i ustaw nowe hasło.');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-5 py-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="text-center space-y-3">
          <Logo />
          <h1 className="text-2xl font-black text-white tracking-tight">
            TelePakt<span className="text-cyan-400">.pl</span>
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login' ? 'Zaloguj się do swojego konta.' : 'Załóż bezpłatne konto.'}
          </p>
        </div>

        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setInfo(null); setResetStep('none'); }}
              className={`py-2.5 rounded-xl transition-all ${
                mode === m ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              {m === 'login' ? 'Logowanie' : 'Rejestracja'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          {mode === 'register' && (
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-slate-300">Imię i nazwisko (lub nazwa firmy)</span>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input className={`${inputClass} pl-10`} value={name} onChange={e => setName(e.target.value)} autoComplete="name" placeholder="Jan Kowalski" />
              </div>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-slate-300">Adres e-mail</span>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input className={`${inputClass} pl-10`} type="email" inputMode="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.pl" />
            </div>
          </label>

          {resetStep === 'code' && (
            <label className="block space-y-1">
              <span className="text-[11px] font-semibold text-slate-300">Kod z e-maila</span>
              <input className={inputClass} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value)} placeholder="12345678" />
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-slate-300">{resetStep === 'code' ? 'Nowe hasło' : 'Hasło'} {(mode === 'register' || resetStep === 'code') && '(min. 8 znaków)'}</span>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                className={`${inputClass} pl-10 pr-11`}
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400" aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          {mode === 'register' && (
            <label className="flex items-start gap-2.5 text-[11px] text-slate-300 leading-snug">
              <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-cyan-500 shrink-0" />
              <span>
                Akceptuję{' '}
                <button type="button" onClick={() => onLegal('terms')} className="text-cyan-400 underline">Regulamin</button> i{' '}
                <button type="button" onClick={() => onLegal('privacy')} className="text-cyan-400 underline">Politykę Prywatności</button>.
              </span>
            </label>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div role="status" className="flex items-start gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{info}</span>
            </div>
          )}

          <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-sm disabled:opacity-60 active:scale-[0.98] transition-transform">
            {busy ? 'Proszę czekać…' : resetStep === 'code' ? 'Zmień hasło i zaloguj' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
          </button>

          {mode === 'login' && resetStep === 'none' && (
            <button type="button" onClick={forgot} className="w-full text-center text-[11px] text-slate-400 underline py-1">
              Nie pamiętam hasła
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Profil */

function ProfileTab({ user, onUpdate }: { user: UserAccount; onUpdate: (u: UserAccount) => void }) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState((user.phoneProtected || '').trim() === '+48' ? '' : user.phoneProtected || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Podaj imię i nazwisko lub nazwę firmy.');
      return;
    }
    let normalized = '';
    if (phone.trim()) {
      const n = normalizePolishPhone(phone);
      if (!n) {
        setError('Podaj numer w formacie 9 cyfr, np. 500 123 456.');
        return;
      }
      normalized = n;
    }
    setBusy(true);
    try {
      const updated = await authService.updateProfile({ name: cleanName, phoneProtected: normalized });
      onUpdate(updated);
      setPhone(normalized);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Nie udało się zapisać zmian.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-slate-950 font-black text-3xl flex items-center justify-center mx-auto">
          {user.name.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="text-lg font-black text-white break-words">{user.name}</div>
        <div className="text-xs text-slate-400 break-all">{user.email}</div>
        <div className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-slate-900 border border-slate-800 text-slate-300">
          Konto od {user.createdAt}
        </div>
      </div>

      <form onSubmit={save} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-slate-300">Imię i nazwisko (lub nazwa firmy)</span>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-10`} value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          </div>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-slate-300">Adres e-mail</span>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-10 opacity-60`} value={user.email} readOnly />
          </div>
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-semibold text-slate-300">Chroniony numer telefonu</span>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input className={`${inputClass} pl-10`} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="500 123 456" />
          </div>
          <span className="block text-[10px] text-slate-500 leading-snug">Numer, który chronisz. Trafia do zawiadomień jako numer pokrzywdzonego abonenta.</span>
        </label>

        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-sm disabled:opacity-60 active:scale-[0.98] transition-transform">
          {busy ? 'Zapisywanie…' : saved ? 'Zapisano ✓' : 'Zapisz zmiany'}
        </button>
      </form>
    </div>
  );
}

/* ------------------------------------------------------------------ Ustawienia */

interface PermissionHelp {
  why: string;
  steps: string[];
}

function StatusRow({ label, desc, granted, onAction, help }: { label: string; desc: string; granted: boolean; onAction: () => void; help?: PermissionHelp }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800">
      <div className="flex items-center gap-3 p-3.5">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white leading-snug">{label}</div>
          <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{desc}</div>
        </div>
        {help && (
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-label={`Jak włączyć: ${label}`}
            aria-expanded={open}
            className={`shrink-0 p-1.5 rounded-full border ${open ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200' : 'border-slate-700 text-slate-400'}`}
          >
            <Info className="w-4 h-4" />
          </button>
        )}
        {granted ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Włączone
          </span>
        ) : (
          <button onClick={onAction} className="shrink-0 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold">
            Włącz
          </button>
        )}
      </div>
      {open && help && (
        <div className="px-3.5 pb-3.5 pt-3 border-t border-slate-800 text-[11px] text-slate-300 leading-snug space-y-2">
          <p>{help.why}</p>
          <ol className="list-decimal pl-4 space-y-1">
            {help.steps.map(step => <li key={step}>{step}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

const OVERLAY_HELP: PermissionHelp = {
  why: 'Dzięki temu TelePakt może pokazać swoje przyciski (np. „Nagrywaj”) na ekranie dzwoniącego połączenia.',
  steps: [
    'Dotknij „Włącz” - otworzą się ustawienia Androida.',
    'Jeśli zobaczysz listę aplikacji, wybierz TelePakt (to nie jest aplikacja Telefon).',
    'Włącz opcję „Zezwalaj na wyświetlanie nad innymi aplikacjami”.',
    'Wróć strzałką wstecz do TelePakt - przy uprawnieniu pojawi się „Włączone”.',
  ],
};

const PHONE_HELP: PermissionHelp = {
  why: 'Dzięki temu TelePakt wie, że ktoś do Ciebie dzwoni, i może wtedy pokazać swoje przyciski. Nie odczytuje Twoich kontaktów ani nie słucha rozmów.',
  steps: [
    'Dotknij „Włącz” - pojawi się okienko Androida z pytaniem o dostęp do stanu telefonu.',
    'Wybierz „Zezwól”.',
    'Jeśli okienko się nie pojawi, otwórz Ustawienia telefonu > Aplikacje > TelePakt > Uprawnienia > Telefon i włącz je ręcznie.',
  ],
};

/** Status uprawnień natywnej nakładki; odświeża się po powrocie z ustawień systemowych. */
function useOverlayStatus() {
  const [status, setStatus] = useState<OverlayStatus | null>(null);
  const refresh = useCallback(() => { NativeOverlayBridge.checkStatus().then(setStatus); }, []);
  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [refresh]);
  return { status, refresh };
}

/** Baner nad całą aplikacją, dopóki brakuje uprawnień potrzebnych do pracy nakładki na ekranie rozmowy. */
function PermissionBanner({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { status, refresh } = useOverlayStatus();
  const [busy, setBusy] = useState(false);
  if (!NativeOverlayBridge.isNative() || !status) return null;
  if (status.hasOverlayPermission && status.hasPhoneStatePermission) return null;

  const enableAll = async () => {
    setBusy(true);
    try {
      if (!status.hasPhoneStatePermission) await NativeOverlayBridge.requestPhonePermission();
      const now = await NativeOverlayBridge.checkStatus();
      if (!now.hasOverlayPermission) await NativeOverlayBridge.requestOverlayPermission();
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const item = (ok: boolean, text: string) => (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-amber-300/70 shrink-0" />}
      <span className={ok ? 'text-slate-400 line-through' : 'text-amber-100'}>{text}</span>
    </li>
  );

  return (
    <div role="alert" className="mb-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 space-y-3">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="text-xs font-black text-amber-100">Dokończ konfigurację</div>
          <p className="text-[11px] text-amber-100/80 leading-snug">
            Bez tych uprawnień TelePakt nie pokaże przycisków na ekranie dzwoniącego połączenia.
          </p>
        </div>
      </div>
      <ul className="text-[11px] space-y-1.5 pl-1">
        {item(status.hasPhoneStatePermission, 'Dostęp do stanu telefonu')}
        {item(status.hasOverlayPermission, 'Wyświetlanie nad innymi aplikacjami')}
      </ul>
      <div className="flex gap-2">
        <button onClick={enableAll} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black disabled:opacity-60">
          {busy ? 'Chwileczkę…' : 'Włącz teraz'}
        </button>
        <button onClick={onOpenSettings} className="px-3 py-2.5 rounded-xl border border-amber-500/40 text-amber-100 text-xs font-bold">
          Jak to zrobić?
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Przekierowanie */

interface ForwardingInfo {
  number: string;
  codes: { when_busy: string; when_unanswered: string; when_unreachable: string; cancel_all: string };
}

const FORWARD_LABELS: Array<[keyof ForwardingInfo['codes'], string, string]> = [
  ['when_busy', 'Gdy odrzucisz lub jesteś zajęty', 'Przycisk „Przekieruj do TelePakt” na ekranie dzwonienia odrzuca rozmowę, a operator przekazuje ją do TelePakt.'],
  ['when_unanswered', 'Gdy nie odbierzesz (po 20 s)', 'Rozmowa, której nie odbierzesz, trafi do TelePakt.'],
  ['when_unreachable', 'Gdy telefon jest wyłączony / bez zasięgu', 'Opcjonalne.'],
  ['cancel_all', 'Wyłącz wszystkie przekierowania', 'Przywraca zwykłe działanie telefonu.'],
];

function ForwardingSection() {
  const [info, setInfo] = useState<ForwardingInfo | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/api/telephony/forwarding-info/`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: ForwardingInfo) => { if (alive) { setInfo(data); setState('ready'); } })
      .catch(() => { if (alive) setState('unavailable'); });
    return () => { alive = false; };
  }, []);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* schowek niedostępny - kod i tak jest widoczny */ }
  };

  return (
    <section className="space-y-2.5">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Przekierowanie do TelePakt</h2>
      {state === 'loading' && <p className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">Sprawdzanie numeru…</p>}
      {state === 'unavailable' && (
        <p className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-snug">
          Numer TelePakt pojawi się po uruchomieniu usługi. Wtedy zobaczysz tu kody przekierowania do wpisania w telefonie.
        </p>
      )}
      {state === 'ready' && info && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 overflow-hidden">
          <div className="px-4 py-3 text-[11px] text-slate-300 leading-snug">
            <PhoneForwarded className="inline w-3.5 h-3.5 mr-1.5 text-cyan-300" />
            Wpisz kod w aplikacji Telefon i wciśnij zadzwoń. Numer TelePakt: <strong className="text-white">{info.number}</strong>.
            Działanie zależy od operatora - po ustawieniu wykonaj połączenie próbne. Przekierowane minuty mogą być płatne u operatora.
          </div>
          {FORWARD_LABELS.map(([key, label, desc]) => (
            <div key={key} className="px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white leading-snug">{label}</div>
                <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{desc}</div>
                <code className="block mt-1 text-[11px] text-cyan-200 break-all">{info.codes[key]}</code>
              </div>
              <button onClick={() => copy(info.codes[key])} aria-label="Kopiuj kod" className="shrink-0 p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200">
                {copied === info.codes[key] ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsTab({ user, onLegal, onLogout }: { user: UserAccount; onLegal: (d: LegalDocType) => void; onLogout: () => void }) {
  const isNative = NativeOverlayBridge.isNative();
  const [status, setStatus] = useState<OverlayStatus | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const refresh = () => NativeOverlayBridge.checkStatus().then(setStatus);

  useEffect(() => {
    NativeOverlayBridge.saveConfig(API_URL, authService.getToken() ?? '');
  }, [user.id]);

  useEffect(() => {
    refresh();
    // Po powrocie z systemowych ustawień odśwież status uprawnień.
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const deleteAccount = async () => {
    setDeleteError(null);
    setDeleting(true);
    try {
      await authService.deleteAccount(deletePassword);
    } catch (err: any) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tarcza połączeń</h2>
        {isNative ? (
          <>
            <StatusRow
              label="Wyświetlanie nad innymi aplikacjami"
              desc="Pozwala pokazać suwak TelePakt na ekranie przychodzącego połączenia."
              granted={!!status?.hasOverlayPermission}
              onAction={() => NativeOverlayBridge.requestOverlayPermission()}
              help={OVERLAY_HELP}
            />
            <StatusRow
              label="Dostęp do stanu telefonu"
              desc="Pozwala wykryć, że ktoś do Ciebie dzwoni."
              granted={!!status?.hasPhoneStatePermission}
              onAction={() => NativeOverlayBridge.requestPhonePermission().then(refresh)}
              help={PHONE_HELP}
            />
          </>
        ) : (
          <p className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-snug">
            Uprawnienia nakładki połączeń są dostępne w aplikacji na telefonie z Androidem.
          </p>
        )}
      </section>

      {isNative && FEATURES.forwarding && <ForwardingSection />}

      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Prywatność i dokumenty</h2>
        <div className="rounded-2xl bg-slate-900 border border-slate-800 divide-y divide-slate-800 overflow-hidden">
          {([['privacy', 'Polityka prywatności'], ['terms', 'Regulamin'], ['rodo', 'Klauzula RODO']] as const).map(([id, label]) => (
            <button key={id} onClick={() => onLegal(id)} className="w-full flex items-center justify-between px-4 py-3.5 text-left text-xs font-semibold text-white">
              <span>{label}</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2.5">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Konto</h2>
        <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-white font-bold text-sm active:scale-[0.98] transition-transform">
          <LogOut className="w-4 h-4" /> Wyloguj się
        </button>

        {!confirmDelete ? (
          <button onClick={() => setConfirmDelete(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-rose-300 text-xs font-bold">
            <Trash2 className="w-4 h-4" /> Usuń konto
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <p className="text-[11px] text-rose-100 leading-snug">
              Konto <strong className="break-all">{user.email}</strong>, dane profilu i Twoje nagrania zostaną trwale usunięte. Tej operacji nie można cofnąć.
            </p>
            <input className={inputClass} type="password" autoComplete="current-password" value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Wpisz hasło, aby potwierdzić" />
            {deleteError && <p role="alert" className="text-[11px] text-rose-200">{deleteError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setConfirmDelete(false); setDeleteError(null); }} className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white">
                Anuluj
              </button>
              <button onClick={deleteAccount} disabled={deleting} className="py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white disabled:opacity-60">
                {deleting ? 'Usuwanie…' : 'Usuń trwale'}
              </button>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-[10px] text-slate-600">TelePakt {APP_VERSION}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ Nagrania */

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function RecordingsTab() {
  const [items, setItems] = useState<RecordingItem[] | null>(null);
  const [needsPhone, setNeedsPhone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<{ sid: string; url: string } | null>(null);
  const [busySid, setBusySid] = useState<string | null>(null);
  const [confirmSid, setConfirmSid] = useState<string | null>(null);
  const [sharingSid, setSharingSid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recordingsService.list();
      setItems(data.recordings);
      setNeedsPhone(data.needs_phone);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => () => { if (playing) URL.revokeObjectURL(playing.url); }, [playing]);

  const play = async (sid: string) => {
    setBusySid(sid);
    setError(null);
    try {
      const url = await recordingsService.audioUrl(sid);
      setPlaying({ sid, url });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusySid(null);
    }
  };

  const share = async (sid: string) => {
    setSharingSid(sid);
    setError(null);
    try {
      await recordingsService.share(sid);
    } catch (err: any) {
      // Zamknięcie menu "Udostępnij" bez wyboru nie jest błędem.
      if (!/cancel|dismiss|anulowan/i.test(String(err?.message))) setError(err.message || 'Nie udało się udostępnić nagrania.');
    } finally {
      setSharingSid(null);
    }
  };

  const remove = async (sid: string) => {
    setBusySid(sid);
    setError(null);
    try {
      await recordingsService.remove(sid);
      setConfirmSid(null);
      if (playing?.sid === sid) setPlaying(null);
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusySid(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Nagrania rozmów</h2>
        <button onClick={load} disabled={loading} aria-label="Odśwież listę" className="p-2 rounded-xl border border-slate-800 text-slate-300 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {needsPhone && (
        <p className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-[11px] text-amber-100 leading-snug">
          Ustaw swój numer telefonu w zakładce Profil - po nim przypisujemy nagrania do Twojego konta.
        </p>
      )}

      {items && items.length === 0 && !needsPhone && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-snug space-y-2">
          <p className="font-bold text-white">Nie masz jeszcze nagrań.</p>
          <p>Aby nagrać całą rozmowę, w trakcie rozmowy stuknij w nakładce „Nagrywaj całą rozmowę”. Telefon wstrzyma rozmowę i zadzwoni na numer TelePakt. Gdy TelePakt odbierze, stuknij „Scal” (lub „Połącz rozmowy”) - od tej chwili nagrywane są obie strony.</p>
        </div>
      )}

      {items && items.length > 0 && (
        <p className="text-[10px] text-slate-500 leading-snug">
          „Chmura” otwiera menu Androida: wybierz Dysk Google, Dropbox, OneDrive, e-mail lub inną aplikację, w której chcesz zachować nagranie. Po zapisaniu możesz je usunąć z naszego serwera.
        </p>
      )}

      <ul className="space-y-2.5">
        {(items || []).map(item => {
          const when = new Date(item.timestamp).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          return (
            <li key={item.call_sid} className="rounded-2xl bg-slate-900 border border-slate-800 p-3.5 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-cyan-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{item.own_call ? 'Cała rozmowa (nagrana przez Ciebie)' : item.caller_number}</div>
                  <div className="text-[10px] text-slate-400">
                    {when}{item.ready ? ` · ${formatDuration(item.duration_seconds)}` : ' · przetwarzanie…'}
                  </div>
                </div>
              </div>

              {playing?.sid === item.call_sid && (
                <audio controls autoPlay src={playing.url} className="w-full" />
              )}

              {confirmSid === item.call_sid ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
                  <p className="text-[11px] text-rose-100 leading-snug">Nagranie zostanie trwale usunięte z serwera i od operatora telefonii.</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setConfirmSid(null)} className="py-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-bold text-white">Anuluj</button>
                    <button onClick={() => remove(item.call_sid)} disabled={busySid === item.call_sid} className="py-2 rounded-xl bg-rose-600 text-[11px] font-bold text-white disabled:opacity-60">
                      {busySid === item.call_sid ? 'Usuwanie…' : 'Usuń trwale'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => play(item.call_sid)}
                    disabled={!item.ready || busySid === item.call_sid}
                    className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" /> {busySid === item.call_sid ? 'Pobieranie…' : 'Odsłuchaj'}
                  </button>
                  <button
                    onClick={() => share(item.call_sid)}
                    disabled={!item.ready || sharingSid === item.call_sid}
                    className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-700 text-slate-200 text-[11px] font-bold disabled:opacity-40"
                  >
                    <Cloud className="w-3.5 h-3.5" /> {sharingSid === item.call_sid ? 'Przygotowuję…' : 'Chmura'}
                  </button>
                  <button onClick={() => setConfirmSid(item.call_sid)} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-800 text-rose-300 text-[11px] font-bold">
                    <Trash2 className="w-3.5 h-3.5" /> Usuń
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ Aplikacja */

export function AccountApp() {
  const [user, setUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [tab, setTab] = useState<'profile' | 'recordings' | 'messages' | 'settings'>('profile');
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => authService.subscribe(setUser), []);

  const legalModal = (
    <LegalDocumentModal isOpen={legalDoc !== null} initialDoc={legalDoc || 'privacy'} onClose={() => setLegalDoc(null)} />
  );

  if (!user) {
    return (
      <>
        <AuthScreen onLegal={setLegalDoc} />
        {legalModal}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-slate-950/90 backdrop-blur border-b border-slate-800 pt-[env(safe-area-inset-top)]">
        <div className="max-w-md mx-auto px-5 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 shrink-0">
            <img src={logoImage} alt="" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-white tracking-tight">TelePakt<span className="text-cyan-400">.pl</span></span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-5 py-6 pb-28">
        <PermissionBanner onOpenSettings={() => setTab('settings')} />
        {tab === 'profile' ? (
          <ProfileTab user={user} onUpdate={setUser} />
        ) : tab === 'recordings' ? (
          <RecordingsTab />
        ) : tab === 'messages' ? (
          <MessagesTab />
        ) : (
          <SettingsTab user={user} onLegal={setLegalDoc} onLogout={() => { NativeOverlayBridge.saveConfig(API_URL, ''); authService.logout(); }} />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto grid grid-cols-4">
          {([['profile', 'Profil', User], ['recordings', 'Nagrania', Mic], ['messages', 'Komunikaty', MessageSquare], ['settings', 'Ustawienia', Settings]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`py-3 flex flex-col items-center gap-1 text-[11px] font-bold ${tab === id ? 'text-cyan-300' : 'text-slate-500'}`}
              aria-current={tab === id ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {legalModal}
    </div>
  );
}
