import React, { useState, useEffect } from 'react';
import {
  Smartphone, PhoneCall, Shield, Play, Pause, RotateCcw,
  CheckCircle2, Scale, Mic, ArrowRight, Zap, Volume2, Lock,
  ChevronRight, AlertTriangle, FileText, Download
} from 'lucide-react';

interface StepData {
  number: number;
  title: string;
  badge: string;
  subtitle: string;
  description: string;
  technicalDetails: string[];
  screenState: {
    callerName: string;
    callerNumber: string;
    callStatus: string;
    statusColor: string;
    bannerText: string;
    speakerWave: boolean;
    evidenceReady: boolean;
  };
}

const STEPS: StepData[] = [
  {
    number: 1,
    title: 'Odebranie połączenia',
    badge: 'KROK 1 • POŁĄCZENIE PRZYCHODZĄCE',
    subtitle: 'Dzwoni natrętne call center lub bot (fotowoltaika, finanse, garnki)',
    description: 'Odbierasz telefon w normalny sposób. Nie musisz się rozłączać ani denerwować. Gdy tylko rozmówca zaczyna czytać ofertę handlową, jesteś gotowy do uruchomienia tarczy.',
    technicalDetails: [
      'Działa na każdym telefonie z Androidem oraz iPhone (iOS)',
      'Kompatybilny ze wszystkimi polskimi operatorami (Play, Orange, Plus, T-Mobile)',
      'Nie wymaga wcześniejszego dodawania numeru do żadnej czarnej listy'
    ],
    screenState: {
      callerName: 'Podejrzenie Spamu: Call Center',
      callerNumber: '+48 22 000 00 88',
      callStatus: 'Połączenie aktywne (00:04)',
      statusColor: 'text-amber-400',
      bannerText: 'Rozmówca oferuje instalację fotowoltaiczną',
      speakerWave: false,
      evidenceReady: false
    }
  },
  {
    number: 2,
    title: 'Aktywacja Suwaka TelePakt',
    badge: 'KROK 2 • JEDEN RUCH PALCA',
    subtitle: 'Przesuwasz pływający suwak prawny na ekranie połączenia',
    description: 'Na Twoim ekranie pojawia się dyskretny, pływający przycisk/suwak TelePakt. Przeciągasz go w prawo – to jedyne działanie, jakie musisz wykonać. Aplikacja natychmiast przejmuje kontrolę nad sytuacją.',
    technicalDetails: [
      'Brak konieczności przełączania aplikacji lub wpisywania czegokolwiek',
      'Pływający widżet asystenta (Overlay na Androidzie, szybki skrót na iOS)',
      'Wybór gotowej formuły lektora lub Twojego własnego nagranego głosu'
    ],
    screenState: {
      callerName: 'Call Center • Fotowoltaika',
      callerNumber: '+48 22 000 00 88',
      callStatus: 'Aktywacja Tarczy Prawnej TelePakt...',
      statusColor: 'text-cyan-400',
      bannerText: 'Zestawianie telekonferencji z węzłem prawnym SIP',
      speakerWave: false,
      evidenceReady: false
    }
  },
  {
    number: 3,
    title: 'Węzeł SIP & Formuła Prawna',
    badge: 'KROK 3 • AUTOMATYCZNA TELEKONFERENCJA',
    subtitle: 'Węzeł w ułamku sekundy wygłasza sprzeciw z art. 398 PKE',
    description: 'TelePakt zestawia połączenie trójstronne (3-way conference). Spokojny, oficjalny głos odczytuje bezwzględny sprzeciw z art. 398 PKE oraz art. 21 RODO, żądając podania NIP firmy dzwoniącej.',
    technicalDetails: [
      'Oficjalne, bezdyskusyjne oświadczenie woli o zakazie kontaktu',
      '95% telemarketerów i botów rozłącza się samo w 10–20 sekund',
      'Ścieżka dźwiękowa rejestrowana jest w celach dowodowych dla UKE i UODO'
    ],
    screenState: {
      callerName: 'TelePakt 3-Way Conference • AKTYWNA',
      callerNumber: 'Formuła: Art. 398 PKE / RODO',
      callStatus: 'Lektor wygłasza formalny sprzeciw (00:18)',
      statusColor: 'text-indigo-400',
      bannerText: '„Żądam natychmiastowego usunięcia numeru z bazy zgodnie z art. 398 PKE...”',
      speakerWave: true,
      evidenceReady: false
    }
  },
  {
    number: 4,
    title: 'Auto-Rozłączenie & Zero-Storage',
    badge: 'KROK 4 • DOWÓD W TELEFONIE & 100% PRYWATNOŚCI',
    subtitle: 'Rozmowa kończy się, a nagranie i pismo trafiają wyłącznie do Ciebie',
    description: 'Aplikacja sama rozłącza połączenie. Kompletny pakiet dowodowy (nagranie MP3 oraz gotowe pismo zawiadomienia o karę do UKE) trafia prosto do pamięci Twojego telefonu lub prywatnej chmury. Na serwerach TelePakt plik audio zostaje natychmiast trwale zniszczony.',
    technicalDetails: [
      '100% Zero-Storage: brak przechowywania plików audio na naszych serwerach',
      'Gotowy wniosek do UKE z datą, godziną i numerem dzwoniącego',
      'Twój numer trafia na wewnętrzną czarną listę call center – telefon milknie!'
    ],
    screenState: {
      callerName: 'Połączenie Zakończone • Sukces!',
      callerNumber: '+48 22 000 00 88 (Zablokowany)',
      callStatus: 'Protokół dowodowy wygenerowany',
      statusColor: 'text-emerald-400',
      bannerText: 'Plik audio zapisany w telefonie • Węzeł wyczyszczony (Zero-Storage)',
      speakerWave: false,
      evidenceReady: true
    }
  }
];

export const AppInstructionGuide: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const step = STEPS[currentStepIndex];

  // Auto-advance timeline when isPlaying is active
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 80; // ms
    const stepDuration = 5500; // 5.5s per step
    const increment = (intervalTime / stepDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + increment >= 100) {
          setCurrentStepIndex((cur) => (cur + 1) % STEPS.length);
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, currentStepIndex]);

  const handleStepSelect = (idx: number) => {
    setCurrentStepIndex(idx);
    setProgress(0);
  };

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title and Play/Pause Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>INTERAKTYWNA INSTRUKCJA OBSŁUGI TELEPAKT</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            Jak obsługiwać aplikację w 4 prostych krokach
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Zobacz animowaną symulację przebiegu interwencji prawnej od dzwonka telefonu po gotowy dowód.
          </p>
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleTogglePlay}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title={isPlaying ? 'Wstrzymaj animację' : 'Wznów animację'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Wstrzymaj</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                <span>Odtwarzaj</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Od początku"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Selector Tabs with Progress Bars */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 relative z-10">
        {STEPS.map((s, idx) => {
          const isActive = currentStepIndex === idx;
          const isPassed = currentStepIndex > idx;
          return (
            <button
              key={s.number}
              onClick={() => handleStepSelect(idx)}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[72px] sm:min-h-[84px] ${
                isActive
                  ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                  isActive 
                    ? 'bg-cyan-500/20 text-cyan-300' 
                    : isPassed 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-slate-900 text-slate-500'
                }`}>
                  KROK {s.number}
                </span>
                {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>

              <div className={`text-xs font-bold leading-tight break-words ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {s.title}
              </div>

              {/* Progress bar line for current active step */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Stage: Side-by-side Explanations & Animated Phone Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10 pt-2">
        
        {/* Left Column: Textual Instructions & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-mono">
              {step.badge}
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-white">
              {step.subtitle}
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Technical highlights checklist */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kluczowe szczegóły tego kroku:</span>
            </h5>
            <ul className="space-y-2">
              {step.technicalDetails.map((detail, dIdx) => (
                <li key={dIdx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    ✓
                  </span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Step Quick Navigation Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => handleStepSelect((currentStepIndex + 1) % STEPS.length)}
              className="px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <span>{currentStepIndex === 3 ? 'Zacznij od KROKU 1' : `Przejdź do KROKU ${currentStepIndex + 2}`}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500">
              Krok {currentStepIndex + 1} z {STEPS.length}
            </span>
          </div>
        </div>

        {/* Right Column: Animated Smartphone Screen Simulator (5 cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[310px] bg-slate-950 rounded-[36px] p-3 border-4 border-slate-700/80 shadow-2xl relative shadow-cyan-500/10">
            
            {/* Phone Speaker Notch */}
            <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto mb-3 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Inner Phone Screen Content */}
            <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-black rounded-[28px] p-4 text-center space-y-4 border border-slate-800 min-h-[360px] flex flex-col justify-between">
              
              {/* Screen Top: Caller Info */}
              <div className="space-y-1 pt-2">
                <div className="w-14 h-14 rounded-full bg-slate-800/90 border border-slate-700 mx-auto flex items-center justify-center text-slate-300 shadow-md">
                  {currentStepIndex === 2 ? (
                    <Scale className="w-7 h-7 text-indigo-400 animate-pulse" />
                  ) : currentStepIndex === 3 ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <PhoneCall className={`w-7 h-7 ${currentStepIndex === 0 ? 'text-amber-400 animate-bounce' : 'text-cyan-400'}`} />
                  )}
                </div>

                <h6 className="font-black text-white text-sm tracking-tight pt-1">
                  {step.screenState.callerName}
                </h6>
                <p className="text-xs font-mono text-slate-400">
                  {step.screenState.callerNumber}
                </p>
                <div className={`text-[11px] font-bold ${step.screenState.statusColor}`}>
                  {step.screenState.callStatus}
                </div>
              </div>

              {/* Dynamic Action / Visual Area depending on step */}
              <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                {currentStepIndex === 0 && (
                  <div className="space-y-2 py-2">
                    <p className="text-[11px] text-slate-300 font-medium">
                      Odbierasz połączenie. Głos po drugiej stronie: <em>„Dzień dobry, dzwonię z programu Czyste Powietrze...”</em>
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-amber-400 font-mono">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Połączenie w toku</span>
                    </div>
                  </div>
                )}

                {currentStepIndex === 1 && (
                  <div className="space-y-2 py-1">
                    <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>PRZESUŃ SUWAK TELEPAKT ➔</span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Dotykasz pływającej tarczy na ekranie. Aplikacja natychmiast zestawia połączenie trójstronne.
                    </p>
                  </div>
                )}

                {currentStepIndex === 2 && (
                  <div className="space-y-2 py-1">
                    <div className="flex items-center justify-center gap-1 py-1">
                      {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                        <span
                          key={bar}
                          className="w-1 bg-cyan-400 rounded-full animate-pulse"
                          style={{
                            height: `${12 + (bar % 3) * 10}px`,
                            animationDelay: `${bar * 120}ms`
                          }}
                        />
                      ))}
                    </div>
                    <div className="text-[10px] text-indigo-300 font-bold">
                      Odczytywanie formuły: art. 398 PKE & RODO
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Lektor: <em>„Zgłaszam formalny sprzeciw i żądam usunięcia numeru z bazy...”</em>
                    </p>
                  </div>
                )}

                {currentStepIndex === 3 && (
                  <div className="space-y-2 py-1 text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-black">
                      <Lock className="w-3.5 h-3.5" />
                      <span>100% Zero-Storage Aktywne</span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-xl border border-emerald-500/30 text-[10px] text-slate-300 space-y-1">
                      <div className="font-bold text-white flex items-center justify-center gap-1">
                        <FileText className="w-3 h-3 text-cyan-400" />
                        <span>Dowód_UKE_2025.pdf + audio.mp3</span>
                      </div>
                      <p className="text-[9px] text-slate-400">
                        Zapisano w telefonie. Dane węzła trwale zniszczone.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Phone Bar: State Status Banner */}
              <div className="pt-1 pb-1">
                <div className="text-[10px] text-slate-400 bg-black/60 py-1.5 px-2 rounded-xl border border-slate-800/80 leading-snug break-words">
                  {step.screenState.bannerText}
                </div>
              </div>

            </div>

            {/* Phone Home Bar */}
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-3" />
          </div>
        </div>

      </div>

    </div>
  );
};
