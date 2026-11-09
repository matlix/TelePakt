/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState } from 'react';
import { AppNameOption, LegalScript, CallLog } from './types';
import { APP_NAMES } from './data/appNames';
import { LEGAL_SCRIPTS, INITIAL_CALL_LOGS } from './data/legalScripts';
import { Capacitor } from '@capacitor/core';
import { PublicWebsite } from './components/PublicWebsite';
import { AccountApp } from './components/AccountApp';

/**
 * Narzędzia deweloperskie (logo, eksport ZIP, symulatory, panel z danymi przykładowymi...).
 * Ładowane WYŁĄCZNIE w trybie deweloperskim (`npm run dev`, adres `/?studio=1`).
 * W buildzie produkcyjnym `import.meta.env.DEV` to `false`, więc ten kod i wszystkie
 * jego zależności są usuwane z paczki - użytkownicy ich nie pobierają.
 */
const StudioApp = import.meta.env.DEV
  ? React.lazy(() => import('./StudioApp').then(m => ({ default: m.StudioApp })))
  : null;

type ViewMode = 'website' | 'app' | 'studio';

export default function App() {
  const [selectedName, setSelectedName] = useState<AppNameOption>(APP_NAMES[0]);
  const [scripts, setScripts] = useState<LegalScript[]>(import.meta.env.DEV ? LEGAL_SCRIPTS : []);
  const [calls, setCalls] = useState<CallLog[]>(import.meta.env.DEV ? INITIAL_CALL_LOGS : []);
  const [selectedCallForComplaint, setSelectedCallForComplaint] = useState<CallLog | null>(null);

  // 'app' = aplikacja mobilna / PWA, 'website' = strona publiczna, 'studio' = tylko lokalnie (DEV)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);

    if (import.meta.env.DEV && params.get('studio') === '1') {
      return 'studio';
    }

    // Zainstalowana aplikacja Android (Capacitor) to ZAWSZE aplikacja z kontem - nigdy strona WWW.
    if (Capacitor.isNativePlatform()) {
      return 'app';
    }

    // Uruchomienie z ikony na ekranie głównym (PWA standalone) lub jawne ?mode=app
    const isPwaStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (params.get('mode') === 'app' || params.get('app') === 'true' || isPwaStandalone) {
      return 'app';
    }

    // Domyślnie wejście na telepakt.pl pokazuje stronę publiczną.
    return 'website';
  });

  const handleSwitchToApp = () => {
    localStorage.setItem('telepakt_active_view', 'app');
    setViewMode('app');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchToWebsite = () => {
    localStorage.setItem('telepakt_active_view', 'website');
    setViewMode('website');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCallLogged = (newCall: CallLog) => setCalls(prev => [newCall, ...prev]);
  const handleOpenComplaint = (call: CallLog) => setSelectedCallForComplaint(call);
  const handleUpdateScript = (updated: LegalScript) =>
    setScripts(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  const handleAddCustomScript = (added: LegalScript) => setScripts(prev => [added, ...prev]);
  const handleUpdateCall = (updated: CallLog) =>
    setCalls(prev => prev.map(c => (c.id === updated.id ? updated : c)));

  const shell = 'min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white';

  // 1. APLIKACJA (PWA i natywna aplikacja Android): logowanie, rejestracja, profil, ustawienia
  if (viewMode === 'app') {
    return (
      <div className={shell}>
        <AccountApp />
      </div>
    );
  }

  // 2. STUDIO DEWELOPERSKIE (tylko DEV)
  if (viewMode === 'studio' && StudioApp) {
    return (
      <Suspense fallback={<div className="p-8 text-slate-400">Ładowanie studia…</div>}>
        <StudioApp
          selectedName={selectedName}
          onSelectName={setSelectedName}
          scripts={scripts}
          onSetScripts={setScripts}
          calls={calls}
          selectedCallForComplaint={selectedCallForComplaint}
          onCallLogged={handleCallLogged}
          onOpenComplaint={handleOpenComplaint}
          onUpdateScript={handleUpdateScript}
          onAddCustomScript={handleAddCustomScript}
          onUpdateCall={handleUpdateCall}
          onLockApp={() => undefined}
          onBackToWebsite={handleSwitchToWebsite}
        />
      </Suspense>
    );
  }

  // 3. STRONA PUBLICZNA
  return (
    <div className={shell}>
      <PublicWebsite appName={selectedName} onOpenApp={handleSwitchToApp} />
    </div>
  );
}
