/**
 * Aplikacja TelePakt (Android / PWA) - celowo minimalna:
 *   1. logowanie i rejestracja (e-mail + hasło, Firebase),
 *   2. profil użytkownika,
 *   3. ustawienia (uprawnienia nakładki połączeń, dokumenty prawne, wylogowanie, usunięcie konta).
 *
 * Funkcja "tarczy" (nakładka z suwakiem nad przychodzącym połączeniem) działa natywnie
 * w systemie Android - ta aplikacja tylko zarządza kontem i uprawnieniami.
 * Nie ma tu żadnych odnośników do strony internetowej.
 */
import React, { useEffect, useState } from 'react';
import { Copy, PhoneForwarded, Eye, EyeOff, LogOut, Mail, Lock, Phone, Trash2, User, CheckCircle2, AlertCircle, ChevronRight, Settings } from 'lucide-react';
import { UserAccount } from '../types';
import { authService } from '../services/authService';
import { NativeOverlayBridge, OverlayStatus } from '../services/nativeOverlayBridge';
import { API_URL } from '../config';
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
      if (mode === 'register') await authService.registerWithEmail(name, email, password);
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
      setInfo('Jeśli konto z tym adresem istnieje, wysłaliśmy wiadomość z linkiem do zmiany hasła.');
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
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
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

          <label className="block space-y-1">
            <span className="text-[11px] font-semibold text-slate-300">Hasło {mode === 'register' && '(min. 6 znaków)'}</span>
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
            {busy ? 'Proszę czekać…' : mode === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
          </button>

          {mode === 'login' && (
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

function StatusRow({ label, desc, granted, onAction }: { label: string; desc: string; granted: boolean; onAction: () => void }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-white leading-snug">{label}</div>
        <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{desc}</div>
      </div>
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

  const refresh = () => NativeOverlayBridge.checkStatus().then(setStatus);

  useEffect(() => {
    NativeOverlayBridge.saveConfig(API_URL, user.phoneProtected ?? '');
  }, [user.phoneProtected]);

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
      await authService.deleteAccount();
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
            />
            <StatusRow
              label="Dostęp do stanu telefonu"
              desc="Pozwala wykryć, że ktoś do Ciebie dzwoni."
              granted={!!status?.hasPhoneStatePermission}
              onAction={() => NativeOverlayBridge.requestPhonePermission().then(refresh)}
            />
          </>
        ) : (
          <p className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-snug">
            Uprawnienia nakładki połączeń są dostępne w aplikacji na telefonie z Androidem.
          </p>
        )}
      </section>

      {isNative && <ForwardingSection />}

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
              Konto <strong className="break-all">{user.email}</strong> i Twoje dane profilu zostaną trwale usunięte. Tej operacji nie można cofnąć.
            </p>
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

/* ------------------------------------------------------------------ Aplikacja */

export function AccountApp() {
  const [user, setUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [tab, setTab] = useState<'profile' | 'settings'>('profile');
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
        {tab === 'profile' ? (
          <ProfileTab user={user} onUpdate={setUser} />
        ) : (
          <SettingsTab user={user} onLegal={setLegalDoc} onLogout={() => authService.logout()} />
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-slate-950/95 backdrop-blur border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto grid grid-cols-2">
          {([['profile', 'Profil', User], ['settings', 'Ustawienia', Settings]] as const).map(([id, label, Icon]) => (
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
