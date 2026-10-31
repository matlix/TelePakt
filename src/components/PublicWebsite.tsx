import React, { useState } from 'react';
import {
  Shield, Smartphone, Scale, CheckCircle2, AlertTriangle, Play,
  Download, Star, MessageSquare, Plus, Lock, ChevronDown, ChevronUp,
  ExternalLink, ArrowRight, Sparkles, HelpCircle, FileText, Check, PhoneCall
} from 'lucide-react';
import { AppNameOption, CustomerReview } from '../types';
import { INITIAL_CUSTOMER_REVIEWS } from '../data/adminAndReviewsData';

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
  const logoImagePath = '/src/assets/images/telepakt_logo_icon_1793197547893.jpg';

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
      
      {/* 1. PUBLIC WEBSITE HEADER */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo & Name */}
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl overflow-hidden border border-cyan-500/50 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
                <img 
                  src={logoImagePath} 
                  alt="TelePakt Logo" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    TelePakt<span className="text-cyan-400">.pl</span>
                  </span>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-300 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                    PKE Art. 398
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Prawna Tarcza Anty-Spam dla Twojego Telefonu
                </p>
              </div>
            </a>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <a href="#jak-dziala" className="hover:text-cyan-400 transition-colors">Jak to działa</a>
              <a href="#prawo-pke" className="hover:text-cyan-400 transition-colors">Podstawa Prawna</a>
              <a href="#sprawdz-numer" className="hover:text-cyan-400 transition-colors">Sprawdź Numer</a>
              <a href="#pobierz" className="hover:text-cyan-400 transition-colors">Pobierz Aplikację</a>
              <a href="#cennik" className="hover:text-cyan-400 transition-colors">Cennik</a>
              <a href="#opinie" className="hover:text-cyan-400 transition-colors">Opinie (4.9★)</a>
              <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
            </nav>

            {/* Actions: Download CTA + Discrete Admin Studio Button */}
            <div className="flex items-center gap-3">
              {onLockApp && (
                <button
                  onClick={onLockApp}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                  title="Aplikacja przedpremierowa - zablokuj hasłem"
                >
                  <Lock className="w-4 h-4" />
                </button>
              )}

              {onOpenStudio && (
                <button
                  onClick={onOpenStudio}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition-all"
                  title="Przejdź do Studia Projektowego, Generatora Skarg i Panelu Admina"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Studio & Admin</span>
                </button>
              )}

              <a
                href="#pobierz"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz Aplikację</span>
              </a>
            </div>

          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800/80 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <Shield className="w-4 h-4" />
            <span>Oficjalna tarcza prawna zgodna z Prawem komunikacji elektronicznej (PKE 2024)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Koniec niechcianych telefonów. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Jedno kliknięcie. Twoje weto. Zgodnie z prawem.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            <strong>TelePakt.pl</strong> to pierwsza w Polsce aplikacja, która w trakcie uciążliwej rozmowy wpuszcza asystenta prawnego wygłaszającego bezwzględny sprzeciw z <strong>art. 398 PKE</strong> i <strong>art. 21 RODO</strong> pod rygorem kary 1 000 000 zł oraz rejestruje niepodważalny dowód audio dla UKE.
          </p>

          {/* Download Badges - The Big 4 in Poland */}
          <div id="pobierz" className="pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400">
              Dostępne we wszystkich 4 oficjalnych sklepach z aplikacjami w Polsce:
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              
              {/* Google Play */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 text-white flex items-center gap-3 cursor-pointer transition-all shadow-md group">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white">Google Play</strong>
                </div>
              </div>

              {/* Apple App Store */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 text-white flex items-center gap-3 cursor-pointer transition-all shadow-md group">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white">App Store</strong>
                </div>
              </div>

              {/* Samsung Galaxy Store */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/60 text-white flex items-center gap-3 cursor-pointer transition-all shadow-md group">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white">Galaxy Store</strong>
                </div>
              </div>

              {/* Huawei AppGallery */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/60 text-white flex items-center gap-3 cursor-pointer transition-all shadow-md group">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block leading-tight">Pobierz w</span>
                  <strong className="text-xs text-white">AppGallery</strong>
                </div>
              </div>

            </div>

            {/* In-app Simulator Link for Demo */}
            {onOpenSimulator && (
              <div className="pt-2">
                <button
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-4 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Zobacz interaktywny symulator rozmowy w przeglądarce</span>
                </button>
              </div>
            )}
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
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg overflow-hidden border border-cyan-500/40">
                  <img src={logoImagePath} alt="Logo" className="w-full h-full object-cover" />
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
                  className="text-cyan-400 hover:text-cyan-300 font-bold"
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

    </div>
  );
};
