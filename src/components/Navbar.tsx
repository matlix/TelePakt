import React from 'react';
import { AppNameOption } from '../types';
import {
  Shield, Smartphone, Mic, Scale, FileText, Server,
  Code, History, Sparkles, ChevronDown, Check, Lightbulb, Globe,
  Film, TrendingUp, FolderDown, Download, Lock
} from 'lucide-react';

import logoImage from '../assets/images/telepakt_logo_icon_1793197547893.jpg';

export type ActiveTab = 'telepakt' | 'simulator' | 'downloads' | 'global_expansion' | 'animation' | 'legal_hub' | 'website' | 'admin_hub' | 'usecases' | 'voice' | 'legal' | 'complaints' | 'telephony' | 'python' | 'history';

interface NavbarProps {
  appName: AppNameOption;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenNameSelector: () => void;
  callsCount: number;
  onLockApp?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  appName,
  activeTab,
  onSelectTab,
  onOpenNameSelector,
  callsCount,
  onLockApp,
}) => {
  const [logoErr, setLogoErr] = React.useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'telepakt', label: 'TelePakt.pl & Logo', icon: <Shield className="w-4 h-4 text-cyan-400" />, badge: 'Logo & Makiety' },
    { id: 'simulator', label: 'Symulator Rozmowy', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'global_expansion', label: 'Ekspansja Globalna (Świat)', icon: <Globe className="w-4 h-4 text-cyan-400" />, badge: 'USA / EU / UK' },
    { id: 'downloads', label: 'Pobierz Projekt (.ZIP)', icon: <FolderDown className="w-4 h-4 text-emerald-400" />, badge: 'Całość + Pliki' },
    { id: 'animation', label: 'Wideo & Animacje', icon: <Film className="w-4 h-4 text-cyan-400" />, badge: 'TikTok / YT' },
    { id: 'legal_hub', label: 'Prawo, Biznes & Dokumenty', icon: <Scale className="w-4 h-4 text-emerald-400" />, badge: 'Analiza + ToS' },
    { id: 'website', label: 'Strona WWW (telepakt.pl)', icon: <Globe className="w-4 h-4 text-emerald-400" />, badge: 'Hostinger' },
    { id: 'admin_hub', label: 'Panel Admina & Opinie', icon: <Lock className="w-4 h-4 text-amber-400" />, badge: 'Nowość' },
    { id: 'usecases', label: 'Inne Zastosowania', icon: <Lightbulb className="w-4 h-4 text-amber-400" /> },
    { id: 'voice', label: 'Studio Głosu', icon: <Mic className="w-4 h-4" /> },
    { id: 'legal', label: 'Formuły Prawne', icon: <Scale className="w-4 h-4 text-slate-400" /> },
    { id: 'complaints', label: 'Generator Skarg', icon: <FileText className="w-4 h-4" /> },
    { id: 'telephony', label: 'Architektura Chmury', icon: <Server className="w-4 h-4" /> },
    { id: 'python', label: 'Django & Render (telepakt.pl)', icon: <Code className="w-4 h-4 text-emerald-400" />, badge: 'Django 5' },
    { id: 'history', label: 'Rejestr Rozmów', icon: <History className="w-4 h-4" />, badge: callsCount > 0 ? `${callsCount}` : undefined },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand Switcher Trigger */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onSelectTab('telepakt')}
              className="w-10 h-10 rounded-xl overflow-hidden border border-cyan-500/50 shadow-lg shadow-cyan-500/20 cursor-pointer shrink-0 flex items-center justify-center bg-slate-900"
              title="Przejdź do studia TelePakt & Logo"
            >
              {!logoErr ? (
                <img 
                  src={logoImage} 
                  alt="TelePakt Logo" 
                  onError={() => setLogoErr(true)}
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Shield className="w-6 h-6 text-cyan-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>{appName.name}</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                    telepakt.pl
                  </span>
                </h1>
                
                {/* Brand Selector Button */}
                <button
                  onClick={onOpenNameSelector}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors"
                  title="Wybierz nazwę spośród opracowanych propozycji"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Zmień markę</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
              </div>

              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[280px] sm:max-w-md hidden sm:block">
                {appName.tagline}
              </p>
            </div>
          </div>

          {/* Quick status badges & Download CTA */}
          <div className="flex items-center gap-3 text-xs">
            <div className="hidden lg:flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                Prawo: <strong className="text-emerald-400">PKE art. 398 (2024)</strong>
              </span>
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                Platformy: <strong className="text-indigo-400">Android & iOS</strong>
              </span>
            </div>

            {/* Staging Access Lock Button */}
            <button
              onClick={onLockApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
              title="Aplikacja chroniona hasłem. Kliknij, aby zablokować i przetestować ekran logowania."
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Blokada Hasłem</span>
            </button>

            <button
              onClick={() => onSelectTab('downloads')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
              title="Pobierz kompletny pakiet projektu (ZIP)"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Pobierz Projekt (.ZIP)</span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-900">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
