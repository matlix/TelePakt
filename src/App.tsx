/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppNameOption, LegalScript, CallLog } from './types';
import { APP_NAMES } from './data/appNames';
import { LEGAL_SCRIPTS, INITIAL_CALL_LOGS } from './data/legalScripts';
import { Navbar, ActiveTab } from './components/Navbar';
import { NameSelectorModal } from './components/NameSelectorModal';
import { InCallSimulator } from './components/InCallSimulator';
import { VoiceStudio } from './components/VoiceStudio';
import { LegalScriptsView } from './components/LegalScriptsView';
import { ComplaintGenerator } from './components/ComplaintGenerator';
import { CloudTelephonyView } from './components/CloudTelephonyView';
import { PythonProjectExplorer } from './components/PythonProjectExplorer';
import { CallHistoryView } from './components/CallHistoryView';
import { UseCasesExplorer } from './components/UseCasesExplorer';
import { WebsiteStrategyView } from './components/WebsiteStrategyView';
import { TelePaktMockupsStudio } from './components/TelePaktMockupsStudio';
import { InstructionAnimationStudio } from './components/InstructionAnimationStudio';
import { LegalAndBusinessHub } from './components/LegalAndBusinessHub';
import { DownloadExportCenter } from './components/DownloadExportCenter';
import { AdminPanelHub } from './components/AdminPanelHub';
import { AccessGateModal } from './components/AccessGateModal';
import { GlobalStrategyView } from './components/GlobalStrategyView';
import { PublicWebsite } from './components/PublicWebsite';
import { TelePaktMobileApp } from './components/TelePaktMobileApp';
import { authService } from './services/authService';
import { Shield, Sparkles, Scale, Terminal, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function App() {
  const [selectedName, setSelectedName] = useState<AppNameOption>(APP_NAMES[0]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('telepakt');
  const [scripts, setScripts] = useState<LegalScript[]>(LEGAL_SCRIPTS);
  const [calls, setCalls] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [selectedCallForComplaint, setSelectedCallForComplaint] = useState<CallLog | null>(null);
  const [preselectedScriptForSimulator, setPreselectedScriptForSimulator] = useState<LegalScript | null>(null);

  // View Mode: 'app' (Mobile Application / PWA), 'website' (Landing Page), 'studio' (Internal Admin)
  const [viewMode, setViewMode] = useState<'website' | 'app' | 'studio'>(() => {
    const params = new URLSearchParams(window.location.search);
    // Strict internal-only secret key required to access developer studio
    if (params.get('internal_admin_key') === 'telepakt_adm_dev_secure_2026') {
      return 'studio';
    }

    // Check if launched via PWA standalone mode (installed to phone home screen)
    const isPwaStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);

    // If opened from phone homescreen icon (standalone PWA) or explicit ?mode=app start_url
    if (params.get('mode') === 'app' || params.get('app') === 'true' || isPwaStandalone) {
      return 'app';
    }

    // Default for direct website visits (telepakt.pl): Always show the website first!
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

  // Staging Password Protection State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('telepakt_staging_authenticated') === 'true';
  });
  const [isGateEnabled, setIsGateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('telepakt_staging_gate_enabled') === 'true';
  });

  const handleLockApp = () => {
    localStorage.removeItem('telepakt_staging_authenticated');
    setIsAuthenticated(false);
  };

  const handleCallLogged = (newCall: CallLog) => {
    setCalls(prev => [newCall, ...prev]);
  };

  const handleOpenComplaint = (call: CallLog) => {
    setSelectedCallForComplaint(call);
    setActiveTab('complaints');
  };

  const handleUpdateScript = (updatedScript: LegalScript) => {
    setScripts(prev => prev.map(s => s.id === updatedScript.id ? updatedScript : s));
  };

  const handleAddCustomScript = (newScript: LegalScript) => {
    setScripts(prev => [newScript, ...prev]);
  };

  const handleUpdateCall = (updatedCall: CallLog) => {
    setCalls(prev => prev.map(c => c.id === updatedCall.id ? updatedCall : c));
  };

  // Staging Password Protection Gate (when enabled by admin, gates all views)
  if (isGateEnabled && !isAuthenticated) {
    return (
      <AccessGateModal
        onAuthenticated={() => {
          localStorage.setItem('telepakt_staging_authenticated', 'true');
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // 1. MOBILE APP MODE (TelePakt PWA & Native Phone Application)
  if (viewMode === 'app') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
        <TelePaktMobileApp
          appName={selectedName}
          scripts={scripts}
          calls={calls}
          onCallLogged={handleCallLogged}
          onOpenComplaint={handleOpenComplaint}
          selectedCallForComplaint={selectedCallForComplaint}
          onUpdateScript={handleUpdateScript}
          onAddCustomScript={handleAddCustomScript}
          onUpdateCall={handleUpdateCall}
          onSwitchToWebsite={handleSwitchToWebsite}
        />
      </div>
    );
  }

  // 2. PUBLIC WEBSITE MODE (Strict and clean for visitors wanting information)
  if (viewMode === 'website') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
        <PublicWebsite
          appName={selectedName}
          onOpenApp={handleSwitchToApp}
        />
      </div>
    );
  }

  // 3. DEVELOPER STUDIO & ADMIN MODE
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">

      {/* Studio Mode Return Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-950 to-indigo-950 border-b border-indigo-500/40 px-4 py-2.5 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-50">
        <div className="flex items-center gap-2 text-indigo-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Tryb Dewelopera i Panel Administratora TelePakt.pl</strong> — Symulator, Generator Skarg UKE, Szablony i Narzędzia
          </span>
        </div>
        <button
          onClick={() => setViewMode('website')}
          className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer transition-all self-end sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Wróć do Oficjalnej Strony WWW (telepakt.pl)</span>
        </button>
      </div>

      {/* Navbar with brand name selector and Lock button */}
      <Navbar
        appName={selectedName}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNameSelector={() => setIsNameModalOpen(true)}
        callsCount={calls.length}
        onLockApp={handleLockApp}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'telepakt' && (
          <TelePaktMockupsStudio
            appName={selectedName}
          />
        )}
        
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 text-xs">
              <div className="flex items-center gap-2 text-indigo-300">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Aktywna uniwersalna marka: <strong className="text-white underline cursor-pointer" onClick={() => setIsNameModalOpen(true)}>{selectedName.name}</strong> ({selectedName.tagline}). Kliknij, aby porównać nazwy.
                </span>
              </div>
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-[11px] font-semibold whitespace-nowrap"
              >
                Porównaj nazwy All-in-One
              </button>
            </div>

            <InCallSimulator
              appName={selectedName}
              scripts={scripts}
              preselectedScript={preselectedScriptForSimulator}
              onCallLogged={handleCallLogged}
              onOpenComplaint={handleOpenComplaint}
              onAddCustomScript={handleAddCustomScript}
              onUpdateScripts={(newOrder) => setScripts(newOrder)}
              onResetScripts={() => setScripts(LEGAL_SCRIPTS)}
            />
          </div>
        )}

        {activeTab === 'usecases' && (
          <UseCasesExplorer
            appName={selectedName}
            onSelectUseCaseToTest={(script) => {
              setPreselectedScriptForSimulator(script);
              setActiveTab('simulator');
            }}
          />
        )}

        {activeTab === 'voice' && (
          <VoiceStudio
            appName={selectedName}
            scripts={scripts}
            onUpdateScript={handleUpdateScript}
            onAddCustomScript={handleAddCustomScript}
          />
        )}

        {activeTab === 'global_expansion' && (
          <GlobalStrategyView />
        )}

        {activeTab === 'downloads' && (
          <DownloadExportCenter
            appName={selectedName}
            onOpenSimulator={() => setActiveTab('simulator')}
            onOpenAnimation={() => setActiveTab('animation')}
            onOpenLegalHub={() => setActiveTab('legal_hub')}
          />
        )}

        {activeTab === 'animation' && (
          <InstructionAnimationStudio
            appName={selectedName}
            onOpenSimulator={() => setActiveTab('simulator')}
            onOpenDocuments={() => setActiveTab('legal_hub')}
          />
        )}

        {activeTab === 'legal_hub' && (
          <LegalAndBusinessHub
            appName={selectedName}
            onOpenSimulator={() => setActiveTab('simulator')}
            onOpenAnimation={() => setActiveTab('animation')}
          />
        )}

        {activeTab === 'legal' && (
          <LegalScriptsView />
        )}

        {activeTab === 'website' && (
          <WebsiteStrategyView
            appName={selectedName}
            onOpenAnimation={() => setActiveTab('animation')}
            onOpenLegalHub={() => setActiveTab('legal_hub')}
            onOpenAdminHub={() => setActiveTab('admin_hub')}
          />
        )}

        {activeTab === 'admin_hub' && (
          <AdminPanelHub
            appName={selectedName}
            onOpenWebsiteView={() => setActiveTab('website')}
          />
        )}

        {activeTab === 'complaints' && (
          <ComplaintGenerator
            appName={selectedName}
            initialCall={selectedCallForComplaint}
          />
        )}

        {activeTab === 'telephony' && (
          <CloudTelephonyView
            appName={selectedName}
          />
        )}

        {activeTab === 'python' && (
          <PythonProjectExplorer
            appName={selectedName}
          />
        )}

        {activeTab === 'history' && (
          <CallHistoryView
            appName={selectedName}
            calls={calls}
            onOpenComplaint={handleOpenComplaint}
            onUpdateCall={handleUpdateCall}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/90 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-slate-400">{selectedName.name}</span>
            <span>— System obrony prawnej przed telemarketingiem w Polsce</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Stan prawny: <strong>Ustawa PKE (10.11.2024)</strong></span>
            <span>•</span>
            <span>RODO (art. 21, 17, 15)</span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('python')}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Django & Render Backend (telepakt.pl)
            </button>
          </div>
        </div>
      </footer>

      {/* Name selector modal */}
      <NameSelectorModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        selectedName={selectedName}
        onSelectName={(name) => {
          setSelectedName(name);
          setIsNameModalOpen(false);
        }}
      />

    </div>
  );
}
