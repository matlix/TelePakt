import React, { useState, useEffect } from 'react';
import { AppNameOption, LegalScript, CallLog, UserAccount } from '../types';
import {
  Shield, Smartphone, PhoneCall, History, Settings,
  Globe, CheckCircle2, AlertTriangle, ArrowRight, Volume2, Search,
  Copy, Check, Info, RefreshCw, Zap, Sparkles, ExternalLink,
  ChevronRight, Lock, PhoneOff, User, LogOut, Key, Eye, EyeOff,
  Bell, FileText, ToggleLeft, ToggleRight
} from 'lucide-react';
import { InCallSimulator } from './InCallSimulator';
import { CallHistoryView } from './CallHistoryView';
import { ComplaintGenerator } from './ComplaintGenerator';
import { FakeCallModal } from './FakeCallModal';
import { LegalDocumentModal, LegalDocType } from './LegalDocumentModal';
import { authService } from '../services/authService';
import { spamDatabaseService, LookupResult } from '../services/spamDatabaseService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import logoImage from '../assets/images/telepakt_logo_icon_1793197547893.jpg';

export type MobileTab = 'shield' | 'call' | 'logs' | 'panel' | 'settings';

interface TelePaktMobileAppProps {
  appName: AppNameOption;
  scripts: LegalScript[];
  calls: CallLog[];
  onCallLogged: (log: CallLog) => void;
  onOpenComplaint: (log: CallLog) => void;
  selectedCallForComplaint: CallLog | null;
  onUpdateScript: (script: LegalScript) => void;
  onAddCustomScript: (script: LegalScript) => void;
  onUpdateCall: (call: CallLog) => void;
  onSwitchToWebsite: () => void;
}

export const TelePaktMobileApp: React.FC<TelePaktMobileAppProps> = ({
  appName,
  scripts,
  calls,
  onCallLogged,
  onOpenComplaint,
  selectedCallForComplaint,
  onUpdateScript,
  onAddCustomScript,
  onUpdateCall,
  onSwitchToWebsite,
}) => {
  const [activeTab, setActiveTab] = useState<MobileTab>('shield');
  const [isFakeCallOpen, setIsFakeCallOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalDocType | null>(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    // Check if user previously elected guest mode
    return localStorage.getItem('telepakt_guest_mode') === 'true';
  });

  // Login / Registration Form State for unauthenticated Android welcome view
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('+48 ');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appleRelayOption, setAppleRelayOption] = useState(true);

  // User Panel State (Protected Phone Number Editor)
  const [phoneInput, setPhoneInput] = useState(currentUser?.phoneProtected || '+48 500 123 456');
  const [phoneSaveSuccess, setPhoneSaveSuccess] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // Android Quick Settings Toggles
  const [autoRejectSpam, setAutoRejectSpam] = useState(true);
  const [recordEvidence, setRecordEvidence] = useState(true);
  const [blockPrivateNumbers, setBlockPrivateNumbers] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<'tomasz' | 'joanna' | 'custom'>('tomasz');
  const [delaySec, setDelaySec] = useState<number>(0);

  useEffect(() => {
    return authService.subscribe((u) => {
      setCurrentUser(u);
      if (u) {
        setIsGuestMode(false);
        if (u.phoneProtected) {
          setPhoneInput(u.phoneProtected);
        }
      }
    });
  }, []);

  // Search number state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<LookupResult | null>(null);
  const [copiedNumber, setCopiedNumber] = useState(false);

  // PWA install state
  const { isInstalled, isInstallable, install } = usePWAInstall();

  // Assistant Conference Hotline number
  const ASSISTANT_GATEWAY_NUMBER = '+48 22 104 39 80';

  const handleSearchNumber = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = spamDatabaseService.lookupNumber(searchQuery);
    setSearchResult(res);
  };

  const handleCopyGateway = () => {
    navigator.clipboard.writeText(ASSISTANT_GATEWAY_NUMBER.replace(/\s+/g, ''));
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2500);
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const email = authEmail.includes('@') ? authEmail : 'matlix@gmail.com';
      await authService.loginWithGoogle(email);
    } catch (err: any) {
      setAuthError(err.message || 'Logowanie przez Google nie powiodło się.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await authService.loginWithApple(appleRelayOption);
    } catch (err: any) {
      setAuthError(err.message || 'Logowanie przez Apple ID nie powiodło się.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'register') {
        if (!authEmail || !authPassword || !authName) {
          throw new Error('Wypełnij imię, adres e-mail i hasło.');
        }
        if (authPassword.length < 6) {
          throw new Error('Hasło musi mieć co najmniej 6 znaków.');
        }
        const user = await authService.registerWithEmail(authName, authEmail, authPassword);
        if (authPhone.trim() && authPhone !== '+48 ') {
          await authService.updateProfile({ phoneProtected: authPhone });
        }
      } else {
        if (!authEmail || !authPassword) {
          throw new Error('Podaj adres e-mail i hasło.');
        }
        await authService.loginWithEmail(authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Wystąpił błąd logowania. Spróbuj ponownie.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPhone(true);
    try {
      await authService.updateProfile({ phoneProtected: phoneInput });
      setPhoneSaveSuccess(true);
      setTimeout(() => setPhoneSaveSuccess(false), 2500);
    } catch (err: any) {
      console.error('Error saving phone:', err);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSignOut = async () => {
    await authService.logout();
    localStorage.removeItem('telepakt_guest_mode');
    setIsGuestMode(false);
    setActiveTab('shield');
  };

  const handleEnterGuestMode = () => {
    localStorage.setItem('telepakt_guest_mode', 'true');
    setIsGuestMode(true);
  };

  // =========================================================================
  // VIEW 1: ANDROID LOGIN & REGISTRATION SCREEN (WHEN NOT LOGGED IN & NOT GUEST)
  // =========================================================================
  if (!currentUser && !isGuestMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none p-4 sm:p-6 justify-center items-center">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Top Brand & Android Shield Glow */}
          <div className="text-center space-y-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-slate-950 flex items-center justify-center">
              <img 
                src={logoImage} 
                alt="TelePakt Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.src = '/telepakt_logo.jpg'; }}
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider font-mono">
                Polska Tarcza Anty-Spam • PKE Art. 398
              </div>
              <h2 className="text-2xl font-black text-white mt-1.5">
                TelePakt<span className="text-cyan-400">.pl</span>
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Zaloguj się lub utwórz konto, aby aktywować automatyczny sprzeciw i ochronę numeru.
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {authError && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Quick One-Tap OAuth Buttons (Google & Apple) */}
          <div className="space-y-2.5">
            {/* Google Gmail Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{authLoading ? 'Logowanie...' : 'Kontynuuj z kontem Google (Gmail)'}</span>
            </button>

            {/* Apple ID Button */}
            <button
              onClick={handleAppleLogin}
              disabled={authLoading}
              className="w-full py-3 px-4 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center gap-3 shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.94-14.34-5.74-8.8-10.28-18.73-13.62-29.77-3.34-11.05-5.02-21.72-5.02-32.02 0-14.12 3.57-25.99 10.72-35.6 7.15-9.61 16.48-14.52 27.99-14.74 4.58 0 9.87 1.25 15.86 3.76 5.99 2.5 9.77 3.82 11.35 3.94 1.34-.13 5.39-1.5 12.16-4.13 6.77-2.63 12.35-3.76 16.74-3.4 12.44.88 22.36 5.48 29.78 13.8-10.86 6.59-16.17 15.58-15.93 26.96.25 9.17 3.79 16.89 10.63 23.16 6.84 6.27 15.11 9.75 24.81 10.45-2.02 6.07-4.54 12.28-7.58 18.63zM119.22 31.84c0-7.39 2.68-14.41 8.04-21.05 5.36-6.64 12.04-10.79 20.04-12.45.13 1.04.19 1.95.19 2.73 0 7.39-2.82 14.44-8.46 21.16-5.64 6.71-12.4 10.84-20.27 12.39-.12-1.04-.18-1.95-.18-2.78z" />
              </svg>
              <span>{authLoading ? 'Logowanie...' : 'Zaloguj się przez Apple ID'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800"></div>
            <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">LUB E-MAIL</span>
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          {/* Tab Switcher: Logowanie / Rejestracja */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Logowanie
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setAuthError(null); }}
              className={`py-2 rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rejestracja
            </button>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Imię i Nazwisko / Nazwa Firmy:
                </label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="np. Jan Kowalski"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Adres E-mail:
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="twoj.email@poczta.pl"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Chroniony numer telefonu (do sprzeciwu):
                </label>
                <input
                  type="tel"
                  value={authPhone}
                  onChange={(e) => setAuthPhone(e.target.value)}
                  placeholder="+48 500 123 456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Hasło (min. 6 znaków):
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/25 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {authLoading 
                ? 'Przetwarzanie...' 
                : authMode === 'register' 
                ? 'Utwórz konto i Aktywuj Tarczę' 
                : 'Zaloguj się do aplikacji'}
            </button>
          </form>

          {/* Guest Mode Explorer Option */}
          <div className="pt-2 border-t border-slate-800/80 text-center space-y-2">
            <button
              onClick={handleEnterGuestMode}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 cursor-pointer"
            >
              Przejdź do aplikacji jako gość (Tryb natychmiastowy) ➔
            </button>
            <p className="text-[10px] text-slate-500">
              Bezpieczeństwo Zero-Storage: Twoje nagrania i dane nie są wysyłane na serwery zewnętrzne.
            </p>
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED SIMPLIFIED ANDROID APPLICATION LOOK & FUNCTIONALITY
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-24">
      
      {/* 1. NATIVE ANDROID STATUS BAR & APP BAR */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between gap-2">
          
          {/* Brand Logo & Android Status Pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-900 shrink-0">
              <img 
                src={logoImage} 
                alt="TelePakt Logo" 
                className="w-full h-full object-cover" 
                onError={(e) => { e.currentTarget.src = '/telepakt_logo.jpg'; }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white tracking-tight">TelePakt</span>
                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  autoRejectSpam 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${autoRejectSpam ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {autoRejectSpam ? 'Tarcza Aktywna' : 'Wstrzymana'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono truncate">
                {currentUser?.phoneProtected || phoneInput || '+48 500 123 456'}
              </p>
            </div>
          </div>

          {/* Android Right Actions: Test Call & User Profile Avatar */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Direct Fake Call Button */}
            <button
              onClick={() => setIsFakeCallOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs cursor-pointer transition-all active:scale-95"
              title="Wywołaj próbne połączenie testowe na ten telefon"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Testuj</span>
            </button>

            {/* User Profile Pill */}
            {currentUser ? (
              <button
                onClick={() => setActiveTab('panel')}
                className={`flex items-center gap-1.5 p-1 sm:px-2 rounded-xl border transition-colors cursor-pointer ${
                  activeTab === 'panel'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-white hover:border-slate-700'
                }`}
                title="Panel Użytkownika"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                  {currentUser.photoUrl ? (
                    <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold truncate max-w-[65px]">
                  {currentUser.name.split(' ')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsGuestMode(false)}
                className="px-2.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Zaloguj
              </button>
            )}
          </div>

        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT TABS */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 space-y-4">
        
        {/* =================================================================== */}
        {/* TAB 1: TARCZA (MAIN ANDROID SECURITY DASHBOARD) */}
        {/* =================================================================== */}
        {activeTab === 'shield' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Material 3 Android Status Hero Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/30 shadow-xl shadow-cyan-500/10 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    TELEPAKT ANDROID CORE
                  </span>
                  <h2 className="text-xl font-black text-white mt-0.5">
                    Twój Telefon Jest Chroniony
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Automatyczny sprzeciw prawny z <strong>art. 398 PKE</strong> i <strong>art. 21 RODO</strong> gotowy do natychmiastowego wygłoszenia.
                  </p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-inner">
                  <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
              </div>

              {/* Android Quick Toggle Tiles */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => setAutoRejectSpam(!autoRejectSpam)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    autoRejectSpam
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase font-mono">Auto-Sprzeciw</span>
                    {autoRejectSpam ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                  </div>
                  <div className="text-xs font-bold text-white">Art. 398 PKE</div>
                  <div className="text-[10px] text-slate-400">{autoRejectSpam ? 'Włączony' : 'Wyłączony'}</div>
                </button>

                <button
                  onClick={() => setRecordEvidence(!recordEvidence)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    recordEvidence
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase font-mono">Dowód Audio</span>
                    {recordEvidence ? <ToggleRight className="w-5 h-5 text-cyan-400" /> : <ToggleLeft className="w-5 h-5 text-slate-600" />}
                  </div>
                  <div className="text-xs font-bold text-white">Suma SHA-256</div>
                  <div className="text-[10px] text-slate-400">{recordEvidence ? 'Zero-Storage' : 'Wyłączone'}</div>
                </button>
              </div>

              {/* Primary Action Button: Launch Fake Call Test */}
              <button
                onClick={() => setIsFakeCallOpen(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2.5 cursor-pointer transition-transform active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-slate-950 animate-bounce" />
                <span>Wywołaj Próbne Połączenie Anty-Spam</span>
              </button>
            </div>

            {/* Offline Number Search / Spam Lookup Widget */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-xs">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Sprawdź podejrzany numer offline</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">0 ms • 0 zł</span>
              </div>

              <form onSubmit={handleSearchNumber} className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Wpisz numer (np. 22 104 39 88)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchResult) setSearchResult(null);
                  }}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Szukaj
                </button>
              </form>

              {searchResult && (
                <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                  searchResult.isValid && searchResult.record.riskLevel !== 'safe'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}>
                  <div className="font-bold font-mono">{searchResult.record.number}</div>
                  <div>{searchResult.record.name}</div>
                  <div className="text-[10px] opacity-80">
                    Wskaźnik Tellows: {searchResult.record.tellowsScore}/9 • Kategoria: {searchResult.record.category}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Gateway Hotline Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block uppercase">
                  Numer Asystenta Prawnego
                </span>
                <div className="text-sm font-black text-white font-mono">{ASSISTANT_GATEWAY_NUMBER}</div>
                <p className="text-[10px] text-slate-400">Dołącz asystenta jednym kliknięciem podczas rozmowy</p>
              </div>

              <button
                onClick={handleCopyGateway}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNumber ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: ROZMOWA (INTERACTIVE IN-CALL SIMULATOR) */}
        {/* =================================================================== */}
        {activeTab === 'call' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <InCallSimulator
              appName={appName}
              scripts={scripts}
              onCallLogged={onCallLogged}
              onOpenComplaint={(log) => {
                onOpenComplaint(log);
                setActiveTab('logs');
              }}
              onAddCustomScript={onAddCustomScript}
            />
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: REJESTR DOWODOWY & ZAWIADOMIENIA UKE */}
        {/* =================================================================== */}
        {activeTab === 'logs' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {selectedCallForComplaint ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-200">Zawiadomienie Prezesa UKE</span>
                  <button
                    onClick={() => onOpenComplaint(null as any)}
                    className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    Wróć do listy
                  </button>
                </div>
                <ComplaintGenerator
                  appName={appName}
                  initialCall={selectedCallForComplaint}
                />
              </div>
            ) : (
              <CallHistoryView
                appName={appName}
                calls={calls}
                onOpenComplaint={(call) => onOpenComplaint(call)}
                onUpdateCall={onUpdateCall}
              />
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: PANEL UŻYTKOWNIKA (USER ACCOUNT & SUBSCRIPTION) */}
        {/* =================================================================== */}
        {activeTab === 'panel' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* User Profile Card */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-400/40 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shrink-0">
                  {currentUser?.photoUrl ? (
                    <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    currentUser?.name.charAt(0).toUpperCase() || 'A'
                  )}
                </div>

                <div className="space-y-0.5 min-w-0 flex-1">
                  <h3 className="font-black text-white text-base truncate">
                    {currentUser?.name || 'Abonent TelePakt'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {currentUser?.email || 'Konto lokalne (Tryb gościa)'}
                  </p>
                  
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Zweryfikowany Abonent
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      {currentUser?.provider === 'google' ? 'Google Gmail' : currentUser?.provider === 'apple' ? 'Apple ID' : 'E-mail'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Protected Phone Configuration */}
              <form onSubmit={handleSavePhone} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Chroniony numer telefonu w bazie TelePakt:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+48 500 123 456"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
                  >
                    {savingPhone ? 'Zapisuję...' : 'Zapisz'}
                  </button>
                </div>
                {phoneSaveSuccess && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Numer telefonu zaktualizowany w bazie TelePakt!</span>
                  </div>
                )}
              </form>
            </div>

            {/* Subscription & Legal Shield Tier */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">Twój Pakiet Ochrony</span>
                <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  0,00 zł / Testy Beta
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="font-bold text-cyan-400 text-sm">Plan Tarcza Osobista (Wczesny Dostęp)</div>
                <p className="text-[11px] text-slate-400">
                  Bezpłatny dostęp do sprzeciwu prawnego z art. 398 PKE, generatora zawiadomień do Prezesa UKE i sumy kontrolnej SHA-256.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-slate-500 block">Zablokowane połączenia:</span>
                  <strong className="text-white font-mono text-sm">12</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                  <span className="text-slate-500 block">Wnioski UKE:</span>
                  <strong className="text-white font-mono text-sm">{calls.length}</strong>
                </div>
              </div>
            </div>

            {/* Security & Sign Out Button */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prywatność Zero-Storage: Wszystkie dowody audio zostają w Twoim telefonie.</span>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Wyloguj się z konta TelePakt</span>
              </button>
            </div>

          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: USTAWIENIA (USER SETTINGS & PREFERENCES) */}
        {/* =================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            
            {/* Ochrona Połączeń */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-cyan-400">
                1. Ustawienia Ochrony Połączeń
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">Automatyczny sprzeciw (art. 398 PKE)</span>
                  <button
                    onClick={() => setAutoRejectSpam(!autoRejectSpam)}
                    className="text-cyan-400 cursor-pointer"
                  >
                    {autoRejectSpam ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-300">Blokada numerów zastrzeżonych</span>
                  <button
                    onClick={() => setBlockPrivateNumbers(!blockPrivateNumbers)}
                    className="text-cyan-400 cursor-pointer"
                  >
                    {blockPrivateNumbers ? <ToggleRight className="w-6 h-6 text-emerald-400" /> : <ToggleLeft className="w-6 h-6 text-slate-600" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Głos i Lektor */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-cyan-400">
                2. Głos Asystenta Prawnego
              </h3>

              <div className="space-y-2 text-xs">
                <label className="block text-slate-400 text-[11px]">Wybierz ton głosu odtwarzanego botowi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedVoice('tomasz')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVoice === 'tomasz'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Mecenas Tomasz (Męski)
                  </button>
                  <button
                    onClick={() => setSelectedVoice('joanna')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedVoice === 'joanna'
                        ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Radca Joanna (Żeński)
                  </button>
                </div>

                <div className="pt-1">
                  <label className="block text-slate-400 text-[11px] mb-1">Opóźnienie włączenia formuły:</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { sec: 0, label: '0s (Od razu)' },
                      { sec: 3, label: 'Za 3 sekundy' },
                      { sec: 5, label: 'Za 5 sekund' }
                    ].map(item => (
                      <button
                        key={item.sec}
                        onClick={() => setDelaySec(item.sec)}
                        className={`py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                          delaySec === item.sec
                            ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Dokumenty Prawne */}
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-cyan-400">
                3. Informacje Prawne & RODO
              </h3>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setActiveLegalModal('privacy')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 cursor-pointer"
                >
                  Polityka Prywatności
                </button>
                <button
                  onClick={() => setActiveLegalModal('terms')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 cursor-pointer"
                >
                  Regulamin Usług
                </button>
                <button
                  onClick={() => setActiveLegalModal('rodo')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 cursor-pointer"
                >
                  Klauzula RODO
                </button>
                <button
                  onClick={() => setActiveLegalModal('cookies')}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-300 cursor-pointer"
                >
                  Cookies (PKE 399)
                </button>
              </div>

              {/* Subtle informational website link */}
              <div className="pt-2 border-t border-slate-800 text-center">
                <button
                  onClick={onSwitchToWebsite}
                  className="text-[11px] text-slate-400 hover:text-cyan-400 underline underline-offset-4 cursor-pointer"
                >
                  Przejdź do strony informacyjnej (telepakt.pl)
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* 3. SIMPLIFIED ANDROID BOTTOM NAVIGATION BAR (5 ICONS) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-2">
        <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
          
          {/* 1. Tarcza */}
          <button
            onClick={() => setActiveTab('shield')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'shield'
                ? 'text-cyan-400 bg-cyan-500/15 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Tarcza</span>
          </button>

          {/* 2. Rozmowa */}
          <button
            onClick={() => setActiveTab('call')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'call'
                ? 'text-cyan-400 bg-cyan-500/15 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Rozmowa</span>
          </button>

          {/* 3. Rejestr */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer relative ${
              activeTab === 'logs'
                ? 'text-cyan-400 bg-cyan-500/15 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Rejestr</span>
            {calls.length > 0 && (
              <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-cyan-400"></span>
            )}
          </button>

          {/* 4. Panel Użytkownika */}
          <button
            onClick={() => setActiveTab('panel')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'panel'
                ? 'text-cyan-400 bg-cyan-500/15 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Panel</span>
          </button>

          {/* 5. Ustawienia */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'text-cyan-400 bg-cyan-500/15 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Opcje</span>
          </button>

        </div>
      </nav>

      {/* Fake Call Modal */}
      <FakeCallModal
        isOpen={isFakeCallOpen}
        onClose={() => setIsFakeCallOpen(false)}
        onCallLogged={onCallLogged}
      />

      {/* Legal Documents Modal */}
      <LegalDocumentModal
        isOpen={Boolean(activeLegalModal)}
        initialDoc={activeLegalModal || 'privacy'}
        onClose={() => setActiveLegalModal(null)}
      />

    </div>
  );
};
