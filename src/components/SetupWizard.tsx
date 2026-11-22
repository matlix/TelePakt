import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { NativeOverlayBridge, PermissionStates } from '../services/nativeOverlayBridge';

/**
 * Kreator pierwszej konfiguracji (tylko aplikacja na Androidzie). Po zalogowaniu prowadzi krok po kroku przez
 * wszystkie zgody, z instrukcją „jak to włączyć” - użytkownik nie wie, że trzeba kilku ustawień w Androidzie, i bez
 * tego uzna, że aplikacja nie działa. Kroki obowiązkowe blokują aplikację, dopóki nie są wykonane; zalecane można pominąć.
 */

type StepId = 'phone' | 'dialer' | 'overlay' | 'notifications' | 'contacts' | 'calllog';

interface Step {
  id: StepId;
  title: string;
  required: boolean;
  why: string;
  how: string[];
  action: string;
  done: (s: PermissionStates, useOverlay: boolean) => boolean;
  /** Jak wykonać krok; zwraca true, jeśli system pokazał okienko/ekran (przy odmowie pokazujemy ręczną instrukcję). */
  run: () => Promise<void>;
  manualKind?: 'notifications';
}

const SKIP_KEY = 'setup_skipped_v1';

function readSkipped(): StepId[] {
  try { return JSON.parse(localStorage.getItem(SKIP_KEY) || '[]'); } catch { return []; }
}

function buildSteps(): Step[] {
  return [
    {
      id: 'phone', title: 'Dostęp do połączeń', required: true,
      why: 'Dzięki temu TelePakt może wybierać numery i wie, z której karty SIM dzwonisz. Bez tego nie wykona żadnego połączenia.',
      how: [
        'Dotknij „Zezwól” poniżej.',
        'W okienku Androida wybierz „Zezwól”.',
        'Jeśli okienko się nie pokaże: Ustawienia telefonu → Aplikacje → TelePakt → Uprawnienia → Telefon → Zezwól.',
      ],
      action: 'Zezwól',
      done: s => s.phone,
      run: async () => { await NativeOverlayBridge.requestPhonePermission(); },
    },
    {
      id: 'dialer', title: 'TelePakt jako aplikacja Telefon', required: true,
      why: 'To główna zmiana: TelePakt odbiera i wykonuje połączenia, a jedno stuknięcie komunikatu samo łączy z TelePakt i odtwarza go. Zawsze możesz wrócić do dawnej aplikacji Telefon.',
      how: [
        'Dotknij „Ustaw jako Telefon”.',
        'Android zapyta „Ustawić TelePakt jako domyślną aplikację Telefon?” - zaznacz „TelePakt” i dotknij „Ustaw jako domyślną”.',
        'Powrót do dawnej aplikacji: Ustawienia telefonu → Aplikacje → Domyślne aplikacje → Aplikacja Telefon.',
      ],
      action: 'Ustaw jako Telefon',
      done: s => s.dialer || s.overlay,  // tryb nakładki też spełnia ten krok
      run: async () => { await NativeOverlayBridge.requestDefaultDialer(); },
    },
    {
      id: 'overlay', title: 'Wyświetlanie nad innymi aplikacjami', required: true,
      why: 'Tryb dla osób, które zostają przy swojej aplikacji Telefon: TelePakt pokazuje przyciski nad ekranem rozmowy.',
      how: [
        'Dotknij „Włącz”. Otworzą się ustawienia Androida.',
        'Wybierz TelePakt na liście (to nie jest aplikacja Telefon) i włącz „Zezwalaj na wyświetlanie nad innymi aplikacjami”.',
        'Wróć strzałką wstecz do TelePakt.',
      ],
      action: 'Włącz',
      done: s => s.overlay,
      run: async () => { await NativeOverlayBridge.requestOverlayPermission(); },
    },
    {
      id: 'notifications', title: 'Powiadomienia (ekran połączenia)', required: true,
      why: 'Przychodzące połączenie pokazuje się przez powiadomienie. Bez zgody możesz nie zobaczyć przycisków odbierania.',
      how: [
        'Dotknij „Zezwól” i w okienku Androida wybierz „Zezwól”.',
        'Jeśli okienko się nie pokaże: Ustawienia telefonu → Aplikacje → TelePakt → Powiadomienia → włącz.',
      ],
      action: 'Zezwól',
      done: s => s.notifications,
      run: async () => { await NativeOverlayBridge.requestPermissionGroup('notifications'); },
      manualKind: 'notifications',
    },
    {
      id: 'contacts', title: 'Kontakty', required: false,
      why: 'Pokazuje nazwy zamiast numerów i pozwala dzwonić z listy kontaktów. Bez tego ostrzeżenie o numerach zagranicznych pojawia się także dla Twoich znajomych.',
      how: ['Dotknij „Zezwól” i wybierz „Zezwól” w okienku Androida.', 'Możesz pominąć - kontakty zawsze włączysz później w Ustawieniach telefonu → Aplikacje → TelePakt → Uprawnienia.'],
      action: 'Zezwól',
      done: s => s.contacts,
      run: async () => { await NativeOverlayBridge.requestPermissionGroup('contacts'); },
    },
    {
      id: 'calllog', title: 'Rejestr połączeń', required: false,
      why: 'Pozwala pokazać listę ostatnich połączeń w dialerze i liczbę wcześniejszych połączeń z zablokowanych numerów.',
      how: ['Dotknij „Zezwól” i wybierz „Zezwól” w okienku Androida.', 'Możesz pominąć - włączysz później w Ustawieniach telefonu → Aplikacje → TelePakt → Uprawnienia.'],
      action: 'Zezwól',
      done: s => s.calllog,
      run: async () => { await NativeOverlayBridge.requestPermissionGroup('calllog'); },
    },
  ];
}

export function SetupWizard() {
  const [states, setStates] = useState<PermissionStates | null>(null);
  const [useOverlay, setUseOverlay] = useState(false);
  const [skipped, setSkipped] = useState<StepId[]>(readSkipped);
  const [tried, setTried] = useState<Partial<Record<StepId, boolean>>>({});
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(() => { NativeOverlayBridge.getPermissionStates().then(s => { if (s) setStates(s); }); }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 2000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(timer);
    };
  }, [refresh]);

  if (!NativeOverlayBridge.isNative() || !states) return null;

  // Tryb nakładki zastępuje krok „Telefon” krokiem „Wyświetlanie nad innymi aplikacjami” (i odwrotnie).
  const overlayMode = useOverlay && !states.dialer;
  const steps = buildSteps().filter(st => (st.id === 'overlay' ? overlayMode : st.id === 'dialer' ? !overlayMode : true));
  const pending = steps.filter(st => !st.done(states, overlayMode) && (st.required || !skipped.includes(st.id)));
  if (pending.length === 0) return null;

  const current = pending[0];
  const index = steps.findIndex(st => st.id === current.id) + 1;
  const run = async () => {
    setBusy(true);
    try {
      await current.run();
    } finally {
      setTried(t => ({ ...t, [current.id]: true }));
      setBusy(false);
      refresh();
    }
  };
  const skip = () => {
    const next = [...skipped, current.id];
    setSkipped(next);
    try { localStorage.setItem(SKIP_KEY, JSON.stringify(next)); } catch { /* bez pamięci lokalnej pominięcie działa do zamknięcia aplikacji */ }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Konfiguracja TelePakt" className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto pt-[env(safe-area-inset-top)]">
      <div className="max-w-md mx-auto px-5 py-8 space-y-5">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Konfiguracja TelePakt · krok {index} z {steps.length}</div>
          <h1 className="text-xl font-black text-white">{current.title}</h1>
          <p className="text-xs text-slate-400 leading-snug">
            {current.required
              ? 'Ten krok jest potrzebny, żeby aplikacja działała. Bez niego TelePakt wyglądałby, jakby nic nie robił.'
              : 'Ten krok jest zalecany, ale możesz go pominąć.'}
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {steps.map(st => (
            <span key={st.id} className={`h-1.5 flex-1 rounded-full ${st.done(states, overlayMode) ? 'bg-emerald-400' : st.id === current.id ? 'bg-cyan-400' : 'bg-slate-800'}`} />
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div>
            <div className="text-[11px] font-bold text-slate-300">Po co to?</div>
            <p className="text-xs text-slate-300 leading-snug mt-0.5">{current.why}</p>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-300">Jak to włączyć</div>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1 mt-0.5 leading-snug">
              {current.how.map((line, i) => <li key={i}>{line}</li>)}
            </ol>
          </div>
        </div>

        <button onClick={run} disabled={busy} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-sm disabled:opacity-60">
          {busy ? 'Chwileczkę…' : current.action}
        </button>

        {tried[current.id] && !current.done(states, overlayMode) && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-2">
            <p className="text-[11px] text-amber-100 leading-snug">
              Nie widzę jeszcze zgody. Jeśli okienko Androida się nie pokazało albo je odrzuciłeś, włącz to ręcznie w ustawieniach i wróć do TelePakt - sprawdzę to automatycznie.
            </p>
            <button onClick={() => NativeOverlayBridge.openAppSettings(current.manualKind)} className="w-full py-2 rounded-xl border border-amber-500/50 text-amber-100 text-xs font-bold">
              Otwórz ustawienia TelePakt
            </button>
          </div>
        )}

        {current.id === 'dialer' && (
          <button onClick={() => setUseOverlay(true)} className="w-full text-center text-[11px] text-slate-400 underline">
            Wolę zostać przy swojej aplikacji Telefon (nakładka na ekranie rozmowy, mniej wygodna)
          </button>
        )}
        {current.id === 'overlay' && (
          <button onClick={() => setUseOverlay(false)} className="w-full text-center text-[11px] text-slate-400 underline">
            Wróć do ustawienia TelePakt jako aplikacji Telefon (zalecane)
          </button>
        )}
        {!current.required && (
          <button onClick={skip} className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold">Pomiń ten krok</button>
        )}

        <ul className="space-y-1.5 pt-1">
          {steps.map(st => {
            const ok = st.done(states, overlayMode);
            return (
              <li key={st.id} className="flex items-center gap-2 text-[11px]">
                {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />}
                <span className={ok ? 'text-slate-500 line-through' : 'text-slate-300'}>{st.title}{st.required ? '' : ' (zalecane)'}</span>
              </li>
            );
          })}
        </ul>
        <p className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug"><ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" />Kontakty i lista połączeń zostają w telefonie. Na serwer wysyłamy tylko numer dzwoniącego, gdy sprawdzamy go w zgłoszeniach innych użytkowników.</p>
      </div>
    </div>
  );
}
