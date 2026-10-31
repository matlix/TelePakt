import React, { useState } from 'react';
import {
  Shield, Smartphone, Scale, CheckCircle2, AlertTriangle, Play,
  Download, Star, MessageSquare, Plus, Lock, ChevronDown, ChevronUp,
  ExternalLink, ArrowRight, Sparkles, HelpCircle, FileText, Check, PhoneCall,
  Menu, X, Share2, Copy
} from 'lucide-react';
import { AppNameOption, CustomerReview } from '../types';
import { INITIAL_CUSTOMER_REVIEWS } from '../data/adminAndReviewsData';
import logoImage from '../assets/images/telepakt_logo_icon_1793197547893.jpg';

interface PublicWebsiteProps {
  appName: AppNameOption;
  onOpenStudio?: () => void;
  onOpenSimulator?: () => void;
  onLockApp?: () => void;
}

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({
  appName,
  onOpenStudio,
  onOpenSimulator,
  onLockApp,
}) => {
  const [logoErr, setLogoErr] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Download & Testing modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalTab, setDownloadModalTab] = useState<'pwa' | 'apk' | 'testing' | 'simulator'>('pwa');
  const [testerEmail, setTesterEmail] = useState('');
  const [testerStore, setTesterStore] = useState<'google' | 'apple' | 'samsung' | 'huawei'>('google');
  const [testerRegistered, setTesterRegistered] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Search widget state
  const [searchNumber, setSearchNumber] = useState('+48 22 104 39 88');
  const [searched, setSearched] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<CustomerReview[]>(
    INITIAL_CUSTOMER_REVIEWS.filter(r => r.isApproved)
  );
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [ratingInput, setRatingInput] = useState(5);
  const [spamTypeInput, setSpamTypeInput] = useState('Fotowoltaika / Telemarketing');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

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
      setSearched(true);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorInput || !contentInput) return;

    const newRev: CustomerReview = {
      id: `rev-${Date.now()}`,
      authorName: authorInput,
      rating: ratingInput,
      title: `Zgłoszenie: ${spamTypeInput}`,
      content: contentInput,
      createdAt: 'Przed chwilą',
      isApproved: true,
      isFeatured: false,
      verifiedSubscriber: true,
      deviceType: 'Android',
      spamTypeBlocked: spamTypeInput,
    };

    setReviews([newRev, ...reviews]);
    setSubmittedSuccess(true);
    setTimeout(() => {
      setIsSubmitModalOpen(false);
      setSubmittedSuccess(false);
      setAuthorInput('');
      setContentInput('');
    }, 2000);
  };

  const faqs = [
    {
      q: 'Czy odgrywanie formuły prawnej z art. 398 PKE podczas rozmowy jest w 100% legalne?',
      a: 'Tak, w pełni legalne. 10 listopada 2024 r. weszła w życie ustawa Prawo komunikacji elektronicznej (PKE). Art. 398 bezwzględnie zakazuje używania telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących do celów marketingu bezpośredniego bez uprzedniej zgody abonenta. Naruszenie tego przepisu zagrożone jest karą do 1 000 000 zł nakładaną przez Prezesa UKE.'
    },
    {
      q: 'Jak technicznie działa TelePakt w trakcie trwającego połączenia?',
      a: 'Gdy dzwoni natrętne call center lub bot, jednym ruchem suwaka uruchamiasz asystenta. Aplikacja w ułamku sekundy łączy w telekonferencję trójstronną (3-way call) licencjonowany polski węzeł telekomunikacyjny, który odtwarza autorytatywną formułę prawną i rejestruje ścieżkę dźwiękową ze znacznikiem czasu i sumą kontrolną SHA-256 dla sądu lub UKE.'
    },
    {
      q: 'Czy muszę podpisywać umowę ze Stripe, PayU albo podawać numer karty?',
      a: 'Nie! Wszystkie płatności za abonament TelePakt są realizowane wyłącznie przez oficjalne sklepy z aplikacjami: Google Play Store, Apple App Store, Samsung Galaxy Store oraz Huawei AppGallery. Płacisz jednym dotknięciem przez BLIK, Apple Pay, Google Pay lub dopisując opłatę do swojego comiesięcznego rachunku w Play, Orange, Plus lub T-Mobile.'
    },
    {
      q: 'Co dzieje się z nagraniami rozmów? Gdzie są przechowywane?',
      a: 'Stosujemy restrykcyjną zasadę Zero-Storage (Prywatność przez Projekt). Nagranie trafia bezpośrednio do pamięci Twojego telefonu lub na Twój prywatny dysk w chmurze (Google Drive, iCloud, Dropbox). Z serwerów węzła jest natychmiast trwale niszczone (shredding).'
    },
    {
      q: 'Czym TelePakt różni się od zwykłych aplikacji blokujących (np. Truecaller)?',
      a: 'Zwykłe aplikacje tylko sprawdzają bazę numerów. Telemarketerzy omijają je, generując tysiące nowych numerów (tzw. CLI spoofing). TelePakt działa aktywnie: wygłasza formalne żądanie zaprzestania przetwarzania danych z rygorem kary do miliona złotych, co zmusza call center do trwałego wykreślenia Twojego numeru z bazy, pod groźbą kontroli UKE i UODO.'
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
              <a href="#prawo-pke" className="hover:text-cyan-400 transition-colors">Podstawa Prawna</a>
              <a href="#sprawdz-numer" className="hover:text-cyan-400 transition-colors">Sprawdź Numer</a>
              <button 
                onClick={() => { setDownloadModalTab('pwa'); setIsDownloadModalOpen(true); }}
                className="hover:text-cyan-400 transition-colors cursor-pointer"
              >
                Pobierz i Testuj
              </button>
              <a href="#cennik" className="hover:text-cyan-400 transition-colors">Cennik</a>
              <a href="#opinie" className="hover:text-cyan-400 transition-colors">Opinie (4.9★)</a>
              <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
            </nav>

            {/* Actions: Download CTA + Studio Button + Mobile Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {onLockApp && (
                <button
                  onClick={onLockApp}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors shrink-0"
                  title="Aplikacja przedpremierowa - zablokuj hasłem"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {onOpenStudio && (
                <button
                  onClick={onOpenStudio}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all shrink-0"
                  title="Przejdź do Studia Projektowego, Generatora Skarg i Panelu Admina"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Studio & Admin</span>
                </button>
              )}

              {/* Mobile Compact CTA button (never overflows screen on Android) */}
              <button
                onClick={() => { setDownloadModalTab('pwa'); setIsDownloadModalOpen(true); }}
                className="flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Pobierz</span>
              </button>

              {/* Desktop / Tablet CTA button */}
              <button
                onClick={() => { setDownloadModalTab('pwa'); setIsDownloadModalOpen(true); }}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz Aplikację</span>
              </button>

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
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-300">
              <a 
                href="#jak-dziala" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Jak to działa
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
              <button 
                onClick={() => { setIsMobileMenuOpen(false); setDownloadModalTab('pwa'); setIsDownloadModalOpen(true); }}
                className="text-left px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20"
              >
                📲 Pobierz i Przetestuj na Telefonie (PWA & APK)
              </button>
              <a 
                href="#cennik" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Cennik (Tylko Subskrypcje Sklepowe)
              </a>
              <a 
                href="#opinie" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-slate-900 hover:text-cyan-400 transition-colors"
              >
                Opinie Klientów (4.9★)
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
              {onOpenSimulator && (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenSimulator(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-300 font-semibold"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Uruchom Symulator Rozmowy w Przeglądarce</span>
                </button>
              )}
              {onOpenStudio && (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenStudio(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Studio Projektowe & Panel Admina</span>
                </button>
              )}
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
            <span className="truncate">Oficjalna tarcza prawna zgodna z Prawem komunikacji elektronicznej (PKE 2024)</span>
          </div>

          <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Koniec niechcianych telefonów. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Jedno kliknięcie. Twoje weto. Zgodnie z prawem.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong>TelePakt.pl</strong> to pierwsza w Polsce aplikacja, która w trakcie uciążliwej rozmowy wpuszcza asystenta prawnego wygłaszającego bezwzględny sprzeciw z <strong>art. 398 PKE</strong> i <strong>art. 21 RODO</strong> pod rygorem kary 1 000 000 zł oraz rejestruje niepodważalny dowód audio dla UKE.
          </p>

          {/* Download & Testing Badges - 4 Official Stores */}
          <div id="pobierz" className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400">
              Dostępne we wszystkich 4 oficjalnych sklepach z aplikacjami w Polsce:
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 max-w-3xl mx-auto">
              
              {/* Google Play */}
              <div 
                onClick={() => { setTesterStore('google'); setDownloadModalTab('testing'); setIsDownloadModalOpen(true); }}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white truncate block">Google Play</strong>
                </div>
              </div>

              {/* Apple App Store */}
              <div 
                onClick={() => { setTesterStore('apple'); setDownloadModalTab('testing'); setIsDownloadModalOpen(true); }}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white truncate block">App Store</strong>
                </div>
              </div>

              {/* Samsung Galaxy Store */}
              <div 
                onClick={() => { setTesterStore('samsung'); setDownloadModalTab('testing'); setIsDownloadModalOpen(true); }}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white truncate block">Galaxy Store</strong>
                </div>
              </div>

              {/* Huawei AppGallery */}
              <div 
                onClick={() => { setTesterStore('huawei'); setDownloadModalTab('testing'); setIsDownloadModalOpen(true); }}
                className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 text-white flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all shadow-md group hover:bg-slate-800/80 active:scale-95"
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="text-left min-w-0">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white truncate block">AppGallery</strong>
                </div>
              </div>

            </div>

            {/* In-app Simulator & PWA Install Direct Triggers */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs">
              <button
                onClick={() => { setDownloadModalTab('pwa'); setIsDownloadModalOpen(true); }}
                className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Zainstaluj bezpośrednio na telefonie (PWA 1-klik)</span>
              </button>

              {onOpenSimulator && (
                <button
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-4 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Zobacz interaktywny symulator rozmowy w przeglądarce</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 3. SEO LEAD MAGNET: SEARCH NUMBER DATABASE */}
      <section id="sprawdz-numer" className="py-14 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-center">
          
          <div className="space-y-2">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
              Baza Numerów Marketingowych & Deliktów Prawnych
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Sprawdź, czy numer znajduje się na liście spamu
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Wprowadź numer, który do Ciebie dzwonił, aby sprawdzić zgłoszenia innych abonentów i podstawę prawną do zablokowania.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              placeholder="Wpisz numer, np. +48 22 104 39 88"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer"
            >
              Sprawdź Numer
            </button>
          </form>

          {searched && (
            <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-left space-y-2 animate-in fade-in max-w-xl mx-auto text-xs">
              <div className="flex items-center justify-between text-rose-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Numer {searchNumber} – zgłoszony 142 razy
                </span>
                <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded font-mono">
                  Ryzyko: Krytyczne
                </span>
              </div>
              <p className="text-slate-300">
                <strong>Typ deliktu:</strong> Agresywny telemarketing fotowoltaiczny i finansowy bez wcześniejszej zgody abonenta.
              </p>
              <div className="pt-2 border-t border-rose-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-indigo-300 font-medium">
                  Zainstaluj TelePakt, aby zablokować ten numer formułą z art. 398 PKE.
                </span>
                <a
                  href="#pobierz"
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] shrink-0"
                >
                  Zablokuj teraz
                </a>
              </div>
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
                Przesuwasz suwak TelePakt. Aplikacja w ułamku sekundy dołącza do rozmowy certyfikowany węzeł ochrony prawnej.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black font-mono text-sm">
                3
              </span>
              <h3 className="text-base font-bold text-white">Oficjalna formuła prawna</h3>
              <p className="text-slate-400 leading-relaxed">
                Spokojny, autorytatywny głos lektora wygłasza sprzeciw z art. 398 PKE i art. 21 RODO oraz żąda podania NIP i adresu firmy.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-3 relative hover:border-cyan-500/40 transition-colors">
              <span className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-black font-mono text-sm">
                4
              </span>
              <h3 className="text-base font-bold text-white">Dowód dla UKE i Sądu</h3>
              <p className="text-slate-400 leading-relaxed">
                Rozmowa zostaje automatycznie rozłączona, a nagranie z sumą kontrolną SHA-256 i gotowym pismem trafia do Twojego telefonu.
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
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Płatności obsługiwane w 100% przez oficjalne sklepy Google Play, Apple App Store, Samsung Galaxy Store i Huawei AppGallery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs max-w-5xl mx-auto">
            
            {/* Free Tier */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-bold text-slate-300 text-sm">Pakiet Podstawowy</div>
                <div className="text-3xl font-black text-white font-mono">0 zł</div>
                <p className="text-slate-400 text-xs">Do okazjonalnej ochrony i testów.</p>
                
                <ul className="space-y-2 text-slate-300 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2">✓ Identyfikacja spamu na ekranie</li>
                  <li className="flex items-center gap-2">✓ 2 darmowe interwencje asystenta w miesiącu</li>
                  <li className="flex items-center gap-2">✓ Wyszukiwarka numerów marketingowych</li>
                </ul>
              </div>

              <a
                href="#pobierz"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center block transition-colors"
              >
                Pobierz za darmo
              </a>
            </div>

            {/* Popular Tier */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-indigo-950/60 to-slate-950 border border-cyan-500/50 space-y-4 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/30">
              <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500 text-slate-950 uppercase tracking-wide">
                Najczęściej Wybierany
              </span>
              
              <div className="space-y-3">
                <div className="font-bold text-white text-sm">Tarcza Osobista / Rodzina</div>
                <div className="text-3xl font-black text-cyan-400 font-mono">
                  19,99 zł <span className="text-xs font-normal text-slate-400">/ mies.</span>
                </div>
                <p className="text-slate-300 text-xs">Kompletna ochrona dla Ciebie i Twoich bliskich.</p>
                
                <ul className="space-y-2 text-slate-200 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2">✓ Nielimitowane suwaki sprzeciwu RODO i PKE</li>
                  <li className="flex items-center gap-2">✓ Tarcza na oszusta bankowego (Anti-spoofing)</li>
                  <li className="flex items-center gap-2">✓ Certyfikowany węzeł telekonferencji (+48)</li>
                  <li className="flex items-center gap-2">✓ Automatyczny generator pozwów do Prezesa UKE</li>
                  <li className="flex items-center gap-2">✓ Natychmiastowe kasowanie z serwera (Zero-Storage)</li>
                </ul>
              </div>

              <a
                href="#pobierz"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-center block shadow-lg shadow-indigo-600/30 transition-all"
              >
                Aktywuj w aplikacji
              </a>
            </div>

            {/* Pro B2B Tier */}
            <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="font-bold text-slate-300 text-sm">Biznes B2B & Freelance</div>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  49,00 zł <span className="text-xs font-normal text-slate-400">/ mies.</span>
                </div>
                <p className="text-slate-400 text-xs">Dla właścicieli firm i jednoosobowych działalności.</p>
                
                <ul className="space-y-2 text-slate-300 border-t border-slate-800/80 pt-4">
                  <li className="flex items-center gap-2">✓ Wiążące notatki ustne z art. 66 Kodeksu cywilnego</li>
                  <li className="flex items-center gap-2">✓ Własne nagrane formuły firmowe</li>
                  <li className="flex items-center gap-2">✓ Archiwum dowodowe audio z sumą SHA-256</li>
                  <li className="flex items-center gap-2">✓ Faktura VAT 23% wystawiana przez sklep</li>
                </ul>
              </div>

              <a
                href="#pobierz"
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-center block transition-colors"
              >
                Wybierz pakiet B2B
              </a>
            </div>

          </div>

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

      {/* 7. REVIEWS & TESTIMONIALS */}
      <section id="opinie" className="py-20 border-b border-slate-800/80 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
                <span className="text-xs font-bold text-white ml-2">4.9 / 5.0 (ponad 1 200 zablokowanych telemarketerów)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Opinie Abonentów: Jak TelePakt działa w praktyce
              </h2>
              <p className="text-xs text-slate-400">
                Prawdziwe historie użytkowników, którzy uwolnili się od natrętnego telemarketingu.
              </p>
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj swoją opinię</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <div 
                key={rev.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{rev.createdAt}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{rev.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{rev.content}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-300">{rev.authorName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 text-[10px] border border-slate-800">
                    {rev.deviceType}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 8. FAQ SECTION */}
      <section id="faq" className="py-20 border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
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
              <a href="#prawo-pke" className="hover:text-white">Prawo PKE</a>
              <a href="#cennik" className="hover:text-white">Cennik</a>
              <a href="#opinie" className="hover:text-white">Opinie</a>
              <a href="#faq" className="hover:text-white">FAQ</a>
              {onOpenStudio && (
                <button 
                  onClick={onOpenStudio} 
                  className="text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
                >
                  🛠️ Strefa Dewelopera & Admin
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>
              Wszelkie prawa zastrzeżone © 2025 TelePakt.pl • Podstawa prawna: Dz.U. 2024 poz. 1221 (PKE)
            </div>
            <div className="flex items-center gap-4">
              <span>Polityka Prywatności (Zero-Storage)</span>
              <span>Regulamin</span>
              <span>Kontakt: kontakt@telepakt.pl</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Modal: Dodawanie Opinii */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm">Dodaj opinię o TelePakt.pl</h3>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Zamknij ✕
              </button>
            </div>

            {submittedSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-white text-sm">Dziękujemy za opinię!</h4>
                <p className="text-xs text-slate-400">Twoja recenzja została zapisana i dodana do listy.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Imię lub Nick:</label>
                  <input
                    type="text"
                    required
                    placeholder="np. Marek z Poznania"
                    value={authorInput}
                    onChange={(e) => setAuthorInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Ocena:</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingInput(star)}
                        className="cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= ratingInput ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Zablokowany rodzaj spamu:</label>
                  <input
                    type="text"
                    placeholder="np. Fotowoltaika, Krypto, Naciągacze garnkowi"
                    value={spamTypeInput}
                    onChange={(e) => setSpamTypeInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Twoja opinia:</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Opisz jak TelePakt pomógł Ci w walce ze spamem..."
                    value={contentInput}
                    onChange={(e) => setContentInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Opublikuj opinię
                </button>
              </form>
            )}
          </div>
        </div>
      )}

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
                  <p className="text-xs text-slate-400">Wersja Przedpremierowa (Release Candidate 1.0)</p>
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
                📱 PWA (1-klik)
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
                  <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <strong className="text-white text-xs block">
                        Aplikacja jest gotowa do natychmiastowej instalacji na Twoim telefonie!
                      </strong>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Dzięki technologii <strong>Progressive Web App (PWA)</strong>, zarejestrowanemu manifestowi i Service Workerowi nie musisz czekać na weryfikację w sklepach. TelePakt instaluje się z własną ikoną na pulpicie telefonu, działa pełnoekranowo i zachowuje się jak natywna aplikacja.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">Jak zainstalować na telefonie z Androidem (Google Chrome lub Samsung Internet):</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <li>Otwórz stronę <code className="text-cyan-400 font-mono">telepakt.pl</code> w przeglądarce <strong>Google Chrome</strong> lub <strong>Samsung Internet</strong> na telefonie.</li>
                      <li>Kliknij menu w prawym górnym rogu (ikona trzech pionowych kropek <strong>⋮</strong>).</li>
                      <li>Wybierz opcję <strong className="text-white">„Zainstaluj aplikację”</strong> lub <strong className="text-white">„Dodaj do ekranu głównego”</strong>.</li>
                      <li>Potwierdź klikając <strong className="text-emerald-400">„Zainstaluj”</strong>. Ikona tarczy TelePakt pojawi się na pulpicie obok innych Twoich aplikacji!</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm">Jak zainstalować na iPhone (Apple Safari):</h4>
                    <ol className="list-decimal list-inside space-y-2 text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                      <li>Otwórz stronę w <strong>Safari</strong> na iOS.</li>
                      <li>Dotknij przycisk <strong className="text-white">Udostępnij</strong> (kwadrat ze strzałką w górę na dolnym pasku).</li>
                      <li>Przewiń w dół i wybierz <strong className="text-white">„Do ekranu początkowego” (Add to Home Screen)</strong>.</li>
                    </ol>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      onClick={handleCopyLink}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                      <span>{copiedLink ? 'Skopiowano adres!' : 'Skopiuj adres do otwarcia na telefonie'}</span>
                    </button>
                    <span className="text-[11px] text-slate-400 text-center sm:text-left">
                      Otwórz ten adres bezpośrednio w Chrome na swoim smartfonie.
                    </span>
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

    </div>
  );
};
