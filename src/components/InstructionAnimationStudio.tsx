import React, { useState, useEffect, useRef } from 'react';
import { AppNameOption } from '../types';
import { PolishVoiceSynthesizer } from '../utils/speech';
import {
  Play, Pause, RotateCcw, Volume2, VolumeX, Smartphone, Monitor,
  Square, Film, Sparkles, Shield, PhoneCall, PhoneOff, ArrowRight,
  Scale, CheckCircle2, Download, Copy, Check, Users, MessageSquare,
  AlertTriangle, Flame, ShieldAlert, Award, FileText, ChevronRight
} from 'lucide-react';

interface InstructionAnimationStudioProps {
  appName: AppNameOption;
  onOpenSimulator?: () => void;
  onOpenDocuments?: () => void;
}

type AspectRatio = '9:16' | '16:9' | '1:1';

interface SceneData {
  id: number;
  title: string;
  subtitle: string;
  badge: string;
  durationMs: number;
  spokenNarration: string;
  callerName: string;
  callerNumber: string;
  callerTag: string;
  telemarketerState: 'talking' | 'shocked' | 'panicking' | 'hung_up' | 'fine_received';
  scriptNoticeText: string;
  legalArticle: string;
  fineAmount: string;
  phoneStatus: string;
}

export const InstructionAnimationStudio: React.FC<InstructionAnimationStudioProps> = ({
  appName,
  onOpenSimulator,
  onOpenDocuments,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [copiedCaption, setCopiedCaption] = useState<string | null>(null);
  const [activeSpeed, setActiveSpeed] = useState<number>(1);

  const scenes: SceneData[] = [
    {
      id: 1,
      title: 'Scena 1: Niechciany Telefon Spamera',
      subtitle: 'Telemarketer dzwoni z losowego numeru (CLI spoofing: Warszawa)',
      badge: 'ALERT SPAMU',
      durationMs: 4000,
      spokenNarration: 'Dzwoni natrętny telemarketer lub automat z ofertą garnków czy fotowoltaiki.',
      callerName: 'Centrum Ofert i Dotacji',
      callerNumber: '+48 22 199 43 21 (Warszawa)',
      callerTag: 'SPAM / PODEJRZANY TELEMARKETING',
      telemarketerState: 'talking',
      scriptNoticeText: 'Konsultant: "Dzień dobry, wygrał Pan darmowy voucher..."',
      legalArticle: 'Złamanie Art. 398 Prawa komunikacji elektronicznej',
      fineAmount: 'Brak zgody na kontakt',
      phoneStatus: 'Połączenie przychodzące...',
    },
    {
      id: 2,
      title: 'Scena 2: Przesunięcie Suwaka TelePakt',
      subtitle: '1-Tap: Aktywacja tarczy prawnej bez wchodzenia w dyskusję',
      badge: '1 KLIKNIĘCIE',
      durationMs: 4500,
      spokenNarration: 'Zamiast tracić nerwy na kłótnie, przesuwasz jeden suwak TelePakt na ekranie telefonu.',
      callerName: 'Centrum Ofert i Dotacji',
      callerNumber: '+48 22 199 43 21',
      callerTag: 'AKTYWACJA OCHRONY TELEPAKT',
      telemarketerState: 'shocked',
      scriptNoticeText: 'Łączenie z botem prawnym TelePakt i dołączanie do telekonferencji...',
      legalArticle: 'Inicjalizacja telekonferencji 3-stronnej SIP',
      fineAmount: 'Przygotowanie dowodu',
      phoneStatus: 'TelePakt Bot dołącza do linii...',
    },
    {
      id: 3,
      title: 'Scena 3: Oficjalna Formuła Prawna',
      subtitle: 'Prawniczy głos odczytuje Art. 398 PKE & Art. 21 RODO',
      badge: 'TARCZA PRAWNA',
      durationMs: 6000,
      spokenNarration: 'Wirtualny prawnik odczytuje formułę art. 398 PKE, zakaz kontaktu i żądanie usunięcia danych z CRM.',
      callerName: 'Konsultant Call Center',
      callerNumber: '+48 22 199 43 21',
      callerTag: 'ODCZYT SPRZECIWU RODO & PKE',
      telemarketerState: 'panicking',
      scriptNoticeText: '„Rozmowa jest nagrywana. Zgodnie z art. 398 PKE żądam usunięcia numeru pod rygorem kary do 1 miliona zł!”',
      legalArticle: 'Art. 398 PKE + Art. 21 i 17 RODO',
      fineAmount: 'Kara do 1 000 000 PLN (UKE)',
      phoneStatus: 'Formuła prawna w toku (Nagrywanie aktywne)',
    },
    {
      id: 4,
      title: 'Scena 4: Panika i Ucieczka Telemarketera',
      subtitle: 'Konsultant natychmiast klika rozłącz i usuwa numer z CRM',
      badge: 'ROZŁĄCZENIE',
      durationMs: 4000,
      spokenNarration: 'Telemarketer zdaje sobie sprawę z odpowiedzialności finansowej firmy i natychmiast przerywa połączenie.',
      callerName: 'Konsultant Rozłączony',
      callerNumber: '+48 22 199 43 21',
      callerTag: 'POŁĄCZENIE ZERWANE PRZEZ DZWONIĄCEGO',
      telemarketerState: 'hung_up',
      scriptNoticeText: 'Konsultant: "Yyy... dziękuję, do widzenia..." [KLIK - ROZŁĄCZONO]',
      legalArticle: 'Wpis do bazy CRM: BLOKADA KONTAKTU / SPRZECIW',
      fineAmount: 'Skuteczna obrona numeru',
      phoneStatus: 'Połączenie zakończone przez rozmówcę',
    },
    {
      id: 5,
      title: 'Scena 5: Certyfikat Dowodowy & Zero-Storage',
      subtitle: 'Zapis do chmury / Zero-Storage i gotowy wniosek do UKE',
      badge: 'PEŁEN SUKCES',
      durationMs: 4500,
      spokenNarration: 'Aplikacja generuje certyfikat dowodowy z sumą SHA-256 i usuwa pliki z serwerów w trybie Zero-Storage.',
      callerName: 'Raport Zdarzenia #TLP-2025',
      callerNumber: 'Zabezpieczono nagranie WAV',
      callerTag: 'CERTYFIKAT DOWODOWY DLA UKE / UODO',
      telemarketerState: 'fine_received',
      scriptNoticeText: 'Wygenerowano dowód ze znacznikami czasu. Sprawa gotowa do zgłoszenia w UKE.',
      legalArticle: 'Zgodność z Art. 308 K.p.c. (Dowód sądowy)',
      fineAmount: 'Zero-Storage: Skasowano z chmury',
      phoneStatus: 'Zabezpieczono w Google Drive użytkownika',
    },
  ];

  const currentScene = scenes[currentSceneIndex];

  // Animation playback timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      const stepTime = 50;
      const stepPercent = (stepTime / (currentScene.durationMs / activeSpeed)) * 100;

      interval = setInterval(() => {
        setProgressPercent((prev) => {
          if (prev >= 100) {
            // Next scene
            if (currentSceneIndex < scenes.length - 1) {
              setCurrentSceneIndex((prevIdx) => prevIdx + 1);
              return 0;
            } else {
              // Loop or stop
              setIsPlaying(false);
              return 100;
            }
          }
          return prev + stepPercent;
        });
      }, stepTime);
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentSceneIndex, currentScene.durationMs, activeSpeed, scenes.length]);

  // Voice narration when scene changes while playing
  useEffect(() => {
    if (isPlaying && isAudioEnabled) {
      PolishVoiceSynthesizer.speak(currentScene.spokenNarration, {
        pitch: 1.0,
        rate: activeSpeed * 1.05,
      });
    }
  }, [currentSceneIndex, isPlaying, isAudioEnabled, activeSpeed]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      PolishVoiceSynthesizer.stop();
    } else {
      if (progressPercent >= 100 && currentSceneIndex === scenes.length - 1) {
        setCurrentSceneIndex(0);
        setProgressPercent(0);
      }
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    PolishVoiceSynthesizer.stop();
    setCurrentSceneIndex(0);
    setProgressPercent(0);
  };

  const handleSelectScene = (index: number) => {
    PolishVoiceSynthesizer.stop();
    setCurrentSceneIndex(index);
    setProgressPercent(0);
    if (isAudioEnabled && isPlaying) {
      PolishVoiceSynthesizer.speak(scenes[index].spokenNarration, { rate: activeSpeed });
    }
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(label);
    setTimeout(() => setCopiedCaption(null), 3000);
  };

  // Pre-made social media hooks for creator marketing
  const socialHooks = [
    {
      platform: 'TikTok / Instagram Reels / Shorts (9:16)',
      title: 'Hook 1: „Czy wiesz, że za ten 1 telefon możesz ukarać firmę na 1 000 000 zł?”',
      content: `🔥 Dzwoni do Ciebie spam z fotowoltaiką? NIE ROZŁĄCZAJ SIĘ!
10 listopada 2024 weszło w życie nowe Prawo Komunikacji Elektronicznej (art. 398).
Zamiast krzyczeć, włączasz TelePakt – bot recytuje paragrafy z żądaniem usunięcia numeru z CRM pod rygorem 1 miliona zł kary od UKE.
Telemarketerzy uciekają w 10 sekund, a Twój numer znika z ich bazy na zawsze! 🛑
👉 Sprawdź www.telepakt.pl – legalna tarcza w smartfonie.
#telepakt #stopspam #rodo #prawo #telemarketing #polska #technologia`,
    },
    {
      platform: 'YouTube / Strona WWW (16:9)',
      title: 'Opis wideo: „Jak legalnie i skutecznie powstrzymać telemarketerów w Polsce”',
      content: `W tym wideo pokazujemy działanie TelePakt (telepakt.pl) w oparciu o Art. 398 ustawy Prawo komunikacji elektronicznej (PKE) oraz Art. 21 RODO.
Zwykłe blokery typu Truecaller zawodzą, ponieważ telemarketerzy maskują numery (CLI spoofing). TelePakt uderza bezpośrednio w ich system CRM, wymuszając natychmiastowe usunięcie danych osobowych i generując certyfikat dowodowy dla Prezesa UKE.
Działa na iPhone i Android w trybie telekonferencji 3-stronnej oraz Zero-Storage dla pełnej prywatności.`,
    },
  ];

  return (
    <div className="space-y-8">
      
      {/* Studio Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/70 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Film className="w-3.5 h-3.5" />
              <span>Studio Animacji & Wideo Wytłumaczeniowego (Explainer Video)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Interaktywna Animacja Instruktażowa dla {appName.name}
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Wizualna, dynamiczna prezentacja zasady działania systemu: od odebrania natrętnego spamu, przez przesunięcie suwaka, odtworzenie formuły art. 398 PKE, po panikę konsultanta i wygenerowanie certyfikatu kary 1 mln zł dla UKE.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                aspectRatio === '9:16'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>TikTok / Reels (9:16)</span>
            </button>
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                aspectRatio === '16:9'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>Landing Page / YT (16:9)</span>
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                aspectRatio === '1:1'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Square className="w-4 h-4 text-emerald-400" />
              <span>Post Feed (1:1)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left / Center Video Stage */}
        <div className="lg:col-span-7 flex flex-col items-center">
          
          {/* Viewport Canvas Frame */}
          <div 
            className={`relative w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex flex-col justify-between ${
              aspectRatio === '9:16'
                ? 'max-w-[360px] h-[640px]'
                : aspectRatio === '16:9'
                ? 'max-w-2xl h-[380px]'
                : 'max-w-[460px] h-[460px]'
            }`}
          >
            {/* Top Bar of the Mocked Screen */}
            <div className="p-4 z-20 flex items-center justify-between bg-gradient-to-b from-slate-950/90 to-transparent">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  TELEPAKT LIVE DEMO
                </span>
              </div>
              <div className="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300 font-mono">
                Scena {currentScene.id}/5
              </div>
            </div>

            {/* Dynamic Animated Central Visuals */}
            <div className="relative flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
              
              {/* Scene 1: Incoming Spam Alert */}
              {currentScene.id === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-xs">
                  <div className="relative mx-auto w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/50 flex items-center justify-center">
                    <PhoneCall className="w-10 h-10 text-red-400 animate-bounce" />
                    <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold uppercase tracking-wide">
                      SPAM
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white">
                      {currentScene.callerName}
                    </h3>
                    <p className="text-sm font-mono text-slate-300 mt-0.5">
                      {currentScene.callerNumber}
                    </p>
                    <p className="text-[11px] text-red-400 font-semibold mt-1">
                      ⚠️ Podejrzenie: Niechciana fotowoltaika / Akwizycja
                    </p>
                  </div>

                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-left">
                    <p className="text-[11px] text-red-200 italic">
                      {currentScene.scriptNoticeText}
                    </p>
                  </div>
                </div>
              )}

              {/* Scene 2: 1-Tap Slider Gesture */}
              {currentScene.id === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-xs w-full">
                  <div className="relative mx-auto w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center">
                    <Shield className="w-10 h-10 text-cyan-400 animate-pulse" />
                  </div>

                  <div className="text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30">
                      Ekran Rozmowy TelePakt
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">
                      Przesuń, aby włączyć Tarczę Prawną
                    </h3>
                  </div>

                  {/* Animated Slider Element */}
                  <div className="relative bg-slate-900 border border-cyan-500/50 rounded-full p-1.5 flex items-center shadow-lg shadow-cyan-500/20 overflow-hidden">
                    <div 
                      className="h-10 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-600 flex items-center justify-end px-3 transition-all duration-700 shadow-md text-white font-bold text-xs"
                      style={{ width: `${Math.max(35, progressPercent)}%` }}
                    >
                      <ArrowRight className="w-4 h-4 text-white animate-pulse" />
                    </div>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-cyan-200 pointer-events-none">
                      ▶ SPRZECIW PKE / RODO (1-TAP)
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 text-center">
                    Cichy bot włącza się na linię jako telekonferencja 3-stronna
                  </p>
                </div>
              )}

              {/* Scene 3: Legal Bot Announcement */}
              {currentScene.id === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-sm">
                  <div className="flex items-center justify-center gap-1.5 h-12">
                    {[40, 75, 95, 60, 85, 100, 70, 90, 50, 80, 100, 65].map((height, idx) => (
                      <span
                        key={idx}
                        className="w-1.5 bg-gradient-to-t from-cyan-500 to-indigo-400 rounded-full transition-all duration-150 animate-pulse"
                        style={{ height: `${height}%`, animationDelay: `${idx * 80}ms` }}
                      />
                    ))}
                  </div>

                  <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 shadow-xl text-left space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        GŁOS PRAWNIKA (TELEPAKT BOT)
                      </span>
                      <span className="text-emerald-400">REC ● WAV 24-bit</span>
                    </div>
                    <p className="text-xs text-white font-medium leading-relaxed">
                      {currentScene.scriptNoticeText}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Zagrożenie: Kara do 1 000 000 zł (Art. 445 PKE)
                  </div>
                </div>
              )}

              {/* Scene 4: Telemarketer Hangs Up */}
              {currentScene.id === 4 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-xs">
                  <div className="relative mx-auto w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                    <PhoneOff className="w-10 h-10 text-slate-400" />
                  </div>

                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
                      EFEKT NATYCHMIASTOWY
                    </span>
                    <h3 className="text-lg font-black text-white mt-1">
                      Telemarketer Ucieka z Linii
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Konsultant rozłącza połączenie w ciągu kilku sekund
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-left">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Wymuszony status w CRM telemarketera:</span>
                    </div>
                    <p className="text-[11px] font-mono text-emerald-200">
                      DO_NOT_CALL_RODO_OBJECTION (USUNIĘTY)
                    </p>
                  </div>
                </div>
              )}

              {/* Scene 5: Certificate & Zero-Storage */}
              {currentScene.id === 5 && (
                <div className="space-y-3 animate-in fade-in duration-300 max-w-sm">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 p-0.5 shadow-xl">
                    <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                      <Award className="w-8 h-8 text-cyan-400" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">
                      Protokół Dowodowy Wygenerowany
                    </h3>
                    <p className="text-xs text-slate-400">
                      Art. 308 K.p.c. – Pełna moc dowodowa przed Sądem, UKE i UODO
                    </p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-left space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Status nagrania:</span>
                      <span className="text-emerald-400 font-bold">W chmurze użytkownika</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Polityka prywatności:</span>
                      <span className="text-cyan-400 font-mono">Zero-Storage (Brak na serwerze)</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Podpis kryptograficzny:</span>
                      <span className="text-amber-400 font-mono">SHA-256 Valid</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onOpenSimulator}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
                    >
                      Przetestuj w Symulatorze
                    </button>
                    <button
                      onClick={onOpenDocuments}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
                    >
                      Dokumenty
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Subtitle Caption Strip */}
            <div className="p-4 z-20 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent space-y-2">
              <div className="bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-xl px-3 py-2 text-center">
                <p className="text-xs font-semibold text-cyan-200">
                  „{currentScene.spokenNarration}”
                </p>
              </div>

              {/* Progress bar inside phone */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-100"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

          </div>

          {/* Interactive Player Controls */}
          <div className="mt-6 w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlayPause}
                  className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95"
                  title={isPlaying ? 'Pauza' : 'Odtwórz animację'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  onClick={handleRestart}
                  className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  title="Od początku"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isAudioEnabled ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
                  }`}
                  title={isAudioEnabled ? 'Wyłącz lektora' : 'Włącz lektora'}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {[0.75, 1, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setActiveSpeed(spd)}
                    className={`px-2 py-1 rounded-lg font-mono text-[11px] font-bold transition-colors ${
                      activeSpeed === spd ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Scene Selector Strip */}
            <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-slate-800">
              {scenes.map((sc, idx) => (
                <button
                  key={sc.id}
                  onClick={() => handleSelectScene(idx)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    currentSceneIndex === idx
                      ? 'bg-indigo-600/20 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold">Krok {sc.id}</div>
                  <div className="text-[11px] font-semibold truncate hidden sm:block">{sc.badge}</div>
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* Right Column: Scripts for Social Media & Video Creators */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active Scene Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold">
                {currentScene.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Czas trwania: {(currentScene.durationMs / 1000).toFixed(1)}s
              </span>
            </div>

            <h3 className="text-lg font-bold text-white">
              {currentScene.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentScene.subtitle}
            </p>

            <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                Skrypt lektorski do sceny:
              </div>
              <p className="text-xs text-slate-200 italic font-medium">
                „{currentScene.spokenNarration}”
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Artykuł prawny:</span>
                <span className="text-amber-400 font-bold text-[11px]">{currentScene.legalArticle}</span>
              </div>
              <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Sankcja / Status:</span>
                <span className="text-emerald-400 font-bold text-[11px]">{currentScene.fineAmount}</span>
              </div>
            </div>
          </div>

          {/* Viral Social Media Package */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gotowe Scenariusze dla Twórców (TikTok / YT / Reels)</span>
            </div>
            <p className="text-xs text-slate-300">
              Użyj tych gotowych opisów, nagłówków i skryptów do publikacji filmów promocyjnych aplikacji {appName.name} na TikToku, Instagramie i YouTube.
            </p>

            <div className="space-y-3">
              {socialHooks.map((hook, idx) => (
                <div key={idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400">
                      {hook.platform}
                    </span>
                    <button
                      onClick={() => handleCopyText(hook.content, `hook-${idx}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors"
                    >
                      {copiedCaption === `hook-${idx}` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Skopiowano</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Kopiuj skrypt</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-white">
                    {hook.title}
                  </p>

                  <pre className="text-[11px] text-slate-400 whitespace-pre-wrap font-sans bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {hook.content}
                  </pre>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const fullScript = scenes.map(s => `[${s.badge}] ${s.title}\nLektor: "${s.spokenNarration}"\nEkran: ${s.scriptNoticeText}\n`).join('\n---\n\n');
                  const blob = new Blob([fullScript], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `scenariusz_wideo_${appName.name.toLowerCase()}_tiktok_yt.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors w-full"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Pobierz Pełny Scenopis (TXT)</span>
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
