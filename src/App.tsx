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
import { Shield, Sparkles, Scale, Terminal, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [selectedName, setSelectedName] = useState<AppNameOption>(APP_NAMES[0]);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('telepakt');
  const [scripts, setScripts] = useState<LegalScript[]>(LEGAL_SCRIPTS);
  const [calls, setCalls] = useState<CallLog[]>(INITIAL_CALL_LOGS);
  const [selectedCallForComplaint, setSelectedCallForComplaint] = useState<CallLog | null>(null);
  const [preselectedScriptForSimulator, setPreselectedScriptForSimulator] = useState<LegalScript | null>(null);

  // Staging Password Protection State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if previously authenticated in this browser
    return localStorage.getItem('telepakt_staging_authenticated') === 'true';
  });
  const [isGateEnabled, setIsGateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('telepakt_staging_gate_enabled') !== 'false';
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Staging Early Access Password Gate */}
      {isGateEnabled && !isAuthenticated && (
        <AccessGateModal
          onAuthenticated={() => setIsAuthenticated(true)}
        />
      )}

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
