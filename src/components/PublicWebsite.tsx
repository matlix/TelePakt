import React, { useState, useEffect } from 'react';
import {
  Shield, Smartphone, Scale, CheckCircle2, AlertTriangle, Play,
  Download, Star, MessageSquare, Plus, Lock, ChevronDown, ChevronUp,
  ExternalLink, ArrowRight, Sparkles, HelpCircle, FileText, Check, PhoneCall,
  Menu, X, Share2, Copy, Search, Zap, Gauge, Database, RefreshCw, User
} from 'lucide-react';
import { AppNameOption, CustomerReview, UserAccount } from '../types';
import { INITIAL_CUSTOMER_REVIEWS } from '../data/adminAndReviewsData';
import logoImage from '../assets/images/telepakt_logo_icon_1793197547893.jpg';
import pwaGuideImage from '../assets/images/pwa_install_android_1793461222858.jpg';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AppInstructionGuide } from './AppInstructionGuide';
import { LegalDocumentModal, LegalDocType } from './LegalDocumentModal';
import { FakeCallModal } from './FakeCallModal';
import { AuthModal } from './AuthModal';
import { UserProfileModal } from './UserProfileModal';
import { authService } from '../services/authService';
import { spamDatabaseService, LookupResult } from '../services/spamDatabaseService';

interface PublicWebsiteProps {
  appName: AppNameOption;
  onOpenApp?: () => void;
  onOpenStudio?: () => void;
  onOpenSimulator?: () => void;
  onLockApp?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  appName,
  onOpenApp,
  onOpenStudio,
  onOpenSimulator,
  onLockApp,
}) => {
  const [logoErr, setLogoErr] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showPwaScreenshotZoom, setShowPwaScreenshotZoom] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalDocType | null>(null);
  const [isFakeCallModalOpen, setIsFakeCallModalOpen] = useState(false);

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => authService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    return authService.subscribe((u) => {
      setCurrentUser(u);
    });
  }, []);

  // Native PWA Installation Hook
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [installStatusMsg, setInstallStatusMsg] = useState<'success' | 'dismissed' | 'manual' | null>(null);

  const handlePWAInstallClick = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setInstallStatusMsg('success');
    } else {
      // In incognito mode or browsers without direct auto-prompt:
      // Open the interactive installation guide modal immediately!
      setDownloadModalTab('pwa');
      setIsDownloadModalOpen(true);
      setInstallStatusMsg('manual');
    }
  };

  // Download & Testing modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalTab, setDownloadModalTab] = useState<'pwa' | 'apk' | 'testing' | 'simulator'>('pwa');
  const [testerEmail, setTesterEmail] = useState('');
  const [testerStore, setTesterStore] = useState<'google' | 'apple' | 'samsung' | 'huawei'>('google');
  const [testerRegistered, setTesterRegistered] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search widget state (Tellows Scorelist + UKE offline cache)
  const [searchNumber, setSearchNumber] = useState('+48 22 104 39 88');
  const [searched, setSearched] = useState(true);
  const [searchResult, setSearchResult] = useState<LookupResult | null>(() => {
    return spamDatabaseService.lookupNumber('+48 22 104 39 88');
  });
  const [reportedSuccessMsg, setReportedSuccessMsg] = useState(false);
  const [fakeCallInitialNumber, setFakeCallInitialNumber] = useState('+48 22 104 39 88');
  const [fakeCallInitialName, setFakeCallInitialName] = useState('Centrum Dotacji OZE (Bot)');

  // Beta Program Signup State (Omnibus & UOKiK Compliance)
  const [betaEmail, setBetaEmail] = useState('');
  const [betaPlatform, setBetaPlatform] = useState<'android' | 'ios'>('android');
  const [betaConsent, setBetaConsent] = useState(false);
  const [betaSubmitted, setBetaSubmitted] = useState(false);
  const [betaError, setBetaError] = useState('');

  // Cookie & LocalStorage Consent Banner (PKE art. 399)
  const [isCookieBannerOpen, setIsCookieBannerOpen] = useState(() => {
    try {
      return localStorage.getItem('telepakt_cookies_accepted') !== 'true';
    } catch {
      return false;
    }
  });

  const handleAcceptCookies = () => {
    try {
      localStorage.setItem('telepakt_cookies_accepted', 'true');
    } catch {}
    setIsCookieBannerOpen(false);
  };

  const handleBetaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!betaEmail || !betaEmail.includes('@')) {
      setBetaError('Wprowadź prawidłowy adres e-mail.');
      return;
    }
    if (!betaConsent) {
      setBetaError('Zaznacz zgodę na kontakt w celu przesłania zaproszenia do testów.');
      return;
    }
    setBetaError('');
    setBetaSubmitted(true);
    try {
      const existing = JSON.parse(localStorage.getItem('telepakt_beta_subscribers') || '[]');
      existing.push({ email: betaEmail, platform: betaPlatform, date: new Date().toISOString() });
      localStorage.setItem('telepakt_beta_subscribers', JSON.stringify(existing));
    } catch {}
  };

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleRegisterTester = (e: React.FormEvent) => {
    e.preventDefault();
    if (testerEmail) {
      setTesterRegistered(true);
      setTimeout(() => {
        setTesterRegistered(false);
        setTesterEmail('');
      }, 4000);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchNumber.trim()) {
      const res = spamDatabaseService.lookupNumber(searchNumber.trim());
      setSearchResult(res);
      setSearched(true);
      setReportedSuccessMsg(false);
    }
  };

  const handleSelectSample = (num: string) => {
    setSearchNumber(num);
    const res = spamDatabaseService.lookupNumber(num);
    setSearchResult(res);
    setSearched(true);
    setReportedSuccessMsg(false);
  };

  const handleStartFakeCallFromSearch = (num: string, name: string) => {
    setFakeCallInitialNumber(num);
    setFakeCallInitialName(name);
    setIsFakeCallModalOpen(true);
  };

  const handleReportDelict = () => {
    if (!searchResult) return;
    spamDatabaseService.reportNumber({
      number: searchResult.record.number,
      name: searchResult.record.name,
      tellowsScore: Math.min(9, searchResult.record.tellowsScore + 1),
      riskLevel: 'critical',
      category: searchResult.record.category,
      reportsCount: searchResult.record.reportsCount + 1,
      lastReported: 'Przed chwilą (Twoje zgłoszenie)',
      delictDescription: `${searchResult.record.delictDescription} [Zgłoszono naruszenie art. 398 PKE przez abonenta]`,
      legalBasis: searchResult.record.legalBasis,
    });
    const refreshed = spamDatabaseService.lookupNumber(searchResult.record.number);
    setSearchResult(refreshed);
    setReportedSuccessMsg(true);
    setTimeout(() => setReportedSuccessMsg(false), 4000);
  };

  const faqs = [
    {
      q: 'Czy odgrywanie formuły prawnej z art. 398 PKE podczas rozmowy jest w 100% legalne?',
      a: 'Tak, w pełni legalne. 10 listopada 2024 r. weszła w życie ustawa Prawo komunikacji elektronicznej (Dz.U. 2024 poz. 1221). Art. 398 bezwzględnie zakazuje używania telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących dla celów marketingu bezpośredniego bez uprzedniej zgody abonenta. Naruszenie tego przepisu stanowi delikt zagrożony karą nakładaną przez Prezesa UKE (do 3% rocznego przychodu podmiotu naruszającego).'
    },
    {
      q: 'Jak technicznie działa TelePakt w trakcie trwającego połączenia?',
      a: 'Gdy dzwoni natrętny telemarketer lub automat, jednym ruchem suwaka dołączasz asystenta prawnego (bezpieczna telekonferencja trójstronna). Asystent odtwarza formalną formułę prawną sprzeciwu z art. 398 PKE oraz art. 21 RODO i żąda podania NIP oraz adresu firmy. Na systemie Android scalenie następuje automatycznie, natomiast na telefonach iPhone (iOS) należy dotknąć przycisku «Scal rozmowy» na ekranie połączenia.'
    },
    {
      q: 'Czy ponoszę dodatkowe koszty za połączenie konferencyjne z botem?',
      a: 'Nie. Telefon łączy się ze standardowym polskim numerem stacjonarnym w strefie Warszawy (+48 22). Połączenia te we wszystkich polskich ofertach komórkowych no-limit (Play, Orange, Plus, T-Mobile) są całkowicie bezpłatne w ramach Twojego abonamentu.'
    },
    {
      q: 'Co dzieje się z nagraniami rozmów? Na czym polega zasada ochrony prywatności?',
      a: 'Stosujemy bezwzględną zasadę braku przechowywania na serwerach (Zero-Storage). TelePakt w ogóle nie przechowuje Twoich nagrań na serwerach zewnętrznych. Nagranie oraz zawiadomienie do Prezesa UKE trafiają wyłącznie do pamięci Twojego telefonu lub na wskazaną przez Ciebie prywatną chmurę (Google Drive, iCloud, Dropbox). Z węzła telekomunikacyjnego bufor audio jest natychmiast bezpowrotnie niszczony (cyfrowy shredding).'
    },
    {
      q: 'Czym TelePakt różni się od zwykłych, pasywnych aplikacji blokujących?',
      a: 'Zwykłe aplikacje tylko sprawdzają numer w internecie. Telemarketerzy omijają je, rotując tysiące nowych numerów VoIP (tzw. spoofing). TelePakt działa aktywnie: wygłasza formalne żądanie zaprzestania przetwarzania danych z rygorem kontroli UKE i UODO, co zmusza centra telemarketingowe do trwałego wykreślenia Twojego numeru z baz CRM.'
    },
    {
      q: 'Skąd pochodzi baza numerów spamowych TelePakt?',
      a: 'Korzystamy z hybrydowej architektury: hurtowej bazy numerów Tellows (Polska, ocena ryzyka 7–9), oficjalnego Rejestru Numerów o Podwyższonej Opłacie UKE (70x, 71x, 80x) oraz zgłoszeń abonentów TelePakt. Baza pobierana jest hurtowo i zapisywana lokalnie na urządzeniu, dzięki czemu sprawdzanie numeru trwa ułamek milisekundy i kosztuje 0 zł (brak płatnych zapytań API).'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-600 selection:text-white">
      
      {/* 1. PUBLIC WEBSITE HEADER - 100% RESPONSIVE FOR ALL SCREEN SIZES */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
            
            {/* Brand Logo & Name */}
            <a href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden border border-cyan-500/50 shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center bg-slate-900">
                {!logoErr ? (
                  <img 
                    src={logoImage} 
                    alt="TelePakt Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('telepakt_logo.jpg')) {
                        target.src = '/telepakt_logo.jpg';
                      } else {
                        setLogoErr(true);
                      }
                    }} 
                  />
                ) : (
                  <Shield className="w-5 h-5 text-cyan-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-lg sm:text-xl font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    TelePakt<span className="text-cyan-400">.pl</span>
                  </span>
                  <span className="hidden sm:inline-flex text-[10px] bg-cyan-500/10 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold whitespace-nowrap">
                    PKE Art. 398
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden md:block truncate">
                  Prawna Tarcza Anty-Spam dla Twojego Telefonu
                </p>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs font-semibold text-slate-300">
              <a href="#jak-dziala" className="hover:text-cyan-400 transition-colors">Jak to działa</a>
              <a href="#instrukcja" className="hover:text-cyan-400 transition-colors">Instrukcja Obsługi</a>
              <a href="#prawo-pke" className="hover:text-cyan-400 transition-colors">Podstawa Prawna</a>
              <a href="#sprawdz-numer" className="hover:text-cyan-400 transition-colors">Sprawdź Numer</a>
              <a href="#cennik" className="hover:text-cyan-400 transition-colors">Cennik</a>
              <a href="#beta" className="hover:text-cyan-400 transition-colors">Testy Beta</a>
              <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
            </nav>

            {/* Actions: Open App & Mobile Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              {currentUser ? (
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-900 border border-cyan-500/30 hover:border-cyan-400 text-white text-xs font-semibold cursor-pointer transition-colors"
                  title="Twoje konto"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline truncate max-w-[80px]">{currentUser.name.split(' ')[0]}</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden xs:inline">Zaloguj się</span>
                </button>
              )}

              {onOpenApp && (
                <button
                  onClick={onOpenApp}
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 cursor-pointer transition-all active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-950" />
                  <span>Uruchom Aplikację</span>
                </button>
              )}

              {/* Mobile Hamburger Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 lg:hidden rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white shrink-0 cursor-pointer"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            {currentUser ? (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-white font-bold text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{currentUser.name} ({currentUser.email})</span>
                </div>
                <span className="text-cyan-400 text-[11px] shrink-0">Profil ➔</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Zaloguj się / Rejestracja (Gmail, Apple, Email)</span>
              </button>
            )}

            {onOpenApp && (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenApp();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <Smartphone className="w-4 h-4" />
                <span>Otwórz Aplikację TelePakt (PWA)</span>
              </button>
            )}
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-300">
              <a 
                href="#jak-dziala" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Jak to działa
              </a>
              <a 
                href="#instrukcja" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Instrukcja Obsługi (Krok po kroku)
              </a>
              <a 
                href="#prawo-pke" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Podstawa Prawna (art. 398 PKE)
              </a>
              <a 
                href="#sprawdz-numer" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Sprawdź Numer
              </a>
              <a 
                href="#cennik" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Cennik (Subskrypcje)
              </a>
              <a 
                href="#beta" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Zamknięte Testy Beta
              </a>
              <a 
                href="#faq" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                FAQ
              </a>
            </nav>

            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              <button
                onClick={() => { setIsMobileMenuOpen(false); setIsFakeCallModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-semibold cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Wywołaj Próbne Połączenie Anty-Spam</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-10 sm:pt-14 pb-16 sm:pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm max-w-full">
            <Shield className="w-4 h-4 shrink-0" />
            <span className="truncate">Prawna tarcza anty-spam zgodna z Prawem komunikacji elektronicznej (PKE 2024)</span>
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Koniec niechcianych telefonów. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Jedno kliknięcie. Twoje weto. Zgodnie z prawem.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong>TelePakt.pl</strong> to aplikacja dla abonentów w Polsce, która w trakcie uciążliwej rozmowy włącza asystenta prawnego wygłaszającego bezwzględny sprzeciw z <strong>art. 398 PKE</strong> i <strong>art. 21 RODO</strong> (pod rygorem kary nakładanej przez Prezesa UKE do 3% przychodu) oraz rejestruje dowód audio z sumą kontrolną SHA-256.
          </p>

          {/* Download & Beta Badges */}
          <div id="pobierz" className="pt-4 space-y-4">
            <p className="text-xs font-semibold text-slate-400">
              Wkrótce w oficjalnych sklepach (trwają zamknięte testy Beta):
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              
              {/* Google Play */}
              <div 
                onClick={onOpenApp}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-emerald-400 font-mono block leading-tight">Otwórz w</span>
                  <strong className="text-xs text-white truncate block">Google Play / PWA</strong>
                </div>
              </div>

              {/* Apple App Store */}
              <div 
                onClick={onOpenApp}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-blue-400 font-mono block leading-tight">Otwórz na</span>
                  <strong className="text-xs text-white truncate block">iPhone / iOS</strong>
                </div>
              </div>

              {/* Samsung Galaxy Store */}
              <div 
                onClick={onOpenApp}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-cyan-400 font-mono block leading-tight">Uruchom na</span>
                  <strong className="text-xs text-white truncate block">Galaxy / Android</strong>
                </div>
              </div>

              {/* Huawei AppGallery */}
              <div 
                onClick={onOpenApp}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-rose-400 font-mono block leading-tight">Uruchom na</span>
                  <strong className="text-xs text-white truncate block">Huawei / Inne</strong>
                </div>
              </div>

            </div>

            {/* Primary Action Card: Launch App or Install PWA */}
            <div className="pt-3 max-w-xl mx-auto space-y-3">
              {onOpenApp && (
                <button
                  onClick={onOpenApp}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer ring-2 ring-cyan-400/80 group"
                >
                  <Smartphone className="w-5 h-5 text-slate-950 group-hover:scale-110 transition-transform" />
                  <span>Uruchom Aplikację TelePakt (w przeglądarce / telefonie)</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </button>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={handlePWAInstallClick}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                >
                  <Download className="w-4 h-4 text-cyan-400 animate-bounce" />
                  <span>Zainstaluj na pulpicie telefonu</span>
                </button>

                <button
                  onClick={() => setIsFakeCallModalOpen(true)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4 text-amber-400" />
                  <span>Test Próbnej Rozmowy</span>
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  onClick={onOpenApp}
                  className="text-[11px] text-slate-400 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  Otwórz aplikację bezpośrednio na telefonie ➔
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SEO LEAD MAGNET: SEARCH NUMBER DATABASE (TELLOWS SCORELIST + UKE REGISTER) */}
      <section id="sprawdz-numer" className="py-16 border-b border-slate-800/80 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-center relative z-10">
          
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
              <Database className="w-3.5 h-3.5" />
              Baza Zagrożeń Tellows (Polska) • Rejestr UKE • Zgłoszenia Art. 398 PKE
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Sprawdź numer w bazie telemarketingu i spamu
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Sprawdź ocenę ryzyka w skali Tellows (1–9), delikty z art. 398 PKE oraz stawki połączeń Premium UKE. 
              Baza działa w 100% lokalnie na Twoim urządzeniu (0 ms opóźnienia, 0 zł za sprawdzenie).
            </p>
          </div>

          {/* Quick sample chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Przykłady z bazy:</span>
            {[
              { num: '+48 22 104 39 88', label: 'Bot Fotowoltaika (Warszawa)' },
              { num: '+48 22 598 40 00', label: 'Spoofing Bankowy' },
              { num: '+48 708 888 123', label: 'Premium UKE 708 (Płatny)' },
              { num: '+48 71 889 02 11', label: 'Pokazy Garnków (Wrocław)' },
            ].map(sample => (
              <button
                key={sample.num}
                type="button"
                onClick={() => handleSelectSample(sample.num)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                  searchNumber === sample.num
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                placeholder="Wpisz numer, np. +48 22 104 39 88 lub 708..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Sprawdź w Bazie
            </button>
          </form>

          {searched && searchResult && (
            <div className="max-w-2xl mx-auto animate-in fade-in">
              {!searchResult.isValid ? (
                /* Validation Error Card (e.g. user typed "abc" or too few digits) */
                <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl text-left space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{searchResult.validationError || 'Nieprawidłowy format numeru'}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    Wprowadzony ciąg „<strong className="text-white font-mono">{searchNumber}</strong>” nie jest prawidłowym numerem telefonu. Podaj numer stacjonarny, komórkowy lub infolinii (np. <span className="font-mono text-cyan-300">+48 22 104 39 88</span> lub <span className="font-mono text-cyan-300">708 888 123</span>), aby przeszukać bazę.
                  </p>
                </div>
              ) : !searchResult.found ? (
                /* Truthful Safe Number Card (not in spam database) */
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 text-left space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-lg font-black text-white font-mono">{searchResult.record.number}</span>
                      <div className="text-xs text-emerald-400 font-bold mt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Numer bezpieczny — brak wpisów w czarnej liście Tellows i rejestrze UKE</span>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-3 py-1 rounded-full border border-emerald-500/40 font-bold self-start sm:self-center">
                      Tellows Score: 1 / 9 (Zaufany)
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ten numer nie figuruje na liście uciążliwego telemarketingu ani w rejestrze numerów o podwyższonej opłacie UKE. Jeśli jednak dzwonił do Ciebie bez uprzedniej zgody, możesz przetestować próbne połączenie lub dodać zgłoszenie deliktu.
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <button
                      type="button"
                      onClick={() => handleStartFakeCallFromSearch(searchResult.record.number, 'Połączenie testowe')}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4 text-cyan-400" />
                      Przetestuj próbne połączenie z tym numerem
                    </button>

                    <button
                      type="button"
                      onClick={handleReportDelict}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Plus className="w-4 h-4 text-rose-400" />
                      Zgłoś ten numer jako niechciany (+1)
                    </button>
                  </div>

                  {reportedSuccessMsg && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dziękujemy! Twoje zgłoszenie deliktu z art. 398 PKE zostało zapisane.</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Found Spam / UKE Premium Rate Detailed Card */
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-left space-y-5 shadow-2xl">
                  
                  {/* Header card with name & risk level */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white font-mono">
                          {searchResult.record.number}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono border ${
                          searchResult.record.riskLevel === 'critical'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : searchResult.record.riskLevel === 'dangerous'
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : searchResult.record.riskLevel === 'suspicious'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}>
                          {searchResult.record.riskLevel === 'critical' && 'Ryzyko: Krytyczne'}
                          {searchResult.record.riskLevel === 'dangerous' && 'Ryzyko: Niebezpieczne'}
                          {searchResult.record.riskLevel === 'suspicious' && 'Ryzyko: Podejrzane'}
                          {searchResult.record.riskLevel === 'safe' && 'Status: Bezpieczny'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-indigo-300 mt-1">
                        {searchResult.record.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-center">
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5">
                        <Database className="w-3 h-3 text-cyan-400" />
                        {searchResult.source === 'tellows_scorelist' && 'Baza Zagrożeń Tellows (PL)'}
                        {searchResult.source === 'uke_register' && 'Rejestr UKE Premium'}
                        {searchResult.source === 'telepakt_community' && 'Społeczność TelePakt'}
                        {searchResult.source === 'verified_safe' && 'Weryfikacja bezpieczna'}
                      </span>
                    </div>
                  </div>

                  {/* Tellows Score Visual Meter (1 to 9) */}
                  <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Gauge className="w-4 h-4 text-cyan-400" />
                        Wskaźnik Tellows Score (1 – 9):
                      </span>
                      <span className={`font-black font-mono px-2 py-0.5 rounded text-xs ${
                        searchResult.record.tellowsScore >= 7
                          ? 'bg-rose-500 text-white'
                          : searchResult.record.tellowsScore >= 5
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}>
                        {searchResult.record.tellowsScore} / 9 ({searchResult.record.tellowsScore >= 7 ? 'Spam uciążliwy' : searchResult.record.tellowsScore >= 4 ? 'Wymaga uwagi' : 'Zaufany'})
                      </span>
                    </div>

                    {/* 9-segment visual meter */}
                    <div className="grid grid-cols-9 gap-1.5 pt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((segment) => {
                        const isActive = segment <= searchResult.record.tellowsScore;
                        let segmentColor = 'bg-slate-800';
                        if (isActive) {
                          if (segment <= 3) segmentColor = 'bg-emerald-500';
                          else if (segment <= 6) segmentColor = 'bg-amber-400';
                          else if (segment <= 8) segmentColor = 'bg-orange-500';
                          else segmentColor = 'bg-rose-600 animate-pulse';
                        }
                        return (
                          <div key={segment} className="space-y-1">
                            <div className={`h-2.5 rounded-full transition-all ${segmentColor}`} />
                            <span className={`block text-center text-[9px] font-mono ${isActive ? 'text-white font-bold' : 'text-slate-600'}`}>
                              {segment}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 font-mono">
                      <span>1: Zaufany abonent</span>
                      <span>5: Neutralny</span>
                      <span>9: Nielegalny spam / Spoofing</span>
                    </div>
                  </div>

                  {/* Details & Legal Delict */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Kategoria spamu</span>
                      <div className="font-bold text-white">{searchResult.record.category}</div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">Zgłoszenia w Polsce</span>
                      <div className="font-bold text-amber-300 font-mono">{searchResult.record.reportsCount.toLocaleString('pl-PL')} zgłoszeń</div>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold">
                        {searchResult.record.isUkePremium ? 'Stawka za minutę' : 'Ostatnia aktywność'}
                      </span>
                      <div className="font-bold text-rose-400 font-mono">
                        {searchResult.record.costEstimatePerMin || searchResult.record.lastReported}
                      </div>
                    </div>
                  </div>

                  {/* Delict description & Law */}
                  <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/20 text-xs space-y-1.5 text-slate-300">
                    <div className="font-bold text-rose-300 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 shrink-0" />
                      Kwalifikacja prawna: {searchResult.record.legalBasis}
                    </div>
                    <p className="leading-relaxed text-slate-400 text-[11px]">
                      {searchResult.record.delictDescription}
                    </p>
                  </div>

                  {/* Economic & Privacy architecture banner */}
                  <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-indigo-300 text-[11px]">
                      <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        Baza offline na urządzeniu (Zero-Storage). Koszt sprawdzenia: <strong className="text-emerald-400 font-mono">0,00 zł</strong> ({searchResult.responseTimeMs} ms, brak płatnych zapytań API).
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleStartFakeCallFromSearch(searchResult.record.number, searchResult.record.name)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Przetestuj próbne połączenie z tym numerem
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReportDelict}
                        className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        title="Zgłoś niechciane połączenie z tego numeru"
                      >
                        <Plus className="w-3.5 h-3.5 text-cyan-400" />
                        Zgłoś delikt (+1)
                      </button>

                      <button
                        onClick={onOpenApp}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Otwórz w Aplikacji
                      </button>
                    </div>
                  </div>

                  {reportedSuccessMsg && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Dziękujemy! Twoje zgłoszenie deliktu z art. 398 PKE zostało natychmiast zapisane w bazie bota.</span>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

        </div>
      </section>

      {/* 4. HOW IT WORKS: 4 STEPS */}
      <section id="jak-dziala" className="py-20 border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
              Technologia Telekonferencji Trójstronnej
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Jak działa ochrona TelePakt w 4 prostych krokach?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Nie musisz instalować skomplikowanych central telefonicznych. Aplikacja działa bezpośrednio na Twoim smartfonie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center font-black font-mono text-sm">
                1
              </span>
              <h3 className="text-base font-bold text-white">Dzwoni niechciany numer</h3>
              <p className="text-slate-400 leading-relaxed">
                Odbierasz telefon. Gdy słyszysz automat, telemarketera lub naciągacza, nie musisz się denerwować ani kłócić.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <span className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-black font-mono text-sm">
                2
              </span>
              <h3 className="text-base font-bold text-white">Jedno kliknięcie asystenta</h3>
              <p className="text-slate-400 leading-relaxed">
                Przesuwasz suwak TelePakt (lub wybierasz numer asystenta). Na iPhone z uwagi na wymogi iOS klikasz „Scal połączenia” na ekranie rozmowy. Asystent dołącza do telekonferencji w ułamku sekundy.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black font-mono text-sm">
                3
              </span>
              <h3 className="text-base font-bold text-white">Oficjalna formuła prawna</h3>
              <p className="text-slate-400 leading-relaxed">
                Spokojny, autorytatywny głos lektora (lub nagrany Twój własny głos) wygłasza sprzeciw z art. 398 PKE i art. 21 RODO oraz żąda podania NIP i adresu firmy.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black font-mono text-sm">
                4
              </span>
              <h3 className="text-base font-bold text-white">Dowód dla UKE i Sądu</h3>
              <p className="text-slate-400 leading-relaxed">
                Rozmowa zostaje automatycznie rozłączona, a nagranie z gotowym pismem dowodowym trafia prosto do pamięci Twojego telefonu lub na Twój prywatny dysk w chmurze (Google Drive, iCloud) – TelePakt nie przechowuje Twoich nagrań na serwerach (100% Zero-Storage).
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. LEGAL FOUNDATION: ART 398 PKE */}
      <section id="prawo-pke" className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
              Dz.U. 2024 poz. 1221 • Wejście w życie: 10 listopada 2024
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Nowa Ustawa: Prawo Komunikacji Elektronicznej (PKE)
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Koniec bezkarności nieuczciwych agencji marketingu telefonicznego w Polsce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            
            <div className="p-6 rounded-3xl bg-slate-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Scale className="w-5 h-5" />
                <span>Art. 398 PKE – Zakaz marketingu bezpośredniego</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                „Używanie telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących dla celów marketingu bezpośredniego jest dozwolone <strong>wyłącznie po uzyskaniu uprzedniej zgody abonenta</strong>.”
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                Wykupienie bazy numerów z internetu lub losowe wybieranie cyfr (tzw. dialery RND) nie stanowi legalnej zgody w rozumieniu ustawy.
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-rose-500/30 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Art. 445 PKE – Kary do 1 000 000 zł</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs">
                Kto wbrew przepisom art. 398 wykonuje połączenia telefoniczne, podlega karze pieniężnej nakładanej przez Prezesa Urzędu Komunikacji Elektronicznej (UKE) <strong>w wysokości do 3% przychodu ukaranego podmiotu lub do 1 000 000 zł</strong>.
              </p>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                TelePakt generuje gotowy wniosek do Prezesa UKE z kompletem dowodów audio, numerem SID i transkrypcją.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. TRANSPARENT PRICING & MARKETPLACE SAFETY */}
      <section id="cennik" className="py-20 border-b border-slate-800/80 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
              Brak ukrytych opłat • Anuluj w dowolnym momencie
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Przejrzysty Cennik Subskrypcji
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto">
              W TelePakt <strong>wszystkie funkcje prawne i dowodowe są w 100% odblokowane dla każdego</strong>. Pakiety różnią się wyłącznie miesięczną pulą minut rozmowy asystenta na linii.
            </p>

            {/* Feature Equality Guarantee Banner */}
            <div className="p-3 sm:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 max-w-3xl mx-auto text-cyan-200 text-xs flex items-center gap-3 text-left">
              <span className="text-2xl leading-none">🛡️</span>
              <div className="space-y-0.5">
                <strong className="text-white block">Gwarancja Pełnej Ochrony:</strong>
                <span>Auto-Sprzeciw (art. 398 PKE), Dowód Audio SHA-256, Wnioski UKE, Baza Offline i Zero-Storage działają w każdym planie bez dodatkowych opłat.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs max-w-5xl mx-auto">
            
            {/* Free Tier: 3 minutes */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-sm">Pakiet Darmowy</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    3 minuty / mies.
                  </span>
                </div>
                <div className="text-3xl font-black text-white font-mono">0 zł <span className="text-xs font-normal text-slate-500">/ na zawsze</span></div>
                <p className="text-slate-400 text-xs">Wystarcza na ok. 5–6 zneutralizowanych połączeń marketingowych po ~30 sekund.</p>
                
                <ul className="space-y-2 text-slate-300 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2 text-emerald-400">✓ <strong>3 minuty</strong> rozmowy bota asystenta co miesiąc</li>
                  <li className="flex items-center gap-2">✓ <strong>Wszystkie opcje odblokowane</strong></li>
                  <li className="flex items-center gap-2">✓ Sprzeciw z art. 398 PKE i art. 21 RODO</li>
                  <li className="flex items-center gap-2">✓ Dowód Audio z sumą kontrolną SHA-256</li>
                  <li className="flex items-center gap-2">✓ Generator zawiadomień do Prezesa UKE</li>
                  <li className="flex items-center gap-2">✓ Baza numerów offline i wskaźnik Tellows</li>
                  <li className="flex items-center gap-2">✓ 100% Zero-Storage w pamięci Twojego telefonu</li>
                </ul>
              </div>

              <button
                onClick={onOpenApp}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center block transition-colors cursor-pointer"
              >
                Uruchom za Darmo (0 zł)
              </button>
            </div>

            {/* Popular Tier: 30 minutes */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-cyan-500/50 space-y-4 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30">
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 uppercase tracking-wide">
                Najczęściej Wybierany • 10x Więcej Minut
              </span>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Pakiet Pełna Tarcza (PRO)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    30 minut / mies.
                  </span>
                </div>
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  14,99 zł <span className="text-xs font-normal text-slate-400">/ mies.</span>
                </div>
                <p className="text-slate-300 text-xs">Wystarcza na ok. 50–60 zneutralizowanych połączeń lub dłuższe rozmowy dowodowe.</p>
                
                <ul className="space-y-2 text-slate-200 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2 text-cyan-300 font-bold">✓ <strong>30 minut</strong> rozmowy asystenta co miesiąc</li>
                  <li className="flex items-center gap-2">✓ <strong>Wszystkie opcje odblokowane</strong></li>
                  <li className="flex items-center gap-2">✓ Dedykowana linia telekonferencji (+48) z priorytetem</li>
                  <li className="flex items-center gap-2">✓ Auto-Sprzeciw PKE i certyfikaty SHA-256</li>
                  <li className="flex items-center gap-2">✓ Nielimitowane zawiadomienia do Prezesa UKE i UODO</li>
                  <li className="flex items-center gap-2">✓ Spokój i ochrona telefonu przez cały rok</li>
                </ul>
              </div>

              <button
                onClick={onOpenApp}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-center block shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Aktywuj Pełną Tarczę (30 min)
              </button>
            </div>

            {/* Pro B2B Tier: 120 minutes */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-sm">Biznes B2B & Firma</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    120 minut / mies.
                  </span>
                </div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  49,00 zł <span className="text-xs font-normal text-slate-400">/ mies.</span>
                </div>
                <p className="text-slate-400 text-xs">Dla właścicieli firm, handlowców i jednoosobowych działalności gospodarczych.</p>
                
                <ul className="space-y-2 text-slate-300 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2 text-emerald-400 font-bold">✓ <strong>120 minut</strong> rozmowy asystenta co miesiąc</li>
                  <li className="flex items-center gap-2">✓ <strong>Wszystkie opcje odblokowane</strong></li>
                  <li className="flex items-center gap-2">✓ Obsługa windykacji, ofert B2B i ustaleń handlowych</li>
                  <li className="flex items-center gap-2">✓ Ochrona wielu numerów firmowych</li>
                  <li className="flex items-center gap-2">✓ Faktura VAT 23%</li>
                </ul>
              </div>

              <button
                onClick={onOpenApp}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center block transition-colors cursor-pointer"
              >
                Wybierz Pakiet B2B (120 min)
              </button>
            </div>

          </div>

          {/* Fair Use Policy Note */}
          <p className="text-[11px] text-slate-400 text-center max-w-2xl mx-auto">
            * Wszystkie pakiety odnawiają się comiesięcznie. Minuty nieprzeprowadzone w danym miesiącu nie przepadają i kumulują się na koncie abonenta.
          </p>

          {/* Trust Banner: Merchant of Record */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-slate-300">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-white block">100% Bezpieczna Subskrypcja w Twoim Sklepie:</strong>
                <span className="text-slate-400 text-[11px]">
                  Google Play • Apple App Store • Samsung Galaxy Store • Huawei AppGallery. Płać BLIK-iem, kartą lub dopisz do abonamentu Play, Orange, Plus, T-Mobile.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-cyan-300 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">BLIK</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">Apple Pay / GPay</span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">Rachunek Operatora</span>
            </div>
          </div>

        </div>
      </section>

      {/* 7. CLOSED BETA ACCESS (ZGODNOŚĆ Z DYREKTYWĄ OMNIBUS I UOKIK) */}
      <section id="beta" className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Program Wczesnego Dostępu • Wersja Przedpremierowa 1.0</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Dołącz do Zamkniętych Beta Testów TelePakt
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Trwają przygotowania do publicznej premiery w Google Play i Apple App Store. W myśl dyrektywy Omnibus i zasad UOKiK nie publikujemy niesprawdzonych ani fikcyjnych recenzji przed oficjalnym debiutem sklepowym. Zapisz się na bezpłatny wczesny dostęp i przetestuj aplikację w realnych warunkach.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl space-y-6">
            {betaSubmitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">Dziękujemy za zgłoszenie do testów!</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Twój adres e-mail został dodany do listy testerów ({betaPlatform === 'android' ? 'Testy wewnętrzne Google Play' : 'Testy Apple TestFlight'}). Wyślemy zaproszenie w najbliższej fali testowej.
                </p>
                <div className="pt-2">
                  <button
                    onClick={onOpenApp}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Przejdź od razu do Aplikacji ➔</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBetaSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Twój adres e-mail (do zaproszenia w sklepie):
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="twoj-email@gmail.com / icloud.com"
                      value={betaEmail}
                      onChange={(e) => setBetaEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Platforma Twojego smartfona:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBetaPlatform('android')}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          betaPlatform === 'android'
                            ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Android</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBetaPlatform('ios')}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          betaPlatform === 'ios'
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>iPhone (iOS)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      required
                      checked={betaConsent}
                      onChange={(e) => setBetaConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                    />
                    <span className="leading-relaxed text-[11px] text-slate-400">
                      Wyrażam zgodę na przetwarzanie mojego adresu e-mail przez administratora w celu przesłania linku do zamkniętych testów aplikacji w sklepie {betaPlatform === 'android' ? 'Google Play' : 'Apple TestFlight'} oraz informacji o aktualizacjach testowych, zgodnie z <button type="button" onClick={() => setActiveLegalModal('privacy')} className="text-cyan-400 hover:underline">Polityką Prywatności</button> i <button type="button" onClick={() => setActiveLegalModal('rodo')} className="text-cyan-400 hover:underline">Klauzulą RODO</button>.
                    </span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Zero spamu. Adres używany wyłącznie do zaproszenia do testów.</span>
                  </span>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-all active:scale-95"
                  >
                    Zapisz się na bezpłatną Betę
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/70 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
              <span>
                <strong>Przejrzystość Omnibus:</strong> Po zakończeniu testów beta i premierze w sklepach, sekcja ta zostanie zastąpiona autentycznymi recenzjami użytkowników pobieranymi bezpośrednio z Google Play Developer API oraz Apple App Store Connect.
              </span>
            </span>
          </div>

        </div>
      </section>

      {/* 8. FAQ & INTERACTIVE INSTRUCTION SECTION */}
      <section id="faq" className="py-20 border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Animated & Textual Step-by-Step App Instruction */}
          <div id="instrukcja">
            <AppInstructionGuide />
          </div>

          <div className="max-w-4xl mx-auto space-y-8 pt-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                Centrum Pomocy & Wiedzy Prawnej
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Często Zadawane Pytania (FAQ)
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div 
                    key={index}
                    className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden transition-colors"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-cyan-300 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-300 leading-relaxed border-t border-slate-900">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* 9. PUBLIC WEBSITE FOOTER */}
      <footer className="py-12 bg-slate-950 text-xs text-slate-400 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-slate-800/80 pb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-cyan-500/40 shrink-0 flex items-center justify-center bg-slate-900">
                  {!logoErr ? (
                    <img 
                      src={logoImage} 
                      alt="TelePakt Logo" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('telepakt_logo.jpg')) {
                          target.src = '/telepakt_logo.jpg';
                        }
                      }}
                    />
                  ) : (
                    <Shield className="w-4 h-4 text-cyan-400" />
                  )}
                </div>
                <span className="text-lg font-black text-white">TelePakt.pl</span>
              </div>
              <p className="text-xs text-slate-400 max-w-md">
                Polska Tarcza Anty-Spam i Prawny Asystent Połączeń. Zgodność z Prawem komunikacji elektronicznej (PKE) i RODO.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              <a href="#jak-dziala" className="hover:text-white">Jak działa</a>
              <a href="#instrukcja" className="hover:text-white">Instrukcja</a>
              <a href="#prawo-pke" className="hover:text-white">Prawo PKE</a>
              <a href="#cennik" className="hover:text-white">Cennik</a>
              <a href="#beta" className="hover:text-white">Zapisy Beta</a>
              <a href="#faq" className="hover:text-white">FAQ</a>
            </div>
          </div>

          {/* Company Imprint & Legal Compliance */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-200">
                Usługodawca i Administrator Danych: TelePakt Sp. z o.o. (w organizacji)
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                NIP: w rejestracji • KRS: w rejestracji • Siedziba: ul. Złota 59, 00-120 Warszawa
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Serwis realizuje postanowienia Ustawy z dnia 12 lipca 2024 r. Prawo komunikacji elektronicznej (Dz.U. 2024 poz. 1221, art. 398 i 399) oraz Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO, art. 21). Wszystkie nagrania i dane przetwarzane są w architekturze Zero-Storage (wyłącznie na urządzeniu abonenta).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              Wszelkie prawa zastrzeżone © 2026 TelePakt.pl • Zgodność z PKE & RODO
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 font-medium">
              <button 
                onClick={() => setActiveLegalModal('privacy')} 
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-700 hover:decoration-cyan-400"
              >
                Polityka Prywatności (Zero-Storage)
              </button>
              <button 
                onClick={() => setActiveLegalModal('terms')} 
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-700 hover:decoration-cyan-400"
              >
                Regulamin Serwisu
              </button>
              <button 
                onClick={() => setActiveLegalModal('rodo')} 
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-700 hover:decoration-cyan-400"
              >
                Klauzula RODO
              </button>
              <button 
                onClick={() => setActiveLegalModal('cookies')} 
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-700 hover:decoration-cyan-400"
              >
                Polityka Cookies (art. 399 PKE)
              </button>
              <button 
                onClick={() => setActiveLegalModal('manual')} 
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer underline underline-offset-4 decoration-slate-700 hover:decoration-cyan-400"
              >
                Instrukcja Obsługi
              </button>
              <a 
                href="mailto:kontakt@telepakt.pl" 
                className="text-slate-400 hover:text-cyan-400 transition-colors"
              >
                Kontakt: kontakt@telepakt.pl
              </a>
            </div>
          </div>

        </div>
      </footer>

      {/* MODAL: POBIERZ / ZAINSTALUJ / PRZETESTUJ NA TELEFONIE */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Zainstaluj lub Przetestuj na Telefonie</h3>
                  <p className="text-xs text-slate-400">Wersja Przedpremierowa 1.0 (Otwarte Testy)</p>
                </div>
              </div>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
                aria-label="Zamknij"
              >
                ✕
              </button>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="grid grid-cols-4 p-2 bg-slate-950/80 border-b border-slate-800 gap-1 text-[11px] sm:text-xs font-semibold">
              <button
                onClick={() => setDownloadModalTab('pwa')}
                className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer text-center ${
                  downloadModalTab === 'pwa'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                📱 Aplikacja (1 klik)
              </button>
              <button
                onClick={() => setDownloadModalTab('apk')}
                className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer text-center ${
                  downloadModalTab === 'apk'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                📦 Plik APK
              </button>
              <button
                onClick={() => setDownloadModalTab('testing')}
                className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer text-center ${
                  downloadModalTab === 'testing'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🧪 Google Play
              </button>
              <button
                onClick={() => setDownloadModalTab('simulator')}
                className={`py-2 px-1 sm:px-3 rounded-xl transition-all cursor-pointer text-center ${
                  downloadModalTab === 'simulator'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                🎮 Symulator
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-300 flex-1">
              
              {/* TAB 1: PWA (Recommended Instant Android & iOS Install) */}
              {downloadModalTab === 'pwa' && (
                <div className="space-y-4">
                  
                  {/* HERO 1-CLICK DIRECT INSTALL BUTTON */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-indigo-950/70 to-slate-900 border-2 border-cyan-500/60 shadow-xl shadow-cyan-500/15 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-black uppercase tracking-wider text-cyan-300 font-mono">
                          Oficjalny Instalator PWA
                        </span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded font-bold">
                        Android • iOS • PC
                      </span>
                    </div>

                    {!isInstalled ? (
                      <button
                        onClick={handlePWAInstallClick}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-cyan-500/30 active:scale-95 transition-all ring-2 ring-cyan-400/80 cursor-pointer group"
                      >
                        <Download className="w-6 h-6 text-white group-hover:scale-110 transition-transform animate-bounce" />
                        <span>Zainstaluj Aplikację TelePakt (1-Kliknięcie)</span>
                      </button>
                    ) : (
                      <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>Aplikacja TelePakt jest już pomyślnie zainstalowana na Twoim telefonie!</span>
                      </div>
                    )}

                    {onOpenApp && (
                      <button
                        onClick={() => {
                          setIsDownloadModalOpen(false);
                          onOpenApp();
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      >
                        <Smartphone className="w-4 h-4 text-cyan-400" />
                        <span>Uruchom Aplikację Teraz (w przeglądarce) ➔</span>
                      </button>
                    )}

                    {installStatusMsg === 'success' && (
                      <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-emerald-300 font-bold text-xs animate-in fade-in flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sukces! Aplikacja została zainstalowana i dodana do ekranu głównego telefonu.</span>
                      </div>
                    )}

                    {installStatusMsg === 'manual' && (
                      <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs animate-in fade-in space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Instalacja w Twojej przeglądarce:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {isIOS
                            ? 'Na iPhone (Safari): Dotknij ikonę Udostępnij (kwadrat ze strzałką) i wybierz „Do ekranu początkowego”.'
                            : 'W Chrome na Androidzie: Dotknij 3 pionowe kropki (⋮) w prawym górnym rogu i wybierz „Zainstaluj aplikację” (lub „Dodaj do ekranu głównego”).'}
                        </p>
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-amber-500/30 text-[10px] text-amber-300/90 leading-relaxed">
                          🔒 <strong>Jesteś w trybie incognito / prywatnym?</strong> Przeglądarki mobilne (Chrome, Safari) ze względów bezpieczeństwa celowo wyłączają bezpośredni instalator w oknach incognito. Otwórz stronę w normalnej karcie przeglądarki, aby zainstalować aplikację 1 kliknięciem!
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                      <span>⚡ 100% Darmowa i legalna instalacja</span>
                      <span>🛡️ Bez czekania na Google Play</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-white text-xs block">
                        Czym różni się PWA od aplikacji ze sklepu?
                      </strong>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Dzięki technologii <strong>Progressive Web App (PWA)</strong>, zarejestrowanemu manifestowi i Service Workerowi nie musisz pobierać pliku z marketu. TelePakt instaluje się z oficjalną ikoną tarczy na pulpicie telefonu, działa pełnoekranowo i zachowuje się dokładnie jak aplikacja natywna.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">Instrukcja instalacji w Chrome na telefonie z Androidem:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <li>Jeśli czytasz to na telefonie, kliknij powyższy przycisk <strong className="text-cyan-400">„Zainstaluj Aplikację TelePakt”</strong>.</li>
                      <li>Jeśli przeglądarka nie wyświetli automatycznego monitu, kliknij menu w prawym górnym rogu (ikona trzech pionowych kropek <strong>⋮</strong>).</li>
                      <li>Wybierz opcję <strong className="text-white">„Zainstaluj aplikację”</strong> lub <strong className="text-white">„Dodaj do ekranu głównego”</strong>.</li>
                      <li>Potwierdź klikając <strong className="text-emerald-400">„Zainstaluj”</strong>. Ikona tarczy TelePakt pojawi się na pulpicie obok innych Twoich aplikacji!</li>
                    </ol>
                  </div>

                  {/* Visual Screenshot of Chrome Android with the highlighted 3-dots and "Zainstaluj aplikację" */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-cyan-400">📸 Zrzut ekranu z telefonu (Google Chrome na Androidzie):</span>
                      </div>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-mono font-bold">
                        Gdzie kliknąć ⋮
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div 
                        onClick={() => setShowPwaScreenshotZoom(true)}
                        className="relative w-40 sm:w-48 rounded-xl overflow-hidden border border-cyan-500/50 shadow-lg shadow-cyan-500/20 cursor-pointer group shrink-0"
                      >
                        <img 
                          src={pwaGuideImage} 
                          alt="Instrukcja instalacji PWA na Androidzie - menu 3 kropek i Zainstaluj aplikację" 
                          className="w-full h-auto object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            e.currentTarget.src = '/pwa_install_android_guide.jpg';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                          <span className="text-[10px] font-bold bg-slate-950/90 text-cyan-300 px-2 py-1 rounded-lg border border-cyan-500/40 shadow-sm opacity-90 group-hover:opacity-100">
                            🔍 Kliknij, aby powiększyć
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs flex-1">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                          <strong className="text-white flex items-center gap-1.5 text-[11px]">
                            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">1</span>
                            Krok 1: Ikona 3 pionowych kropek (⋮)
                          </strong>
                          <p className="text-slate-400 text-[10px] leading-relaxed">
                            Znajduje się w prawym górnym rogu przeglądarki Chrome, tuż obok paska adresu (zaznaczona świecącym okręgiem na zrzucie).
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                          <strong className="text-cyan-300 flex items-center gap-1.5 text-[11px]">
                            <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-black text-[10px]">2</span>
                            Krok 2: Opcja „Zainstaluj aplikację”
                          </strong>
                          <p className="text-slate-300 text-[10px] leading-relaxed">
                            Po rozwinięciu menu zobaczysz pozycję <strong>„Zainstaluj aplikację”</strong> (z ikoną telefonu ze strzałką, podświetlona na turkusowo). W starszych wersjach Chrome może nazywać się <strong>„Dodaj do ekranu głównego”</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">Jak zainstalować na iPhone (Apple Safari):</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <li>Otwórz stronę w <strong>Safari</strong> na iOS.</li>
                      <li>Dotknij przycisk <strong className="text-white">Udostępnij</strong> (kwadrat ze strzałką w górę na dolnym pasku).</li>
                      <li>Przewiń w dół i wybierz <strong className="text-white">„Do ekranu początkowego” (Add to Home Screen)</strong>.</li>
                    </ol>
                  </div>

                  {/* Dual Action Bottom Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 border-t border-slate-800/80">
                    <button
                      onClick={handlePWAInstallClick}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Zainstaluj na tym urządzeniu</span>
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                      title="Skopiuj link i wyślij na telefon przez WhatsApp / Messenger / e-mail"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                      <span>{copiedLink ? 'Skopiowano adres WWW!' : 'Przeglądasz na PC? Skopiuj link na telefon'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: APK SIDELOADING (Android Direct Install) */}
              {downloadModalTab === 'apk' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-white text-xs block">
                        Instalacja pliku .APK na Androidzie (tzw. Sideloading)
                      </strong>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        System Android umożliwia deweloperom i testerom instalację plików <code className="text-emerald-400 font-mono">.apk</code> bezpośrednio z pamięci telefonu z pominięciem marketu Google Play.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <h4 className="font-bold text-white text-sm">Instrukcja instalacji pliku .APK:</h4>
                    <ul className="space-y-2 text-slate-300 text-xs">
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-cyan-400 font-bold">1.</span>
                        <span>Pobierz paczkę deweloperską poniższym przyciskiem na swój smartfon.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-cyan-400 font-bold">2.</span>
                        <span>Otwórz pobrany plik w Menedżerze Plików (Pobrane / Downloads).</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-cyan-400 font-bold">3.</span>
                        <span>Gdy Android wyświetli monit: <em>„Ze względów bezpieczeństwa telefon nie zezwala na instalowanie nieznanych aplikacji z tego źródła”</em>, kliknij <strong>Ustawienia</strong> i włącz suwak <strong>„Zezwalaj z tego źródła”</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono text-cyan-400 font-bold">4.</span>
                        <span>Wróć i kliknij <strong>„Zainstaluj”</strong>. Gotowe!</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-white block">Paczka Wdrożeniowa TelePakt Mobile</span>
                      <span className="text-[11px] text-slate-400">Zawiera manifest PWA, ikony wysokiej rozdzielczości oraz konfigurację Android Capacitor</span>
                    </div>
                    <a
                      href="/manifest.json"
                      download="telepakt-manifest.json"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Pobierz konfigurator</span>
                    </a>
                  </div>
                </div>
              )}

              {/* TAB 3: CLOSED TESTING TRACKS (Google Play & Apple TestFlight) */}
              {downloadModalTab === 'testing' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-white text-xs block">
                        Zamknięte Testy Sklepowe (Google Play Closed Testing & TestFlight)
                      </strong>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Zgodnie z wymogami Google Play (obowiązkowe testy z udziałem 20 testerów przez 14 dni przed premierą publiczną), aplikacja jest dostępna w oficjalnych sklepach na <strong>prywatnych ścieżkach testowych</strong>.
                      </p>
                    </div>
                  </div>

                  {testerRegistered ? (
                    <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2 animate-in fade-in">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                      <h4 className="font-bold text-white text-sm">Zgłoszenie do testów przyjęte!</h4>
                      <p className="text-xs text-slate-300">
                        Na adres <strong className="text-white">{testerEmail}</strong> otrzymasz zaproszenie z bezpośrednim linkiem instalacyjnym w wybranym sklepie.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleRegisterTester} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                      <h4 className="font-bold text-white text-sm">Dołącz do zamkniętej grupy testerów:</h4>
                      <p className="text-slate-400 text-[11px]">
                        Podaj swój adres e-mail powiązany z kontem Google Play lub Apple ID:
                      </p>

                      <div className="space-y-2">
                        <label className="block text-slate-300 font-semibold text-[11px]">Sklep docelowy:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'google', label: 'Google Play' },
                            { id: 'apple', label: 'App Store (TestFlight)' },
                            { id: 'samsung', label: 'Galaxy Store' },
                            { id: 'huawei', label: 'AppGallery' }
                          ].map(store => (
                            <button
                              type="button"
                              key={store.id}
                              onClick={() => setTesterStore(store.id as any)}
                              className={`p-2 rounded-xl text-center border text-[11px] font-semibold cursor-pointer transition-colors ${
                                testerStore === store.id 
                                  ? 'bg-cyan-500/20 border-cyan-500 text-white font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {store.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold text-[11px] mb-1">Twój adres e-mail:</label>
                        <input
                          type="email"
                          required
                          placeholder="twoj-email@gmail.com"
                          value={testerEmail}
                          onChange={(e) => setTesterEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                      >
                        Otrzymaj prywatny link do testów w sklepie
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 4: LIVE BROWSER SIMULATOR */}
              {downloadModalTab === 'simulator' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                    <Play className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-white text-xs block">
                        Interaktywny Symulator Rozmowy w Czasie Rzeczywistym
                      </strong>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Nie musisz niczego instalować, aby przetestować działanie TelePakt. W naszym symulatorze sprawdzisz odtworzenie formuły prawnej z art. 398 PKE, suwak sprzeciwu, audio lektora oraz wygenerujesz przykładowy protokół dowodowy dla UKE.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-4">
                    <Smartphone className="w-12 h-12 text-cyan-400 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">Gotowy na test na żywo?</h4>
                      <p className="text-slate-400 text-xs max-w-sm mx-auto">
                        Otwórz symulator połączenia przychodzącego od natrętnego call center i uruchom asystenta jednym ruchem.
                      </p>
                    </div>

                    {onOpenSimulator && (
                      <button
                        onClick={() => {
                          setIsDownloadModalOpen(false);
                          onOpenSimulator();
                        }}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 cursor-pointer transition-transform active:scale-95"
                      >
                        Uruchom Symulator Rozmowy Teraz
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-400">
              <span>Zgodność z PKE 2024 i RODO • 100% Bezpieczeństwa</span>
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                Zamknij
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Lightbox: Powiększony Zrzut Ekranu Instalacji PWA na Androidzie */}
      {showPwaScreenshotZoom && (
        <div 
          onClick={() => setShowPwaScreenshotZoom(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-4 max-w-sm sm:max-w-md w-full shadow-2xl relative space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="font-bold text-white text-sm">Instalacja PWA w Chrome na Androidzie</h4>
                <p className="text-[11px] text-cyan-400">Ikona 3 kropek (⋮) ➔ Opcja „Zainstaluj aplikację”</p>
              </div>
              <button 
                onClick={() => setShowPwaScreenshotZoom(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner max-h-[75vh] flex items-center justify-center bg-black">
              <img 
                src={pwaGuideImage} 
                alt="Zrzut ekranu instalacji PWA na Androidzie" 
                className="w-full h-auto max-h-[72vh] object-contain"
                onError={(e) => {
                  e.currentTarget.src = '/pwa_install_android_guide.jpg';
                }}
              />
            </div>

            <div className="text-[11px] text-slate-300 text-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              💡 Dotknij podświetloną opcję <strong>„Zainstaluj aplikację”</strong>, a TelePakt pojawi się na pulpicie Twojego telefonu.
            </div>
          </div>
        </div>
      )}

      {/* Floating Quick Action: Fake Call Tester on Android / iPhone */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <button
          onClick={() => setIsFakeCallModalOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-2xl shadow-rose-500/30 border border-white/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Przetestuj działanie TelePakt - wywołaj próbne połączenie z botem na ten telefon"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-950"></span>
          </span>
          <PhoneCall className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Przetestuj Aplikację (Próbna Rozmowa)</span>
          <span className="sm:hidden font-bold">Próbna Rozmowa</span>
        </button>
      </div>

      {/* Modal: Fake Call Tester na telefonie */}
      <FakeCallModal
        isOpen={isFakeCallModalOpen}
        onClose={() => setIsFakeCallModalOpen(false)}
        initialNumber={fakeCallInitialNumber}
        initialCallerName={fakeCallInitialName}
      />

      {/* Modal: Przeglądarka Dokumentów Prawnych (Polityka Prywatności, Regulamin, RODO, Instrukcja, Cookies) */}
      <LegalDocumentModal
        isOpen={activeLegalModal !== null}
        initialDoc={activeLegalModal || 'privacy'}
        onClose={() => setActiveLegalModal(null)}
      />

      {/* BANER COOKIES & PAMIĘCI LOKALNEJ (ZGODNY Z ART. 399 PKE I ARCHITEKTURĄ ZERO-STORAGE) */}
      {isCookieBannerOpen && (
        <aside 
          aria-label="Powiadomienie o plikach cookies i pamięci podręcznej"
          className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl"
        >
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-white">
                <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Prywatność Zero-Storage i Informacja o Pamięci Lokalnej (art. 399 PKE)</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed max-w-4xl">
                Serwis TelePakt.pl korzysta wyłącznie z niezbędnej pamięci lokalnej Twojej przeglądarki (localStorage) do działania wyszukiwarki spamu w trybie offline oraz zapamiętania Twoich preferencji testowych. Nie stosujemy żadnych komercyjnych plików cookie śledzących ani skryptów profilujących stron trzecich.
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setActiveLegalModal('cookies')}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-medium cursor-pointer transition-colors"
              >
                Szczegóły
              </button>
              <button
                onClick={handleAcceptCookies}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer transition-all"
              >
                Rozumiem i akceptuję
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Authentication Modal (Email, Gmail, Apple ID) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* User Profile Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={() => setCurrentUser(null)}
          onUpdate={(updated) => setCurrentUser(updated)}
        />
      )}

    </div>
  );
};
