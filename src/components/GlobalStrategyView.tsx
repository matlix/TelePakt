import React, { useState } from 'react';
import {
  Globe, Shield, DollarSign, Scale, Smartphone, Sparkles,
  CheckCircle2, AlertCircle, Play, Pause, FileText, ArrowRight,
  TrendingUp, Users, Lock, ChevronRight, Copy, Check, Terminal, ExternalLink
} from 'lucide-react';
import { GLOBAL_MARKETS, GLOBAL_ARCHITECTURE_STACK, GlobalMarket } from '../data/globalExpansionData';
import confetti from 'canvas-confetti';

export const GlobalStrategyView: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<GlobalMarket>(GLOBAL_MARKETS[0]); // Default USA
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Global Calculator State
  const [globalSubs, setGlobalSubs] = useState<number>(100000);
  const [averageMonthlyFee, setAverageMonthlyFee] = useState<number>(7.99); // $7.99 USD average

  const monthlyGrossRevenue = globalSubs * averageMonthlyFee;
  const twilioGlobalSipCost = globalSubs * 0.35; // ~0.35$ per active user (3 calls x 2 min x $0.015/min + DID allocation)
  const appStoreFee = monthlyGrossRevenue * 0.15; // 15% Apple/Google small business / year 2
  const netMonthlyProfit = monthlyGrossRevenue - twilioGlobalSipCost - appStoreFee;
  const annualNetProfit = netMonthlyProfit * 12;

  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSimulateSpeech = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(selectedCountry.legalScriptSample.speech);
      
      // Select appropriate voice if available
      const langMap: { [code: string]: string } = {
        US: 'en-US',
        UK: 'en-GB',
        DE: 'de-DE',
        FR: 'fr-FR',
        AU: 'en-AU',
        ES: 'es-ES'
      };
      utterance.lang = langMap[selectedCountry.countryCode] || 'en-US';
      utterance.rate = 0.95;
      utterance.pitch = 0.9; // authoritative lawyer tone

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert('Twoja przeglądarka nie obsługuje Web Speech API.');
    }
  };

  return (
    <div className="space-y-10 pb-12">
      
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Ekspansja Globalna: TelePakt / TelePact / ShieldCall Worldwide</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Czy ten model zadziała na całym świecie? <br />
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Tak – na rynkach zachodnich potencjał jest 20-krotnie większy.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Plaga niechcianych telefonów i robocalli to globalny kryzys o wartości dziesiątek miliardów dolarów. Podczas gdy w Polsce art. 398 PKE nakłada kary urzędowe do 1 mln zł, to w <strong>Stanach Zjednoczonych (TCPA)</strong> prawo przewiduje <strong>500$ – 1 500$ kary płatnej bezpośrednio konsumentowi za każdy niechciany telefon!</strong>
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Rynek docelowy: <strong>Ponad 1,2 miliarda smartfonów (USA, UE, UK, AU)</strong>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              Model subskrypcyjny: <strong>4.99$ – 9.99$ USD / miesiąc</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 1. INTERACTIVE GLOBAL MARKET EXPLORER */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2.5">
              <Scale className="w-6 h-6 text-indigo-400" />
              <span>1. Analiza Prawno-Biznesowa Największych Rynków Świata</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Wybierz kraj, aby zobaczyć lokalne przepisy antyspamowe, wysokość kar, przepisy podsłuchowe i gotowy skrypt bota.
            </p>
          </div>

          {/* Country Switcher Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
            {GLOBAL_MARKETS.map((m) => {
              const isSelected = selectedCountry.countryCode === m.countryCode;
              return (
                <button
                  key={m.countryCode}
                  onClick={() => setSelectedCountry(m)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 scale-105'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="text-base">{m.flag}</span>
                  <span>{m.countryCode}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Country Deep-Dive Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-4">
              <span className="text-4xl sm:text-5xl">{selectedCountry.flag}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-black text-white">
                    {selectedCountry.name}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {selectedCountry.nativeName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rekomendowana cena: <strong className="text-emerald-400">{selectedCountry.recommendedPriceMonthly}</strong> ({selectedCountry.recommendedPriceYearly})
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Liczba smartfonów:</span>
                <span className="font-bold text-white">{selectedCountry.marketSizeSmartphones}</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Skala spamu rocznie:</span>
                <span className="font-bold text-amber-400">{selectedCountry.robocallVolumeAnnual}</span>
              </div>
            </div>
          </div>

          {/* Legal Foundation & Enforcement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Podstawa Prawna i Urząd Regulacyjny</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">
                  {selectedCountry.lawEnforcementBody}
                </span>
              </div>
              <p className="text-sm font-semibold text-white">
                {selectedCountry.primaryLaw}
              </p>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-300">
                <strong className="block text-rose-200 mb-0.5">Sankcje & Kary Finansowe:</strong>
                {selectedCountry.penalties}
              </div>
              <div className="text-xs text-slate-400 leading-relaxed pt-1">
                <strong className="text-cyan-300">Unikalna przewaga TelePakt:</strong> {selectedCountry.keyUniqueAngle}
              </div>
            </div>

            {/* Wiretapping and Consent Laws */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Legalność Nagrywania (Wiretapping / Two-Party Consent)</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                  selectedCountry.wiretapConsentRule === 'two_party'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {selectedCountry.wiretapConsentRule === 'two_party' ? 'Two-Party (Wymóg zgody)' : 'Zgoda 1-stronna + Nota'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedCountry.wiretapDetails}
              </p>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300">
                <strong>Złota zasada TelePakt na świecie:</strong> Odtworzenie w pierwszej sekundzie komunikatu „This call is being recorded / Dieses Gespräch wird aufgezeichnet” sprawia, że jeśli spamer nie rozłączy się natychmiast, wyraża dorozumianą zgodę na rejestrację dowodu.
              </div>
            </div>

          </div>

          {/* International Legal Script Demo */}
          <div className="bg-gradient-to-r from-slate-950 to-indigo-950/40 border border-cyan-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300">
                  <Play className="w-4 h-4" />
                </span>
                <div>
                  <h5 className="text-sm font-bold text-white">
                    {selectedCountry.legalScriptSample.title}
                  </h5>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    Język: {selectedCountry.legalScriptSample.language} • {selectedCountry.legalScriptSample.statute}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSimulateSpeech}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Zatrzymaj</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Odsłuchaj Głos Bota</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleCopyScript(selectedCountry.legalScriptSample.speech)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Skopiuj treść oświadczenia prawnego"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Skopiowano' : 'Kopiuj'}</span>
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 text-xs sm:text-sm text-cyan-200 font-mono leading-relaxed">
              "{selectedCountry.legalScriptSample.speech}"
            </div>
          </div>

        </div>
      </div>

      {/* 2. THE USA TCPA PHENOMENON (THE BIGGEST MONEYMAKER) */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Fenomen rynku USA: TelePakt jako Maszyna do Zarabiania dla Użytkowników</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Dlaczego USA to „Złoty Róg” dla tej aplikacji? (Ustawa TCPA)
            </h3>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 self-start md:self-auto">
            47 U.S.C. § 227(b)(3)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs">1</span>
              Kary płatne prosto do kieszeni
            </h4>
            <p className="text-slate-300 leading-relaxed">
              W Polsce kary nakłada Prezes UKE do budżetu państwa. <strong>W Stanach Zjednoczonych każdy konsument ma prawo osobistego pozwu (Private Right of Action)</strong> i otrzymuje <strong>od 500$ do 1 500$</strong> bezpośredniego odszkodowania ustawowego za każde połączenie robocalla wykonane po wycofaniu zgody!
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
              Kultura „TCPA Demand Letters”
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Przeciętna firma telemarketingowa w USA płaci <strong>ugodę przedsądową 750$ – 1 000$</strong> natychmiast po otrzymaniu profesjonalnego pisma z nagraniem audio i sumą SHA-256, by uniknąć kosztów procesu przed federalnym sędzią.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-2.5">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">3</span>
              Płatna subskrypcja sprzedaje się sama
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Amerykanin chętnie zapłaci <strong>9.99$ lub 14.99$ miesięcznie</strong> za wersję „TCPA Bounty Hunter”, ponieważ pojedyncza wygrana ugoda na 1 000$ zwraca mu koszt abonamentu na 8 lat do przodu.
            </p>
          </div>

        </div>
      </div>

      {/* 3. GLOBAL TECHNICAL ARCHITECTURE (HOW IT ACTUALLY WORKS) */}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-black text-white flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-cyan-400" />
            <span>2. Jak to działa technologicznie na całym świecie? (Global Tech Stack)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Architektura oparta na chmurze (Cloud Telephony Anycast) pozwala uruchomić usługę w dowolnym kraju bez stawiania lokalnych serwerowni.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {GLOBAL_ARCHITECTURE_STACK.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-500/40 transition-colors shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-[11px] font-mono font-bold text-cyan-400">
                  {item.layer}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Gotowe
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">
                {item.name}
              </h4>

              <div className="inline-block px-2 py-1 rounded bg-slate-950 font-mono text-[11px] text-indigo-300 border border-slate-800">
                {item.tech}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {item.description}
              </p>

              <div className="pt-2 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zasięg: {item.globalReadiness}</span>
              </div>
            </div>
          ))}

          {/* Global Branding Box */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                Marka Globalna (Rebranding na Świat)
              </span>
              <h4 className="text-sm font-bold text-white mt-2">
                TelePact / CallPact / TrueDefense
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                W Polsce masz doskonałą domenę <strong>telepakt.pl</strong>. Na rynki anglojęzyczne marka naturalnie skaluje się jako <strong>TelePact.com</strong>, <strong>CallPact.ai</strong> lub <strong>ShieldCall.io</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              💡 Ten sam kod aplikacji mobilnej (React / Flutter / Swift) ładuje odpowiedni język i prawo na podstawie kraju karty SIM użytkownika!
            </div>
          </div>

        </div>
      </div>

      {/* 4. GLOBAL PROFIT & SCALE CALCULATOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <span>3. Kalkulator Potencjału Finansowego w Skali Globalnej</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Symulacja przychodów przy ekspansji na rynki USA, UK, Niemiec i Francji.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold">
              Marża operacyjna: ~81%
            </span>
          </div>
        </div>

        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-cyan-400" />
                Liczba płatnych abonentów na świecie:
              </span>
              <span className="text-cyan-400 font-mono font-bold text-sm">
                {globalSubs.toLocaleString('pl-PL')} subskrybentów
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="10000"
              value={globalSubs}
              onChange={(e) => setGlobalSubs(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10 tys. (start)</span>
              <span>250 tys.</span>
              <span>1 000 000 (0.1% rynku)</span>
            </div>
          </div>

          <div className="space-y-2 bg-slate-950 p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Średnia cena miesięczna (USD):
              </span>
              <span className="text-emerald-400 font-mono font-bold text-sm">
                ${averageMonthlyFee.toFixed(2)} USD
              </span>
            </div>
            <input
              type="range"
              min="4.99"
              max="14.99"
              step="1"
              value={averageMonthlyFee}
              onChange={(e) => setAverageMonthlyFee(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>$4.99 (Basic)</span>
              <span>$9.99 (Standard)</span>
              <span>$14.99 (TCPA Pro)</span>
            </div>
          </div>
        </div>

        {/* Financial Outcome Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Miesięczny Przychód Brutto:</span>
            <p className="text-2xl font-black text-white font-mono">
              ${monthlyGrossRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-slate-500">Przez Apple / Google Store</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Koszt SIP Twilio / Telnyx:</span>
            <p className="text-2xl font-black text-rose-400 font-mono">
              -${twilioGlobalSipCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-slate-500">~0.35$ na użytkownika</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-slate-400 font-medium">Zysk Netto / Miesiąc:</span>
            <p className="text-2xl font-black text-emerald-400 font-mono">
              ${netMonthlyProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-emerald-500/80">Po prowizji 15% sklepów</span>
          </div>

          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-1">
            <span className="text-[11px] text-emerald-300 font-bold uppercase">Roczny Zysk Netto (ARR):</span>
            <p className="text-2xl font-black text-emerald-300 font-mono">
              ${annualNetProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
            <span className="text-[10px] text-emerald-400">
              ~{(annualNetProfit * 4.05).toLocaleString('pl-PL', { maximumFractionDigits: 0 })} PLN rocznie
            </span>
          </div>

        </div>

      </div>

      {/* 5. ROADMAP: HOW TO ROLL OUT STEP BY STEP */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <h3 className="text-xl font-black text-white flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <span>4. Trzyetapowy Plan Skalowania na Świat (Step-by-Step Rollout)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold font-mono">ETAP 1</span>
              <span className="text-slate-400 text-[11px]">Miesiące 1 - 3</span>
            </div>
            <h4 className="text-sm font-bold text-white">Debiut w Polsce (telepakt.pl)</h4>
            <p className="text-slate-300 leading-relaxed">
              Walidacja na nowej ustawie PKE (art. 398). Zebranie pierwszych 10 000 subskrybentów, dopracowanie automatyki 3-way conference i integracji z polskimi operatorami (Play, Orange, Plus, T-Mobile).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold font-mono">ETAP 2</span>
              <span className="text-slate-400 text-[11px]">Miesiące 4 - 8</span>
            </div>
            <h4 className="text-sm font-bold text-white">Wejście do USA i UK (TelePact)</h4>
            <p className="text-slate-300 leading-relaxed">
              Wdrożenie amerykańskiej formuły TCPA i angielskiej PECR. Dodanie generatora wezwań przedsądowych „Demand Letter” na $500–$1,500. Kampania wirusowa na TikToku i Instagram Reels: „How I made $1,000 from a spam caller”.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono">ETAP 3</span>
              <span className="text-slate-400 text-[11px]">Miesiące 9 - 18</span>
            </div>
            <h4 className="text-sm font-bold text-white">Unia Europejska (Niemcy, Francja, Hiszpania)</h4>
            <p className="text-slate-300 leading-relaxed">
              Lokalizacja na język niemiecki (UWG § 7) oraz francuski (Bloctel). Monetyzacja B2B: ochrona numerów firmowych i prezesów zarządów przed stalkingiem handlowym.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
