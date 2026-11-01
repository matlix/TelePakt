import React, { useState } from 'react';
import { AppNameOption } from '../types';
import {
  Shield, Smartphone, Globe, Download, Copy, Check, ExternalLink,
  Sparkles, CheckCircle2, Lock, Radio, Layers, Volume2, ArrowRight,
  Sliders, ShieldAlert, Cpu, Palette, Eye, PhoneCall, Phone, PhoneOff
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TelePaktMockupsStudioProps {
  appName: AppNameOption;
}

export const TelePaktMockupsStudio: React.FC<TelePaktMockupsStudioProps> = ({ appName }) => {
  const [activeTab, setActiveTab] = useState<'logo' | 'android' | 'ios' | 'website' | 'hostinger'>('logo');
  const [copiedDns, setCopiedDns] = useState<string | null>(null);

  const logoImagePath = '/src/assets/images/telepakt_logo_icon_1793197547893.jpg';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDns(id);
    setTimeout(() => setCopiedDns(null), 2500);
  };

  const handleDownloadLogoSvg = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f5d4"/>
      <stop offset="50%" stop-color="#00b4d8"/>
      <stop offset="100%" stop-color="#10b981"/>
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050b18"/>
      <stop offset="100%" stop-color="#0b172a"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="500" height="500" rx="110" fill="url(#bgGrad)"/>
  <!-- Outer Shield -->
  <path d="M250 85 C320 85 365 110 365 170 C365 270 295 340 250 365 C205 340 135 270 135 170 C135 110 180 85 250 85 Z" 
        fill="none" stroke="url(#shieldGrad)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"/>
  <!-- Phone Handset -->
  <path d="M210 170 C205 160 215 145 230 150 L245 158 C252 162 254 172 250 178 L242 190 C252 210 268 226 288 236 L300 228 C306 224 316 226 320 233 L328 248 C333 263 318 273 308 268 C250 245 205 200 182 142 Z" 
        fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Soundwaves -->
  <path d="M280 160 C295 175 295 205 280 220" fill="none" stroke="#00f5d4" stroke-width="6" stroke-linecap="round"/>
  <path d="M298 145 C322 170 322 210 298 235" fill="none" stroke="#00f5d4" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
  <path d="M316 130 C348 165 348 225 316 250" fill="none" stroke="#00f5d4" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
  <!-- Frequency audio beam -->
  <line x1="80" y1="230" x2="420" y2="230" stroke="#00f5d4" stroke-width="4" stroke-linecap="round" opacity="0.4"/>
  <!-- Typography -->
  <text x="250" y="420" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="900" font-size="44" fill="#ffffff" letter-spacing="8">TELEPAKT</text>
  <text x="250" y="445" text-anchor="middle" font-family="'Inter', sans-serif" font-weight="600" font-size="12" fill="#00f5d4" letter-spacing="4">TELEPAKT.PL</text>
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'telepakt-logo-vector.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 50, spread: 60 });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner with Domain Announcement */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Domena telepakt.pl zarejestrowana na Hostinger.com
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Palette className="w-3.5 h-3.5" />
                Identyfikacja Wizualna & Mockupy
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              TelePakt.pl — Studio Mockupów & Logo
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Znakomity wybór domeny! <strong>TelePakt</strong> (połączenie telekomunikacji, pewnego paktu i ochrony prawnej) to marka, która natychmiast budzi zaufanie i sprawia, że telemarketerzy oraz oszuści traktują Cię z najwyższym respektem. Poniżej znajdziesz kompletne makiety na <strong>Androida</strong>, <strong>iPhone'a</strong>, stronę <strong>telepakt.pl</strong> oraz unikalne logo.
            </p>
          </div>

          {/* Quick Domain Badge Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2 shrink-0">
            <div className="text-[11px] text-slate-400 font-medium">Zakupiona domena:</div>
            <div className="text-xl font-black text-emerald-400 font-mono flex items-center gap-2">
              <span>telepakt.pl</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-sans font-bold">AKTYWNA</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Rejestrator: <strong>Hostinger.com</strong> • Gotowa do podpięcia
            </div>
          </div>
        </div>

        {/* Navigation Tabs for Mockups */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-4">
          <button
            onClick={() => setActiveTab('logo')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'logo'
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            1. Unikalne Logo TelePakt
          </button>

          <button
            onClick={() => setActiveTab('android')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'android'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            2. Mockup Android (Dialer & Suwak)
          </button>

          <button
            onClick={() => setActiveTab('ios')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'ios'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            3. Mockup iPhone iOS (CallKit & Dynamic Island)
          </button>

          <button
            onClick={() => setActiveTab('website')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'website'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Globe className="w-4 h-4" />
            4. Mockup Strony WWW (telepakt.pl)
          </button>

          <button
            onClick={() => setActiveTab('hostinger')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'hostinger'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4" />
            5. Podpięcie DNS Hostinger ➔ Render
          </button>
        </div>
      </div>

      {/* 1. LOGO & BRAND IDENTITY TAB */}
      {activeTab === 'logo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Generated High-Res Logo Asset Card */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 text-center flex flex-col items-center shadow-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                Oficjalna Ikona TelePakt (App Icon)
              </span>

              {/* Generated Image display */}
              <div className="relative group">
                <div className="w-56 h-56 rounded-[44px] overflow-hidden border-2 border-cyan-500/40 shadow-2xl shadow-cyan-500/20 ring-4 ring-slate-800/60">
                  <img
                    src={logoImagePath}
                    alt="TelePakt Official App Icon"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 rounded-[44px] ring-1 ring-inset ring-white/20 pointer-events-none" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white tracking-wider">
                  TELEPAKT
                </h3>
                <p className="text-xs text-cyan-300 font-mono">
                  telepakt.pl • LegalTech & Voice Shield
                </p>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed text-left">
                Logo łączy trzy kluczowe symbole produktu: <strong>słuchawkę telefoniczną</strong> (połączenia), <strong>puklerz/tarczę</strong> (obrona prawna, PKE 2024 i RODO) oraz <strong>falę akustyczną</strong> (dowód audio i Twoje własne odpowiedzi).
              </p>

              <div className="w-full pt-2 flex flex-col gap-2">
                <button
                  onClick={handleDownloadLogoSvg}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Pobierz wektorowe logo (SVG 500x500)
                </button>
              </div>
            </div>

            {/* Right: Brand Colors, Typography & Variants */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Brand Guidelines Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  Paleta Barw & Typografia Marki TelePakt
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                    <div className="w-full h-10 rounded-lg bg-[#00f5d4] shadow-sm mb-2" />
                    <span className="text-[11px] font-bold text-white block">Cyber Cyan</span>
                    <span className="text-[10px] text-slate-400 font-mono">#00F5D4</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                    <div className="w-full h-10 rounded-lg bg-[#0b172a] border border-slate-700 shadow-sm mb-2" />
                    <span className="text-[11px] font-bold text-white block">Deep Navy</span>
                    <span className="text-[10px] text-slate-400 font-mono">#0B172A</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                    <div className="w-full h-10 rounded-lg bg-[#10b981] shadow-sm mb-2" />
                    <span className="text-[11px] font-bold text-white block">Legal Emerald</span>
                    <span className="text-[10px] text-slate-400 font-mono">#10B981</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 text-center">
                    <div className="w-full h-10 rounded-lg bg-[#6366f1] shadow-sm mb-2" />
                    <span className="text-[11px] font-bold text-white block">Pact Indigo</span>
                    <span className="text-[10px] text-slate-400 font-mono">#6366F1</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-white">Dlaczego ta stylistyka budzi respekt?</span>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    Zestawienie głębokiego granatu z neonowym turkusem i szmaragdem to standard nowoczesnych systemów <em>Cybersecurity & LegalTech</em>. Sprawia, że konsultanci call center natychmiast wyczuwają technologiczną i prawną przewagę.
                  </p>
                </div>
              </div>

              {/* Logo in Multiple Contexts */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  Warianty użycia Logo TelePakt
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dark Mode Horizontal Header */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-cyan-500/30">
                      <img src={logoImagePath} alt="Logo" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="font-black text-white text-base tracking-wider">TELEPAKT</div>
                      <div className="text-[10px] text-cyan-400 font-mono">telepakt.pl</div>
                    </div>
                  </div>

                  {/* App Store Badge format */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-md">
                        <img src={logoImagePath} alt="App Store" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">TelePakt: Ochrona Rozmów</div>
                        <div className="text-[10px] text-amber-400">★★★★★ 4.9 (2.1k ocen)</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold">Pobierz</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 2. ANDROID APP MOCKUP TAB */}
      {activeTab === 'android' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Phone Bezel */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] aspect-[9/19] bg-slate-950 rounded-[44px] p-3 border-4 border-slate-800 shadow-2xl ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden relative">
                
                {/* Punch hole camera */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-4 bg-black rounded-full border border-slate-800 z-30" />

                {/* Screen */}
                <div className="w-full h-full bg-slate-900 rounded-[34px] overflow-hidden flex flex-col justify-between p-4 pt-8 text-white relative">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
                    <span>11:42</span>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400">5G</span>
                      <span>Play / Plus</span>
                    </div>
                  </div>

                  {/* Android Ongoing Call Header */}
                  <div className="text-center space-y-1 mt-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Spam Fotowoltaika • 142 zgłoszenia
                    </span>
                    <h3 className="text-xl font-bold font-mono tracking-tight">+48 22 104 39 88</h3>
                    <p className="text-xs text-slate-300">Call Center Nieznana Sp. z o.o.</p>
                    <p className="text-[11px] font-mono text-emerald-400 font-bold">00:38 (TelePakt chroni)</p>
                  </div>

                  {/* Android Floating Bubble Panel */}
                  <div className="p-3 rounded-2xl bg-slate-950/95 border border-cyan-500/40 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-300 flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        TelePakt Auto-Merge
                      </span>
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
                        Android 14+
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-medium text-[11px] flex items-center justify-between">
                        <span>🛡️ Sprzeciw RODO + PKE 2024</span>
                        <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">AKTYWNY</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                        ⚖️ Zarzut przedawnienia długu
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px]">
                        💼 Umowa ustna B2B (Wycena)
                      </div>
                    </div>
                  </div>

                  {/* Android Dialer Action Buttons */}
                  <div className="space-y-3">
                    <div className="flex justify-around items-center pt-2">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <Volume2 className="w-5 h-5" />
                      </div>
                      <div className="w-14 h-14 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                        <PhoneOff className="w-6 h-6" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
                        <Sliders className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Android Home Bar */}
                    <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto" />
                  </div>
                </div>
              </div>
            </div>

            {/* Android Feature Explanations */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  Jak działa TelePakt na telefonach z Androidem?
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-white block">1. Rola Domyślnej Aplikacji Telefonu (Default Dialer)</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Na Androidzie TelePakt może działać jako Twój domyślny dialer. Oznacza to, że zyskujesz pełny customowy ekran rozmowy z pływającym panelem suwaków TelePakt.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-emerald-400 block">2. Auto-Merge w 1 sekundę</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Wybierasz formułę, a TelePakt w ułamku sekundy zestawia konferencję 3-stronną w tle za pomocą natywnego Android Telecom Framework, bez konieczności klikania „Scal”.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-cyan-400 block">3. Pływający bąbelek (Chathead Bubble)</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Nawet jeśli zminimalizujesz ekran rozmowy i otworzysz inną aplikację, bąbelek TelePakt pozostaje na ekranie gotowy do natychmiastowej obrony.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3. IOS (IPHONE) APP MOCKUP TAB */}
      {activeTab === 'ios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* iPhone Bezel */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] aspect-[9/19] bg-slate-950 rounded-[48px] p-3 border-4 border-slate-800 shadow-2xl ring-1 ring-slate-700/50 flex flex-col justify-between overflow-hidden relative">
                
                {/* Dynamic Island */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full border border-slate-800 z-30 flex items-center justify-between px-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span className="text-[9px] font-bold text-white">TelePakt</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                {/* iOS Screen */}
                <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-[38px] overflow-hidden flex flex-col justify-between p-4 pt-11 text-white relative">
                  
                  {/* Status */}
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-1">
                    <span>09:41</span>
                    <span>VoLTE • 5G</span>
                  </div>

                  {/* iOS CallKit Caller Area */}
                  <div className="text-center space-y-1 mt-3">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 mx-auto flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-white mt-2">+48 22 104 39 88</h3>
                    <p className="text-xs text-rose-400 font-medium">⚠️ Zgłoszenie TelePakt: Telemarketing</p>
                    <p className="text-[11px] text-slate-400">Połączenie trójstronne aktywne</p>
                  </div>

                  {/* iOS 3-Way Merge Prompter */}
                  <div className="p-3 rounded-2xl bg-blue-950/60 border border-blue-500/40 text-center space-y-1.5 animate-in zoom-in-95">
                    <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                      <PhoneCall className="w-3.5 h-3.5 text-blue-400" />
                      Scal rozmowy (Merge calls)
                    </div>
                    <p className="text-[10px] text-slate-300 leading-tight">
                      Kliknij systemowy przycisk na iPhonie, aby wpuścić bota TelePakt do rozmowy.
                    </p>
                  </div>

                  {/* iOS Call Grid */}
                  <div className="grid grid-cols-3 gap-3 text-center text-xs py-2">
                    <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                      <Volume2 className="w-5 h-5 mx-auto mb-1 text-slate-300" />
                      <span className="text-[10px] text-slate-400">Głośnik</span>
                    </div>
                    <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-2xl">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                      <span className="text-[10px] text-cyan-300 font-bold">TelePakt</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                      <PhoneOff className="w-5 h-5 mx-auto mb-1 text-rose-400" />
                      <span className="text-[10px] text-slate-400">Rozłącz</span>
                    </div>
                  </div>

                  {/* iOS Home Bar */}
                  <div className="w-28 h-1 bg-slate-600 rounded-full mx-auto" />
                </div>
              </div>
            </div>

            {/* iOS Architecture features */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <Smartphone className="w-4 h-4" />
                  Specyfika działania TelePakt na iPhone (iOS)
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-white block">1. Dynamic Island & Live Activities</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      TelePakt integruje się z tzw. <em>Live Activities</em> w iOS. W trakcie połączenia w „Dynamicznej Wyspie” na górze ekranu widzisz status obrony i czas obecności bota.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-blue-400 block">2. CallKit & Blokowanie Identyfikatora</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Aplikacja wgrywa do systemowej bazy iOS listę tysięcy zidentyfikowanych numerów telemarketingowych w Polsce, dzięki czemu na ekranie blokady widzisz ostrzeżenie jeszcze przed odebraniem.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-emerald-400 block">3. Zgodność z wytycznymi App Store & Google Play</strong>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Mechanizm konferencji 3-stronnej jest w 100% zgodny z oficjalnymi wytycznymi bezpieczeństwa systemów mobilnych i nie narusza żadnych polityk prywatności.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 4. WEBSITE MOCKUP (TELEPAKT.PL) */}
      {activeTab === 'website' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Browser top chrome */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>

              <div className="flex-1 max-w-lg bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-200">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">https://</span>
                <span className="font-bold text-white">telepakt.pl</span>
                <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-sans font-semibold">
                  HOSTINGER DNS
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Certyfikat SSL Let's Encrypt
              </div>
            </div>

            {/* Mockup Website Content */}
            <div className="p-6 sm:p-12 space-y-12 bg-slate-950">
              
              {/* Web Navbar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-cyan-500/40">
                    <img src={logoImagePath} alt="TelePakt Logo" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="font-black text-white tracking-wider text-lg">TELEPAKT</span>
                    <span className="text-[10px] text-cyan-400 font-mono block leading-none">telepakt.pl</span>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-6 text-xs text-slate-300 font-medium">
                  <span className="hover:text-cyan-400 cursor-pointer">Jak to działa</span>
                  <span className="hover:text-cyan-400 cursor-pointer">Prawo PKE 2024</span>
                  <span className="hover:text-cyan-400 cursor-pointer">B2B i Umowy</span>
                  <span className="hover:text-cyan-400 cursor-pointer">Cennik</span>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md">
                    Pobierz Aplikację
                  </button>
                </div>
              </div>

              {/* Web Hero */}
              <div className="max-w-4xl mx-auto text-center space-y-5 py-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                  Oficjalny serwis domeny telepakt.pl
                </div>

                <h1 className="text-3xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                  Zawrzyj Pakt w każdej rozmowie. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
                    Ochrona prawna i Twoje odpowiedzi.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Zablokuj telemarketerów i boty reklamowe na gruncie art. 398 PKE, zabezpiecz się przed oszustami bankowymi i zamień telefoniczne ustalenia biznesowe w wiążącą umowę ustną.
                </p>

                {/* App Download Buttons on Website */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <div className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-white flex items-center gap-3 cursor-pointer transition-all shadow-xl">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <div className="text-left text-xs">
                      <span className="text-[10px] text-slate-400 block leading-none">Pobierz dla systemu</span>
                      <strong className="text-xs">Android (Google Play)</strong>
                    </div>
                  </div>

                  <div className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-white flex items-center gap-3 cursor-pointer transition-all shadow-xl">
                    <Smartphone className="w-5 h-5 text-blue-400" />
                    <div className="text-left text-xs">
                      <span className="text-[10px] text-slate-400 block leading-none">Pobierz dla systemu</span>
                      <strong className="text-xs">iOS (App Store)</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Spam Directory tool on the site */}
              <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block text-center">
                  Darmowa wyszukiwarka numerów na telepakt.pl
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue="+48 22 104 39 88"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                  />
                  <button className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl">
                    Sprawdź numer
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 5. HOSTINGER DNS CONFIGURATION GUIDE */}
      {activeTab === 'hostinger' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">
                  Instrukcja Techniczna dla Właściciela Domeny:
                </span>
                <h3 className="text-xl font-bold text-white">
                  Jak podpiąć zakupioną domenę telepakt.pl (Hostinger) do serwera Render?
                </h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                Czas wdrożenia: ~3 minuty
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Kupiłeś domenę <strong>telepakt.pl</strong> na <strong>Hostinger.com</strong>, a Twój backend w Pythonie (FastAPI) działa na <strong>Render.com</strong>. Aby strona i webhooki Twilio działały pod adresem <code className="text-cyan-300 font-mono">https://telepakt.pl</code>, wystarczy dodać 2 rekordy w panelu DNS Hostinger:
            </p>

            {/* DNS Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Typ rekordu</th>
                    <th className="p-3">Nazwa / Host</th>
                    <th className="p-3">Wartość docelowa (Point to)</th>
                    <th className="p-3">TTL</th>
                    <th className="p-3 text-right">Kopiuj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/60 text-slate-200">
                  <tr>
                    <td className="p-3 font-bold text-cyan-400">A</td>
                    <td className="p-3">@</td>
                    <td className="p-3 text-white font-bold">216.24.57.1</td>
                    <td className="p-3 text-slate-400">300 (lub auto)</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => copyToClipboard('216.24.57.1', 'dns-a')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
                      >
                        {copiedDns === 'dns-a' ? '✓ Skopiowano' : 'Kopiuj IP'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-indigo-400">CNAME</td>
                    <td className="p-3">www</td>
                    <td className="p-3 text-white font-bold">tarczarodo-telephony-backend.onrender.com</td>
                    <td className="p-3 text-slate-400">300 (lub auto)</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => copyToClipboard('tarczarodo-telephony-backend.onrender.com', 'dns-cname')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[11px] text-slate-300"
                      >
                        {copiedDns === 'dns-cname' ? '✓ Skopiowano' : 'Kopiuj CNAME'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Steps in Hostinger */}
            <div className="space-y-3 pt-2 text-xs">
              <span className="font-bold text-white uppercase tracking-wider block">
                Kroki w panelu Hostinger.com:
              </span>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                <li>Zaloguj się na <strong>Hostinger.com</strong> i wejdź w zakładkę <strong>Domeny</strong> ➔ wybierz <strong>telepakt.pl</strong>.</li>
                <li>Kliknij <strong>DNS / Name serwery</strong> w lewym menu.</li>
                <li>W sekcji <em>Zarządzaj rekordami DNS</em> dodaj powyższy rekord <strong>A</strong> (dla `@`) oraz <strong>CNAME</strong> (dla `www`).</li>
                <li>W panelu <strong>Render.com</strong> w zakładce <em>Custom Domains</em> wpisz: <code className="text-cyan-300 font-mono">telepakt.pl</code> oraz <code className="text-cyan-300 font-mono">www.telepakt.pl</code>.</li>
                <li>Render automatycznie wygeneruje darmowy certyfikat SSL (zielona kłódka HTTPS)!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
