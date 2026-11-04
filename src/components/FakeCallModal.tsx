import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, PhoneOff, PhoneCall, Shield, Volume2, VolumeX,
  Play, RotateCcw, X, Check, Download, FileText, AlertTriangle,
  Clock, Smartphone, Sparkles, Scale, Mic, ArrowRight, CheckCircle2, Info
} from 'lucide-react';
import { RingtoneService } from '../utils/ringtoneAudio';
import { PolishVoiceSynthesizer } from '../utils/speech';
import { LEGAL_SCRIPTS } from '../data/legalScripts';
import { LegalScript, CallLog } from '../types';
import { downloadRecordingLocally } from '../utils/audioExporter';
import { FeatureInfoModal, FeatureInfoKey } from './FeatureInfoModal';

interface FakeCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCallLogged?: (log: CallLog) => void;
  initialNumber?: string;
  initialCallerName?: string;
}

export const FAKE_CALL_SCENARIOS = [
  {
    id: 'fotowoltaika',
    name: 'Fotowoltaika & Dotacje OZE (Bot)',
    number: '+48 22 104 39 88',
    location: 'Warszawa • 142 zgłoszenia UKE',
    category: 'Niechciany telemarketing',
    botIntro: 'Dzień dobry! Z tej strony Centrum Dotacji OZE. Dzwonię, ponieważ państwa numer został wytypowany do dofinansowania pomp ciepła i paneli fotowoltaicznych...',
    botReaction: 'Eee... przepraszam za kłopot... rozłączam i wykreślam numer z bazy...'
  },
  {
    id: 'bank_spoofing',
    name: 'Fałszywy Dział Bezpieczeństwa Banku',
    number: '+48 22 598 40 00',
    location: 'Numer podszyty pod infolinię',
    category: 'Próba wyłudzenia AnyDesk / BLIK',
    botIntro: 'Dzień dobry, Departament Bezpieczeństwa Banku. Zarejestrowaliśmy podejrzaną próbę wypłaty środków z pana rachunku na kwotę 4500 złotych...',
    botReaction: 'Co pan mówi... jaka kara... ja tylko wykonuję procedurę... do widzenia!'
  },
  {
    id: 'windykacja',
    name: 'Kancelaria Prawno-Windykacyjna Sp. k.',
    number: '+48 71 889 02 11',
    location: 'Wrocław • Przedawnione roszczenia',
    category: 'Nękanie telefoniczne',
    botIntro: 'Dzień dobry, wzywam do natychmiastowego uregulowania zaległości finansowej z tytułu przedawnionej umowy telekomunikacyjnej z 2018 roku...',
    botReaction: 'Zanotowałem sprzeciw formalny i żądanie usunięcia danych z art. 21 RODO. Rozłączam.'
  }
];

export const FakeCallModal: React.FC<FakeCallModalProps> = ({
  isOpen,
  onClose,
  onCallLogged,
  initialNumber,
  initialCallerName
}) => {
  // Device detection
  const isIosDevice = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const [platform, setPlatform] = useState<'android' | 'ios'>(isIosDevice ? 'ios' : 'android');

  // Configuration state
  const [delaySeconds, setDelaySeconds] = useState<number>(0);
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [customNumber, setCustomNumber] = useState(initialNumber || '');
  const [customName, setCustomName] = useState(initialCallerName || '');
  const [isCustomMode, setIsCustomMode] = useState(!!initialNumber);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (initialNumber) {
      setCustomNumber(initialNumber);
      if (initialCallerName) setCustomName(initialCallerName);
      setIsCustomMode(true);
      setCallPhase('config');
    }
  }, [initialNumber, initialCallerName, isOpen]);

  // Call lifecycle state: 'config' | 'countdown' | 'incoming' | 'connected' | 'shield_activated' | 'ended'
  const [callPhase, setCallPhase] = useState<'config' | 'countdown' | 'incoming' | 'connected' | 'shield_activated' | 'ended'>('config');
  const [remainingCountdown, setRemainingCountdown] = useState(0);
  const [callDuration, setCallDuration] = useState(0);
  const [lastCallLog, setLastCallLog] = useState<CallLog | null>(null);
  const [downloadSuccessFeedback, setDownloadSuccessFeedback] = useState(false);
  const [activeFeatureInfo, setActiveFeatureInfo] = useState<FeatureInfoKey | null>(null);

  const scenario = isCustomMode
    ? {
        id: 'custom',
        name: customName || 'Nieznany Telemarketer',
        number: customNumber || '+48 22 999 88 77',
        location: 'Numer testowy użytkownika',
        category: 'Test TelePakt',
        botIntro: 'Dzień dobry, dzwonię z ofertą handlową i promocją na usługi telekomunikacyjne...',
        botReaction: 'Rozumiem, wycofuję połączenie i usuwam numer.'
      }
    : FAKE_CALL_SCENARIOS[selectedScenarioIndex];

  const timerRef = useRef<number | null>(null);

  // Stop everything on unmount or close
  useEffect(() => {
    return () => {
      RingtoneService.stopRinging();
      PolishVoiceSynthesizer.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCallPhase('config');
      setCallDuration(0);
      setDownloadSuccessFeedback(false);
    } else {
      RingtoneService.stopRinging();
      PolishVoiceSynthesizer.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  // Handle countdown before ring
  useEffect(() => {
    if (callPhase === 'countdown') {
      if (remainingCountdown <= 0) {
        startIncomingCall();
        return;
      }
      const cdTimer = setTimeout(() => {
        setRemainingCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(cdTimer);
    }
  }, [callPhase, remainingCountdown]);

  // Handle active call duration
  useEffect(() => {
    if (callPhase === 'connected' || callPhase === 'shield_activated') {
      timerRef.current = window.setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callPhase]);

  const handleStartFakeCall = () => {
    if (delaySeconds === 0) {
      startIncomingCall();
    } else {
      setRemainingCountdown(delaySeconds);
      setCallPhase('countdown');
    }
  };

  const startIncomingCall = () => {
    setCallDuration(0);
    setCallPhase('incoming');
    if (soundEnabled) {
      RingtoneService.startRinging();
    }
  };

  const handleAnswerCall = () => {
    RingtoneService.stopRinging();
    setCallPhase('connected');

    // Telemarketer speaks intro
    if (soundEnabled) {
      PolishVoiceSynthesizer.speak(scenario.botIntro, {
        rate: 1.0,
        pitch: 1.05
      });
    }
  };

  const handleRejectCall = () => {
    RingtoneService.stopRinging();
    PolishVoiceSynthesizer.stop();
    setCallPhase('config');
  };

  const handleActivateShield = () => {
    PolishVoiceSynthesizer.stop();
    RingtoneService.playShieldActivate();
    setCallPhase('shield_activated');

    // TelePakt assistant official legal objection from Art. 398 PKE
    const legalText = LEGAL_SCRIPTS[0].text;

    if (soundEnabled) {
      PolishVoiceSynthesizer.speak(legalText, {
        rate: 1.05,
        pitch: 0.95,
        onEnd: () => {
          // Play telemarketer panic reaction
          setTimeout(() => {
            PolishVoiceSynthesizer.speak(scenario.botReaction, {
              rate: 1.1,
              onEnd: () => {
                RingtoneService.playBusyTone();
                completeCall();
              }
            });
          }, 800);
        }
      });
    } else {
      setTimeout(() => {
        completeCall();
      }, 7000);
    }
  };

  const completeCall = () => {
    PolishVoiceSynthesizer.stop();
    const finalDuration = Math.max(callDuration, 14);

    const log: CallLog = {
      id: `fake-${Date.now().toString().slice(-4)}`,
      callerNumber: scenario.number,
      callerName: scenario.name,
      spamCategory: scenario.category,
      spamRisk: 'critical',
      timestamp: 'Przed chwilą (' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + ')',
      durationSeconds: finalDuration,
      botConnectedSeconds: 12,
      scriptUsed: 'Telemarketer – Pełny sprzeciw z art. 398 PKE',
      status: 'objection_delivered',
      complaintFiled: false,
      downloadedLocally: false
    };

    setLastCallLog(log);
    if (onCallLogged) {
      onCallLogged(log);
    }
    setCallPhase('ended');
  };

  const handleSaveToPhone = () => {
    if (!lastCallLog) return;
    downloadRecordingLocally(lastCallLog, 'TelePakt');
    setDownloadSuccessFeedback(true);
    setTimeout(() => setDownloadSuccessFeedback(false), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      
      {/* 1. COUNTDOWN BANNER OVERLAY */}
      {callPhase === 'countdown' && (
        <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto text-2xl font-black font-mono animate-pulse">
            {remainingCountdown}s
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-white text-base">Przygotuj się na połączenie testowe!</h4>
            <p className="text-xs text-slate-300">
              Telefon zadzwoni za <strong>{remainingCountdown} sekund</strong>. Możesz odłożyć telefon lub poczekać na dzwonek.
            </p>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            Dzwoniący: <strong className="text-white">{scenario.name}</strong> ({scenario.number})
          </div>
          <button
            onClick={() => setCallPhase('config')}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Anuluj test
          </button>
        </div>
      )}

      {/* 2. CONFIGURATION LAUNCHER SHEET */}
      {callPhase === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                <PhoneCall className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                  TESTER MOBILNY • ANDROID & IPHONE
                </span>
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Wywołaj Próbne Połączenie Anty-Spam
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form options */}
          <div className="p-4 sm:p-6 space-y-5 text-xs text-slate-300 flex-1">
            
            {/* Info highlight */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="text-white text-xs block">
                  Przetestuj działanie TelePakt na żywo na swoim telefonie!
                </strong>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Funkcja uruchamia realistyczny ekran dzwoniącego telemarketera z dzwonkiem telefonicznym, wibracją i syntezą mowy, pozwalając przetestować suwak prawny z art. 398 PKE bez czekania na prawdziwy spam.
                </p>
              </div>
            </div>

            {/* Delay selector */}
            <div className="space-y-2">
              <label className="block text-slate-200 font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Opóźnienie wywołania (kiedy ma zadzwonić):</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {[
                  { sec: 0, label: 'Teraz (0s)' },
                  { sec: 5, label: 'Za 5s' },
                  { sec: 10, label: 'Za 10s' },
                  { sec: 20, label: 'Za 20s' },
                  { sec: 30, label: 'Za 30s' }
                ].map(item => (
                  <button
                    key={item.sec}
                    type="button"
                    onClick={() => setDelaySeconds(item.sec)}
                    className={`py-2 px-1 text-center rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
                      delaySeconds === item.sec
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platform UI toggle */}
            <div className="space-y-2">
              <label className="block text-slate-200 font-bold flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>Interfejs ekranu telefonu:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlatform('android')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    platform === 'android'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Android (Google Dialer)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlatform('ios')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 cursor-pointer transition-all ${
                    platform === 'ios'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>iPhone (Apple iOS)</span>
                </button>
              </div>
            </div>

            {/* Scenario selector */}
            <div className="space-y-2">
              <label className="block text-slate-200 font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span>Scenariusz dzwoniącego telemarketera:</span>
              </label>
              <div className="space-y-2">
                {FAKE_CALL_SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => { setSelectedScenarioIndex(idx); setIsCustomMode(false); }}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      !isCustomMode && selectedScenarioIndex === idx
                        ? 'bg-slate-800/90 border-cyan-500 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:bg-slate-800/50 text-slate-400'
                    }`}
                  >
                    <div>
                      <strong className="text-white block text-xs">{sc.name}</strong>
                      <span className="text-[11px] text-cyan-400 font-mono">{sc.number}</span>
                      <span className="text-[10px] text-slate-500 block">{sc.location}</span>
                    </div>
                    {!isCustomMode && selectedScenarioIndex === idx && (
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                ))}

                {/* Custom scenario toggle */}
                <button
                  type="button"
                  onClick={() => setIsCustomMode(true)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isCustomMode
                      ? 'bg-slate-800/90 border-cyan-500 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-800/50 text-slate-400'
                  }`}
                >
                  <div>
                    <strong className="text-white block text-xs">Własny numer i nazwa do testu</strong>
                    <span className="text-[10px] text-slate-400">Wpisz dowolny numer i nazwę firmy</span>
                  </div>
                  {isCustomMode && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                </button>
              </div>

              {isCustomMode && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 animate-in fade-in">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Nazwa dzwoniącego:</label>
                    <input
                      type="text"
                      placeholder="np. Call Center Fotowoltaika Sp. z o.o."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Numer telefonu:</label>
                    <input
                      type="text"
                      placeholder="+48 22 123 45 67"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sound & vibration toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-300 font-semibold text-xs">Dźwięk dzwonka i wibracja telefonu</span>
              </div>
              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  soundEnabled ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    soundEnabled ? 'right-1' : 'left-1'
                  }`}
                />
              </button>
            </div>

          </div>

          {/* Action button */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              {delaySeconds > 0 ? `Zadzwoni za ${delaySeconds}s` : 'Zadzwoni natychmiast'}
            </span>
            <button
              onClick={handleStartFakeCall}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 cursor-pointer transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{delaySeconds > 0 ? `Uruchom odliczanie (${delaySeconds}s)` : 'Zadzwoń teraz'}</span>
            </button>
          </div>

        </div>
      )}

      {/* 3. INCOMING CALL SCREEN (REALISTIC SMARTPHONE DIALER) */}
      {callPhase === 'incoming' && (
        <div className="w-full max-w-[340px] bg-slate-950 rounded-[44px] p-4 border-4 border-slate-700 shadow-2xl relative overflow-hidden animate-in zoom-in-95 flex flex-col justify-between min-h-[560px]">
          
          {/* Top Notch & Status */}
          <div className="space-y-1 text-center pt-3">
            <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase tracking-wider animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>Podejrzenie Spamu / Telemarketing</span>
            </span>
          </div>

          {/* Caller Details */}
          <div className="text-center space-y-3 py-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-slate-300 shadow-lg mx-auto">
                <PhoneCall className="w-9 h-9 text-rose-400 animate-bounce" />
              </div>
              <span className="absolute inset-0 rounded-full border-2 border-rose-500/40 animate-ping pointer-events-none" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-black text-white px-2">
                {scenario.name}
              </h4>
              <p className="text-sm font-mono text-cyan-400 font-bold">
                {scenario.number}
              </p>
              <p className="text-[11px] text-slate-400">
                {scenario.location}
              </p>
            </div>
          </div>

          {/* Bottom Call Controls (Answer vs Reject) */}
          <div className="space-y-4 pb-4">
            <div className="flex items-center justify-around px-4">
              
              {/* Reject button */}
              <div className="text-center space-y-1.5">
                <button
                  onClick={handleRejectCall}
                  className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 cursor-pointer transition-transform mx-auto"
                  title="Odrzuć połączenie"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
                <span className="text-[11px] text-slate-400 font-semibold block">Odrzuć</span>
              </div>

              {/* Answer button */}
              <div className="text-center space-y-1.5">
                <button
                  onClick={handleAnswerCall}
                  className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer transition-transform animate-pulse mx-auto"
                  title="Odbierz połączenie"
                >
                  <Phone className="w-7 h-7" />
                </button>
                <span className="text-[11px] text-emerald-400 font-bold block">Odbierz</span>
              </div>

            </div>

            <p className="text-[10px] text-slate-500 text-center">
              Dotknij <strong className="text-emerald-400">Odbierz</strong>, aby uruchomić taryfę obronną TelePakt
            </p>
          </div>

        </div>
      )}

      {/* 4. ACTIVE CONNECTED CALL SCREEN WITH FLOATING TELEPAKT SLIDER */}
      {(callPhase === 'connected' || callPhase === 'shield_activated') && (
        <div className="w-full max-w-[340px] bg-slate-950 rounded-[44px] p-4 border-4 border-slate-700 shadow-2xl relative overflow-hidden animate-in zoom-in-95 flex flex-col justify-between min-h-[560px]">
          
          {/* Call Header */}
          <div className="text-center space-y-1 pt-2">
            <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto mb-2 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-800 rounded-full" />
            </div>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold ${
              callPhase === 'shield_activated'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {callPhase === 'shield_activated' ? '🛡️ TELEKONFERENCJA TELEPAKT' : '📞 POŁĄCZENIE W TOKU'}
            </span>

            <h4 className="font-bold text-white text-sm truncate px-3">
              {scenario.name}
            </h4>
            <p className="text-xs font-mono text-slate-400">
              {scenario.number}
            </p>
            <div className="text-xs font-mono text-cyan-400 font-bold">
              00:{callDuration < 10 ? `0${callDuration}` : callDuration}
            </div>
          </div>

          {/* Middle: In-Call Visualizer */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            {callPhase === 'connected' ? (
              <div className="space-y-2 text-center">
                <span className="text-[10px] uppercase font-mono font-bold text-amber-400 block">
                  Telemarketer mówi:
                </span>
                <p className="text-xs text-slate-300 italic leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                  „{scenario.botIntro}”
                </p>
                <div className="flex items-center justify-center gap-1 py-1">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <span 
                      key={i} 
                      className="w-1 bg-amber-400 rounded-full animate-pulse"
                      style={{ height: `${10 + (i % 3) * 8}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 block">
                  Lektor TelePakt (Art. 398 PKE):
                </span>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-cyan-500/30 font-medium">
                  „Zgłaszam bezwzględny sprzeciw z art. 398 PKE i art. 21 RODO. Żądam podania NIP i usunięcia numeru z bazy!”
                </p>
                <div className="flex items-center justify-center gap-1 py-1">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <span 
                      key={i} 
                      className="w-1 bg-cyan-400 rounded-full animate-pulse"
                      style={{ height: `${12 + (i % 3) * 12}px`, animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FLOATING ACTION: THE PROMINENT TELEPAKT SLIDER BUTTON */}
          <div className="space-y-3 pb-3">
            {callPhase === 'connected' ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleActivateShield}
                    className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/30 active:scale-95 transition-all cursor-pointer ring-2 ring-cyan-400/80 group"
                  >
                    <Shield className="w-5 h-5 text-white group-hover:scale-110 transition-transform animate-pulse" />
                    <span>PRZESUŃ SUWAK: ART. 398 PKE ➔</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFeatureInfo('autosprzeciw');
                    }}
                    className="h-[52px] px-2.5 rounded-2xl bg-slate-900 border border-cyan-500/40 hover:bg-slate-800 text-cyan-300 flex flex-col items-center justify-center gap-0.5 cursor-pointer shadow-md shrink-0 transition-colors"
                    title="Do czego służy sprzeciw z art. 398 PKE?"
                    aria-label="Informacje o art. 398 PKE"
                  >
                    <Info className="w-4 h-4" />
                    <span className="text-[8px] font-mono font-bold">INFO</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-center text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Sprzeciw wygłoszony • Kończenie...</span>
              </div>
            )}

            {/* Hangup button */}
            <div className="flex justify-center">
              <button
                onClick={completeCall}
                className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg active:scale-95 cursor-pointer"
                title="Rozłącz"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* 5. SUMMARY & PROOF REPORT SCREEN (100% ZERO-STORAGE) */}
      {callPhase === 'ended' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-lg">
              Sukces! Rozmowa Zneutralizowana
            </h3>
            <p className="text-xs text-slate-300">
              Formuła prawna z <strong>art. 398 PKE</strong> została prawidłowo odtworzona. Telemarketer został poinformowany o karze do 1 000 000 zł i rozłączony.
            </p>
          </div>

          {/* Evidence Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Dzwoniący:</span>
              <strong className="text-white font-mono">{scenario.number}</strong>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Czas trwania połączenia:</span>
              <strong className="text-cyan-400 font-mono">{callDuration} sekund</strong>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400">Zastosowany artykuł:</span>
              <div className="flex items-center gap-1.5">
                <strong className="text-indigo-400">Art. 398 PKE & Art. 21 RODO</strong>
                <button
                  type="button"
                  onClick={() => setActiveFeatureInfo('autosprzeciw')}
                  className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-300 text-[8px] font-mono font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Więcej informacji o art. 398 PKE"
                  aria-label="Informacje o art. 398 PKE"
                >
                  <Info className="w-2.5 h-2.5" />
                  <span>INFO</span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status prywatności:</span>
              <div className="flex items-center gap-1.5">
                <strong className="text-emerald-400 flex items-center gap-1">
                  <span>100% Zero-Storage</span>
                </strong>
                <button
                  type="button"
                  onClick={() => setActiveFeatureInfo('zero_storage')}
                  className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-[8px] font-mono font-bold flex items-center gap-0.5 cursor-pointer"
                  title="Co to jest Zero-Storage?"
                  aria-label="Informacje o Zero-Storage"
                >
                  <Info className="w-2.5 h-2.5" />
                  <span>INFO</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={handleSaveToPhone}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 cursor-pointer active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Pobierz nagranie audio i certyfikat na telefon</span>
            </button>

            {downloadSuccessFeedback && (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center text-emerald-300 text-xs font-bold animate-in fade-in">
                ✓ Pliki zapisane pomyślnie w pamięci Twojego telefonu!
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setCallPhase('config')}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Wykonaj kolejny test
              </button>

              <button
                onClick={onClose}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Feature Info Modal (Detailed explanations for Auto-Sprzeciw, Zero-Storage, etc.) */}
      <FeatureInfoModal
        isOpen={Boolean(activeFeatureInfo)}
        featureKey={activeFeatureInfo}
        onClose={() => setActiveFeatureInfo(null)}
      />

    </div>
  );
};
