import React, { useState, useEffect, useRef } from 'react';
import { LegalScript, AppNameOption, CallLog } from '../types';
import { LEGAL_SCRIPTS } from '../data/legalScripts';
import { PolishVoiceSynthesizer } from '../utils/speech';
import {
  Phone, PhoneOff, PhoneCall, Volume2, VolumeX, ShieldAlert,
  Mic, Radio, Sliders, CheckCircle2, AlertTriangle, Play,
  Pause, RotateCcw, Smartphone, ArrowRight, FileText, Sparkles, Check, Plus,
  Download, Cloud, HardDrive, Lock, Settings2
} from 'lucide-react';
import { CustomAnswerModal } from './CustomAnswerModal';
import { ResponseOrderManagerModal } from './ResponseOrderManagerModal';
import { CloudExportModal } from './CloudExportModal';
import { downloadRecordingLocally } from '../utils/audioExporter';

interface InCallSimulatorProps {
  appName: AppNameOption;
  scripts?: LegalScript[];
  preselectedScript?: LegalScript | null;
  onCallLogged: (log: CallLog) => void;
  onOpenComplaint: (log: CallLog) => void;
  onAddCustomScript?: (script: LegalScript) => void;
  onUpdateScripts?: (scripts: LegalScript[]) => void;
  onResetScripts?: () => void;
}

export const CALLER_SCENARIOS = [
  {
    id: 'telemarketer',
    name: 'Fotowoltaika / Pokazy (Spam)',
    number: '+48 22 104 39 88',
    location: 'Warszawa • 142 zgłoszenia',
    risk: 'critical' as const,
    badge: 'Niechciany Telemarketing'
  },
  {
    id: 'bank-spoof',
    name: 'Rzekomy Dział Bezpieczeństwa Banku',
    number: '+48 22 598 40 00',
    location: 'Numer podszyty pod infolinię banku',
    risk: 'critical' as const,
    badge: 'Próba Wyłudzenia BLIK / AnyDesk'
  },
  {
    id: 'windykator',
    name: 'Kancelaria Windykacyjna Sp. k.',
    number: '+48 71 889 02 11',
    location: 'Wrocław • Przedawnione roszczenia',
    risk: 'high' as const,
    badge: 'Nękanie Telefoniczne'
  },
  {
    id: 'b2b-client',
    name: 'Klient Inwestycyjny / Zleceniodawca',
    number: '+48 601 234 567',
    location: 'Połączenie komórkowe (B2B)',
    risk: 'low' as const,
    badge: 'Ustalenia Zakresu Prac'
  }
];

export const InCallSimulator: React.FC<InCallSimulatorProps> = ({
  appName,
  scripts = LEGAL_SCRIPTS,
  preselectedScript,
  onCallLogged,
  onOpenComplaint,
  onAddCustomScript,
  onUpdateScripts,
  onResetScripts,
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [selectedScenario, setSelectedScenario] = useState(CALLER_SCENARIOS[0]);
  const [callState, setCallState] = useState<'idle' | 'incoming' | 'connected' | 'dialing_bot' | 'merging_conference' | 'bot_playing' | 'ended'>('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const [botSeconds, setBotSeconds] = useState(0);
  const [activeScript, setActiveScript] = useState<LegalScript>(preselectedScript || scripts[0]);
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);
  const [lastLoggedCall, setLastLoggedCall] = useState<CallLog | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSliderPanel, setShowSliderPanel] = useState(true);
  const [phoneMode, setPhoneMode] = useState<'conference' | 'forward_reject'>('conference');
  const [sliderFilter, setSliderFilter] = useState<'all' | 'custom' | 'marketer' | 'fraud' | 'b2b'>('all');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [inlineQuickText, setInlineQuickText] = useState('');
  const [overrideAutoHangup, setOverrideAutoHangup] = useState<boolean | null>(null);
  const [autoHangupStatusNotice, setAutoHangupStatusNotice] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [zeroStorageOnDownload, setZeroStorageOnDownload] = useState(true);
  const [postCallFeedback, setPostCallFeedback] = useState<string | null>(null);

  // Compute effective autoHangup: uses user's live override if set, else script default (defaults to true)
  const effectiveAutoHangup = overrideAutoHangup !== null ? overrideAutoHangup : (activeScript.autoHangup ?? true);

  const handleSaveRecordingOnPhone = () => {
    if (!lastLoggedCall) return;
    const res = downloadRecordingLocally(lastLoggedCall, appName.name);

    const updated: CallLog = {
      ...lastLoggedCall,
      downloadedLocally: true,
      downloadTimestamp: 'Przed chwilą',
      deletedFromServer: zeroStorageOnDownload ? true : lastLoggedCall.deletedFromServer,
      deletedFromServerTimestamp: zeroStorageOnDownload ? 'Przed chwilą (Zero-Storage)' : lastLoggedCall.deletedFromServerTimestamp,
      serverRetentionExpiry: zeroStorageOnDownload ? 'Trwale wykasowane z serwera' : lastLoggedCall.serverRetentionExpiry
    };

    setLastLoggedCall(updated);
    onCallLogged(updated);

    if (zeroStorageOnDownload) {
      setPostCallFeedback(`Pobrano ${res.filename} na telefon i usunięto z serwera (Zero-Storage)!`);
    } else {
      setPostCallFeedback(`Pobrano ${res.filename} na telefon (${res.sizeKb} KB).`);
    }

    setTimeout(() => setPostCallFeedback(null), 4000);
  };

  useEffect(() => {
    if (preselectedScript) {
      setActiveScript(preselectedScript);
      setOverrideAutoHangup(null);
    }
  }, [preselectedScript]);

  const timerRef = useRef<number | null>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  // Call timer effect
  useEffect(() => {
    if (callState === 'connected' || callState === 'dialing_bot' || callState === 'merging_conference' || callState === 'bot_playing') {
      timerRef.current = window.setInterval(() => {
        setCallSeconds(prev => prev + 1);
        if (callState === 'bot_playing' || callState === 'merging_conference') {
          setBotSeconds(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Handle voice playback when bot is playing
  useEffect(() => {
    if (callState === 'bot_playing') {
      setIsSpeakingVoice(true);
      setAutoHangupStatusNotice(null);

      const onPlaybackFinished = () => {
        setIsSpeakingVoice(false);
        if (effectiveAutoHangup) {
          setAutoHangupStatusNotice('⚡ Auto-Rozłączenie aktywne: Rozłączam połączenie...');
          setTimeout(() => {
            handleEndCall();
          }, 1200);
        } else {
          setAutoHangupStatusNotice('📞 Oświadczenie zakończone: Pozostajesz na linii, nagrywanie trwa.');
          // Stay on call - switch back to connected state so user can keep talking or play another script
          setCallState('connected');
        }
      };

      if (soundEnabled) {
        PolishVoiceSynthesizer.speak(activeScript.text, {
          rate: 1.05,
          onStart: () => setIsSpeakingVoice(true),
          onEnd: () => {
            onPlaybackFinished();
          },
          onError: () => {
            onPlaybackFinished();
          }
        });
      }

      // Fallback timer based on word length if audio synthesizer fails or completes
      const wordCount = activeScript.text.split(' ').length;
      const durationMs = Math.max(5000, Math.min(28000, Math.round(wordCount * 380)));
      speechTimeoutRef.current = window.setTimeout(() => {
        if (callState === 'bot_playing') {
          onPlaybackFinished();
        }
      }, durationMs);

      return () => {
        if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
      };
    } else {
      PolishVoiceSynthesizer.stop();
      setIsSpeakingVoice(false);
      if (speechTimeoutRef.current) clearTimeout(speechTimeoutRef.current);
    }
  }, [callState, activeScript, soundEnabled, effectiveAutoHangup]);

  const handleStartIncomingCall = () => {
    PolishVoiceSynthesizer.stop();
    setCallSeconds(0);
    setBotSeconds(0);
    setLastLoggedCall(null);
    setCallState('incoming');
  };

  const handleAnswerCall = () => {
    setCallState('connected');
  };

  const handleRejectCall = () => {
    if (phoneMode === 'forward_reject') {
      // Forward to bot directly!
      setCallState('bot_playing');
      setActiveScript(LEGAL_SCRIPTS[3]); // forward reject script
    } else {
      setCallState('ended');
      PolishVoiceSynthesizer.stop();
    }
  };

  const handleTriggerScript = (script: LegalScript) => {
    setActiveScript(script);
    setOverrideAutoHangup(null);
    setAutoHangupStatusNotice(null);
    setCallState('dialing_bot');

    // Simulate bot line dialing: ~2.5s to reach bot
    setTimeout(() => {
      if (platform === 'ios') {
        // iPhone prompts "Scal połączenia (Merge calls)"
        setCallState('merging_conference');
      } else {
        // Android dialer auto-merges in 1s
        setCallState('bot_playing');
      }
    }, 2200);
  };

  const handleIosMergeCalls = () => {
    setCallState('bot_playing');
  };

  const handleEndCall = () => {
    PolishVoiceSynthesizer.stop();
    const finalCallLog: CallLog = {
      id: `call-${Date.now().toString().slice(-4)}`,
      callerNumber: selectedScenario.number,
      callerName: selectedScenario.name,
      spamCategory: selectedScenario.badge,
      spamRisk: selectedScenario.risk,
      timestamp: 'Przed chwilą (' + new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }) + ')',
      durationSeconds: callSeconds,
      botConnectedSeconds: botSeconds,
      scriptUsed: activeScript.title,
      status: 'objection_delivered',
      complaintFiled: false
    };

    setLastLoggedCall(finalCallLog);
    onCallLogged(finalCallLog);
    setCallState('ended');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate billed minutes for Twilio (rounded up to nearest whole minute)
  const billedMinutes = botSeconds > 0 ? Math.ceil(botSeconds / 60) : 0;
  const estimatedCostPln = (billedMinutes * 0.08).toFixed(2); // ~8 groszy per minute on Twilio/Plivo

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left: Interactive Phone Hardware Mockup */}
      <div className="lg:col-span-6 flex flex-col items-center">
        {/* Platform Selector & Sound Toggle */}
        <div className="w-full max-w-sm flex items-center justify-between gap-3 mb-4">
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setPlatform('android')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                platform === 'android'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Android (Auto-merge)
            </button>
            <button
              onClick={() => setPlatform('ios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                platform === 'ios'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              iPhone iOS (CallKit)
            </button>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (soundEnabled) PolishVoiceSynthesizer.stop();
            }}
            title={soundEnabled ? 'Dźwięk polskiego lektora włączony' : 'Dźwięk wyciszony'}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-colors ${
              soundEnabled
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            <span className="text-[11px] font-medium hidden sm:inline">{soundEnabled ? 'Lektor PL' : 'Wyciszony'}</span>
          </button>
        </div>

        {/* Smartphone Bezel */}
        <div className="relative w-full max-w-[340px] sm:max-w-[360px] aspect-[9/19] bg-slate-950 rounded-[48px] p-3 border-4 border-slate-800 shadow-2xl shadow-indigo-950/40 ring-1 ring-slate-700/50 flex flex-col overflow-hidden">
          
          {/* Dynamic Island / Speaker Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center">
            {platform === 'ios' ? (
              <div className="h-6 w-24 bg-black rounded-full flex items-center justify-between px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              </div>
            ) : (
              <div className="h-4 w-16 bg-slate-900 rounded-full border border-slate-800 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            )}
          </div>

          {/* Phone Screen Display */}
          <div className="relative w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-[38px] overflow-hidden flex flex-col justify-between text-white p-5 pt-10 select-none">
            
            {/* Top Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span>09:41</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded font-semibold text-emerald-400">VoLTE 5G</span>
                <span>Play / Orange</span>
              </div>
            </div>

            {/* Content Area Based on State */}
            {callState === 'idle' && (
              <div className="flex-1 flex flex-col items-center justify-between text-center p-2 py-4">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-inner">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-0.5">
                    {appName.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    Wybierz rodzaj dzwoniącego i przetestuj działanie bota w słuchawce:
                  </p>

                  {/* Scenario selection pills */}
                  <div className="space-y-1 text-left mb-4">
                    {CALLER_SCENARIOS.map(sc => (
                      <button
                        key={sc.id}
                        onClick={() => setSelectedScenario(sc)}
                        className={`w-full p-2 rounded-xl text-xs border text-left transition-all flex items-center justify-between ${
                          selectedScenario.id === sc.id
                            ? 'bg-indigo-950/60 border-indigo-500 text-white font-medium ring-1 ring-indigo-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span className="truncate">{sc.name}</span>
                        <span className="text-[10px] font-mono text-indigo-400 shrink-0">{sc.number}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartIncomingCall}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <PhoneCall className="w-4 h-4 animate-bounce" />
                  Symuluj to połączenie przychodzące
                </button>
              </div>
            )}

            {callState === 'incoming' && (
              <div className="flex-1 flex flex-col items-center justify-between py-6 animate-in fade-in">
                {/* Caller Info */}
                <div className="text-center space-y-1.5 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border animate-pulse ${
                    selectedScenario.risk === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : selectedScenario.risk === 'high'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}>
                    <ShieldAlert className="w-3 h-3" />
                    {selectedScenario.badge}
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-white font-mono">
                    {selectedScenario.number}
                  </h3>
                  <p className="text-xs text-indigo-300 font-medium">
                    {selectedScenario.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {selectedScenario.location}
                  </p>
                </div>

                {/* Pulsing avatar */}
                <div className="relative my-2">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center animate-ping absolute inset-0 ${
                    selectedScenario.risk === 'critical' ? 'bg-rose-500/20' : 'bg-indigo-500/20'
                  }`} />
                  <div className={`w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border-2 shadow-xl relative z-10 ${
                    selectedScenario.risk === 'critical' ? 'border-rose-500 text-rose-400' : 'border-indigo-500 text-indigo-400'
                  }`}>
                    <Phone className="w-8 h-8 rotate-12" />
                  </div>
                </div>

                {/* Call actions */}
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-around gap-4 px-2">
                    {/* Decline */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={handleRejectCall}
                        className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 active:scale-95 transition-transform"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </button>
                      <span className="text-[11px] text-slate-400 font-medium">Odrzuć</span>
                    </div>

                    {/* Answer */}
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={handleAnswerCall}
                        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-95 transition-transform animate-bounce"
                      >
                        <Phone className="w-6 h-6" />
                      </button>
                      <span className="text-[11px] text-slate-400 font-medium">Odbierz</span>
                    </div>
                  </div>

                  {/* Mode hint */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setPhoneMode(phoneMode === 'conference' ? 'forward_reject' : 'conference')}
                      className="text-[10px] text-indigo-400 underline hover:text-indigo-300"
                    >
                      Tryb odrzucenia: {phoneMode === 'conference' ? 'Zwykłe odrzucenie' : 'Przekieruj do bota ze sprzeciwem'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(callState === 'connected' || callState === 'dialing_bot' || callState === 'merging_conference' || callState === 'bot_playing') && (
              <div className="flex-1 flex flex-col justify-between py-2">
                
                {/* Caller & Timer Header */}
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    +48 22 104 39 88
                  </h3>
                  <div className="flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {formatTime(callSeconds)}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  <div className="pt-1">
                    {callState === 'connected' && (
                      <span className="text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                        Rozmowa trwa • Powiedz „Chwileczkę” i kliknij suwak
                      </span>
                    )}
                    {callState === 'dialing_bot' && (
                      <span className="text-[11px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse flex items-center justify-center gap-1">
                        <Radio className="w-3 h-3 animate-spin" />
                        Łączenie z polską linią bota (+48)...
                      </span>
                    )}
                    {callState === 'merging_conference' && (
                      <span className="text-[11px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30 flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-400" />
                        Bot połączony • Kliknij „Scal rozmowy”
                      </span>
                    )}
                    {callState === 'bot_playing' && (
                      <span className="text-[11px] text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center justify-center gap-1 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Konferencja 3-stronna aktywna • Odtwarzanie oświadczenia
                      </span>
                    )}
                    {autoHangupStatusNotice && (
                      <div className={`mt-1.5 text-[10px] px-2.5 py-1 rounded-full border font-semibold flex items-center justify-center gap-1 animate-in fade-in ${
                        effectiveAutoHangup 
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/35 shadow-sm' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35 shadow-sm'
                      }`}>
                        {autoHangupStatusNotice}
                      </div>
                    )}
                  </div>
                </div>

                {/* iPhone Merge Step if applicable */}
                {callState === 'merging_conference' && platform === 'ios' && (
                  <div className="p-3 my-2 rounded-xl bg-blue-950/60 border border-blue-500/40 text-center animate-in zoom-in-95">
                    <p className="text-xs text-blue-200 font-medium mb-2">
                      System iOS wymaga 1 tapnięcia do scalenia połączenia:
                    </p>
                    <button
                      onClick={handleIosMergeCalls}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Scal rozmowy (Merge calls)
                    </button>
                  </div>
                )}

                {/* Audio Waveform visualization during playback */}
                {callState === 'bot_playing' && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 my-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        Głos prawny w słuchawce
                      </span>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Czas bota: {formatTime(botSeconds)}
                      </span>
                    </div>

                    {/* Animated sound bars */}
                    <div className="flex items-center justify-center gap-1 h-8 px-2 bg-slate-950/70 rounded-lg">
                      {[14, 28, 42, 20, 36, 12, 40, 24, 32, 18, 38, 22].map((height, i) => (
                        <div
                          key={i}
                          style={{
                            height: isSpeakingVoice ? `${Math.max(6, (height + (i % 3) * 6))}%` : '20%',
                            transition: 'height 0.15s ease'
                          }}
                          className={`w-1 rounded-full ${
                            isSpeakingVoice ? 'bg-gradient-to-t from-emerald-500 to-teal-300' : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-300 italic line-clamp-2">
                      „{activeScript.text}”
                    </p>
                  </div>
                )}

                {/* In-Call Action Panel / Sliders */}
                <div className="space-y-2 pt-1">
                  
                  {/* Live Auto-Hangup Toggle Switch */}
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-900/95 border border-slate-800 text-[10px]">
                    <span className="text-slate-300 font-medium flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${effectiveAutoHangup ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
                      Koniec wypowiedzi:
                    </span>
                    <button
                      type="button"
                      onClick={() => setOverrideAutoHangup(!effectiveAutoHangup)}
                      title="Kliknij, aby zmienić zachowanie zakończenia tej rozmowy"
                      className={`px-2 py-0.5 rounded-md font-bold transition-all flex items-center gap-1 text-[10px] ${
                        effectiveAutoHangup
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      }`}
                    >
                      {effectiveAutoHangup ? (
                        <>
                          <PhoneOff className="w-2.5 h-2.5" />
                          <span>⚡ Auto-rozłącz (WŁ)</span>
                        </>
                      ) : (
                        <>
                          <Phone className="w-2.5 h-2.5" />
                          <span>📞 Na linii (WŁ)</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-indigo-400" />
                      Panel suwaków ({appName.name})
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsOrderModalOpen(true)}
                        title="Zmień kolejność i ukryj niepotrzebne odpowiedzi na telefonie"
                        className="text-[10px] text-indigo-300 hover:text-white font-bold flex items-center gap-1 bg-indigo-500/15 hover:bg-indigo-600/30 px-2 py-0.5 rounded border border-indigo-500/30 transition-all"
                      >
                        <Settings2 className="w-2.5 h-2.5" /> Kolejność
                      </button>
                      <button
                        onClick={() => setIsCustomModalOpen(true)}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20"
                      >
                        <Plus className="w-2.5 h-2.5" /> Własna odp.
                      </button>
                      <button
                        onClick={() => setShowSliderPanel(!showSliderPanel)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium"
                      >
                        {showSliderPanel ? 'Zwiń' : 'Rozwiń'}
                      </button>
                    </div>
                  </div>

                  {showSliderPanel && (
                    <div className="space-y-2">
                      {/* Filter tabs */}
                      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 text-[9px] font-medium text-slate-400">
                        <button
                          onClick={() => setSliderFilter('all')}
                          className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                            sliderFilter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:text-white'
                          }`}
                        >
                          Wszystkie ({scripts.filter(s => s.enabled !== false).length})
                        </button>
                        <button
                          onClick={() => setSliderFilter('custom')}
                          className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                            sliderFilter === 'custom' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 hover:text-white text-emerald-400'
                          }`}
                        >
                          ★ Moje własne
                        </button>
                        <button
                          onClick={() => setSliderFilter('marketer')}
                          className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                            sliderFilter === 'marketer' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:text-white'
                          }`}
                        >
                          RODO / PKE
                        </button>
                        <button
                          onClick={() => setSliderFilter('fraud')}
                          className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                            sliderFilter === 'fraud' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:text-white'
                          }`}
                        >
                          Oszustwa / Bank
                        </button>
                        <button
                          onClick={() => setSliderFilter('b2b')}
                          className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-colors ${
                            sliderFilter === 'b2b' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 hover:text-white'
                          }`}
                        >
                          B2B / Kurier
                        </button>
                      </div>

                      {/* Scripts List */}
                      <div className="space-y-1.5 max-h-[155px] overflow-y-auto pr-0.5">
                        {scripts
                          .filter(s => {
                            if (s.enabled === false) return false; // respect user preference to hide response
                            if (sliderFilter === 'all') return true;
                            if (sliderFilter === 'custom') return s.category === 'custom' || s.isUserRecorded;
                            if (sliderFilter === 'marketer') return s.category === 'marketer-full' || s.category === 'short-rejection' || s.category === 'recording-notice';
                            if (sliderFilter === 'fraud') return s.category === 'bank-fraud' || s.category === 'debt-collector' || s.category === 'harassment-stalking';
                            if (sliderFilter === 'b2b') return s.category === 'b2b-agreement' || s.category === 'consumer-complaint';
                            return true;
                          })
                          .map((script) => {
                            const isThisActive = activeScript.id === script.id && (callState === 'bot_playing' || callState === 'dialing_bot');
                            return (
                              <button
                                key={script.id}
                                disabled={callState === 'dialing_bot'}
                                onClick={() => handleTriggerScript(script)}
                                className={`w-full text-left p-2 rounded-xl border transition-all text-xs flex items-center justify-between group active:scale-98 ${
                                  isThisActive
                                    ? 'bg-emerald-950/50 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                                }`}
                              >
                                <div className="pr-2 truncate">
                                  <div className="font-semibold text-white group-hover:text-indigo-300 truncate text-[11px] flex items-center gap-1">
                                    {script.isUserRecorded && <span className="text-[9px] text-emerald-400">●</span>}
                                    <span>{script.title}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                    <span>{script.badge}</span>
                                    <span>•</span>
                                    {script.autoHangup !== false ? (
                                      <span className="text-[9px] text-rose-300 font-semibold bg-rose-500/15 px-1 py-0.2 rounded border border-rose-500/25">
                                        ⚡ Rozłącza
                                      </span>
                                    ) : (
                                      <span className="text-[9px] text-emerald-300 font-semibold bg-emerald-500/15 px-1 py-0.2 rounded border border-emerald-500/25">
                                        📞 Na linii
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="shrink-0">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isThisActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white'
                                  }`}>
                                    {isThisActive ? 'W toku' : 'Odtwórz'}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                      </div>

                      {/* Quick inline voice input */}
                      <div className="p-2 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Wpisz szybką odpowiedź..."
                          value={inlineQuickText}
                          onChange={(e) => setInlineQuickText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && inlineQuickText.trim()) {
                              const dynamicScript: LegalScript = {
                                id: `dyn-${Date.now()}`,
                                title: inlineQuickText.slice(0, 24) + '...',
                                shortDesc: inlineQuickText,
                                category: 'custom',
                                legalAct: 'Odpowiedź bieżąca',
                                badge: 'Szybka z klawiatury',
                                durationEst: '~8s',
                                autoHangup: true,
                                text: inlineQuickText,
                                legalBreakdown: []
                              };
                              handleTriggerScript(dynamicScript);
                              setInlineQuickText('');
                            }
                          }}
                          className="bg-transparent text-[11px] text-white flex-1 focus:outline-none placeholder:text-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!inlineQuickText.trim()) return;
                            const dynamicScript: LegalScript = {
                              id: `dyn-${Date.now()}`,
                              title: inlineQuickText.slice(0, 24) + '...',
                              shortDesc: inlineQuickText,
                              category: 'custom',
                              legalAct: 'Odpowiedź bieżąca',
                              badge: 'Szybka z klawiatury',
                              durationEst: '~8s',
                              autoHangup: true,
                              text: inlineQuickText,
                              legalBreakdown: []
                            };
                            handleTriggerScript(dynamicScript);
                            setInlineQuickText('');
                          }}
                          disabled={!inlineQuickText.trim()}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-[10px] font-bold shrink-0"
                        >
                          Mów
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Red Hangup button */}
                  <div className="pt-1 flex justify-center">
                    <button
                      onClick={handleEndCall}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <PhoneOff className="w-4 h-4" />
                      Zakończ połączenie & Zapisz dowód
                    </button>
                  </div>
                </div>

              </div>
            )}

            {callState === 'ended' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white mb-1">
                  Rozmowa zarejestrowana
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Oświadczenie prawne zostało skutecznie odtworzone i zapisane w cyfrowym rejestrze dowodowym.
                </p>

                {lastLoggedCall && (
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-left text-xs mb-4 space-y-1.5 font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Numer:</span>
                      <span className="text-white font-bold">{lastLoggedCall.callerNumber}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Czas rozmowy:</span>
                      <span className="text-white">{formatTime(lastLoggedCall.durationSeconds)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Linia bota:</span>
                      <span className="text-emerald-400 font-semibold">{formatTime(lastLoggedCall.botConnectedSeconds)} (1 min rozlicz.)</span>
                    </div>
                  </div>
                )}

                {postCallFeedback && (
                  <div className="w-full p-2.5 mb-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] text-emerald-300 font-semibold text-center animate-in fade-in">
                    {postCallFeedback}
                  </div>
                )}

                {/* Local save on phone & Zero Storage option */}
                {lastLoggedCall && (
                  <div className="w-full space-y-2 mb-3">
                    <button
                      onClick={handleSaveRecordingOnPhone}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Pobierz nagranie na telefon (WAV)
                    </button>

                    <label className="flex items-start gap-2 text-left p-2 bg-slate-950/80 rounded-xl border border-slate-800 text-[10px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={zeroStorageOnDownload}
                        onChange={(e) => setZeroStorageOnDownload(e.target.checked)}
                        className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 h-3.5 w-3.5 bg-slate-900"
                      />
                      <span className="text-slate-300 leading-tight">
                        <strong className="text-white block">Tryb Zero-Storage:</strong>
                        Usuń nagranie z serwera zaraz po zapisaniu na telefonie
                      </span>
                    </label>

                    <button
                      onClick={() => setIsCloudModalOpen(true)}
                      className="w-full py-2 bg-slate-800 hover:bg-indigo-600/30 text-indigo-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 hover:border-indigo-500/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                      Wyślij do Google Drive / Chmury
                    </button>
                  </div>
                )}

                <div className="w-full space-y-2">
                  {lastLoggedCall && (
                    <button
                      onClick={() => onOpenComplaint(lastLoggedCall)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      Generuj zawiadomienie UKE / UODO
                    </button>
                  )}
                  <button
                    onClick={handleStartIncomingCall}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Nowy test połączenia
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Home Indicator Bar */}
            <div className="w-28 h-1 bg-slate-700 rounded-full mx-auto mt-2 opacity-50" />
          </div>
        </div>
      </div>

      {/* Right Column: Telephony Architecture Explainer & Live Metrics */}
      <div className="lg:col-span-6 space-y-6">
        
        {/* Real-time Bot Telephony Engine Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-white">
                Architektura Chmurowej Linii Botowej (3-Way Conference)
              </h3>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
              Twilio Poland (+48)
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Zarówno <strong>iOS</strong> jak i nowożytny <strong>Android 10+</strong> blokują bezpośrednie wstrzykiwanie dźwięku przez zwykłą aplikację. Rozwiązaniem klasy produkcyjnej (używanym m.in. przez <em>TapeACall</em>) jest <strong>chmurowa linia konferencyjna</strong>.
          </p>

          {/* Timeline Steps */}
          <div className="space-y-3 relative pl-6 border-l-2 border-slate-800 my-4 text-xs">
            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">1</span>
              <p className="font-semibold text-slate-200">Połączenie przychodzące i odpowiedź</p>
              <p className="text-slate-400 text-[11px]">Użytkownik odbiera telefon od marketera. Pierwsza część rozmowy jest w 100% darmowa (nie angażuje bota).</p>
            </div>

            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">2</span>
              <p className="font-semibold text-slate-200">Kliknięcie suwaka oświadczenia prawnego</p>
              <p className="text-slate-400 text-[11px]">
                Aplikacja w tle wybiera polski numer serwera (+48 22 ...). Czas zestawienia wynosi <strong>2–4 sekundy</strong> (VoLTE w Polsce).
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">3</span>
              <p className="font-semibold text-slate-200">Scalenie rozmowy (3-way merge)</p>
              <p className="text-slate-400 text-[11px]">
                Na Androidzie aplikacja-dialer scala rozmowę automatycznie w 1 sek. Na iPhonie użytkownik klika systemowe „Scal rozmowy”.
              </p>
            </div>

            <div className="relative">
              <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[9px] text-white font-bold">4</span>
              <p className="font-semibold text-slate-200">Odtworzenie klauzuli & dowód audio</p>
              <p className="text-slate-400 text-[11px]">
                Bot odtwarza nagrany głos użytkownika lub lektora AI, po czym serwer w Pythonie zapisuje plik nagrania MP3 do zgłoszenia w UKE.
              </p>
            </div>
          </div>

          {/* Billing & Minute Tracker Widget */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Taktowanie Twilio</div>
              <div className="text-lg font-bold text-white font-mono">
                {botSeconds}s <span className="text-xs text-slate-400 font-normal">({billedMinutes} min)</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Szacowany koszt</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {estimatedCostPln} zł
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Pakiet 60 minut</div>
              <div className="text-lg font-bold text-indigo-400 font-mono">
                ~60-90 rozmów
              </div>
            </div>
          </div>
        </div>

        {/* Auto-Hangup Feature Explainer Card */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <PhoneOff className="w-4 h-4 text-rose-400" />
              Automatyczne rozłączanie vs Pozostanie na linii
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
              Opcja per odpowiedź
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            W TelePakt każda odpowiedź ma precyzyjnie skonfigurowane zachowanie po wygłoszeniu tekstu. Możesz to zmienić w kreatorze lub przełączyć jednym kliknięciem podczas rozmowy:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-rose-500/30">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                <PhoneOff className="w-3.5 h-3.5" />
                <span>⚡ Auto-rozłączenie (Hangup)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                Serwer w Pythonie natychmiast wysyła komendę <code className="text-rose-300 bg-rose-950/40 px-1 rounded">&lt;Hangup/&gt;</code> do Twilio, zrywając połączenie zaraz po ostatnim słowie.
              </p>
              <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-3">
                <li>Ucina próby dyskusji ze strony natrętnego telemarketera</li>
                <li>Oszczędza minuty i koszty na serwerze (Render/Twilio)</li>
                <li>Idealne dla: RODO, oszust bankowy, stalking, fake exit</li>
              </ul>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-1">
                <Phone className="w-3.5 h-3.5" />
                <span>📞 Pozostanie na linii (Trwa dalej)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                Po odtworzeniu komunikatu połączenie NIE jest rozłączane. Linia konferencyjna nadal nagrywa rozmowę, a Ty kontynuujesz rozmowę.
              </p>
              <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-3">
                <li>Ustalenia cenowe i zakres prac z fachowcem (B2B)</li>
                <li>Złożenie reklamacji u konsultanta operatora/banku</li>
                <li>Zwykła informacja „Rozmowa jest nagrywana”</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Legal Advantages Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 space-y-3">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Dlaczego to oświadczenie natychmiast kończy rozmowę?
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-1">Nowe Prawo PKE (10.11.2024)</span>
              <p className="text-slate-300 text-[11px]">
                Art. 398 PKE bezwzględnie wymaga uprzedniej zgody. Konsultant wie, że UKE może nałożyć karę do 1 000 000 zł na firmę.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-1">Art. 21 + 17 RODO</span>
              <p className="text-slate-300 text-[11px]">
                Sprzeciw wobec marketingu bezpośredniego jest bezwzględny. Konsultant ma prawny obowiązek zablokować rekord w systemie CRM.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Custom Answer Creator Modal */}
      <CustomAnswerModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSaveCustomScript={(newScript) => {
          if (onAddCustomScript) {
            onAddCustomScript(newScript);
          }
          setActiveScript(newScript);
          setSliderFilter('custom');
        }}
      />

      {/* Response Order & Visibility Manager Modal */}
      <ResponseOrderManagerModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        appName={appName}
        scripts={scripts}
        onSaveScriptsOrder={(reordered) => {
          if (onUpdateScripts) onUpdateScripts(reordered);
        }}
        onResetToDefault={() => {
          if (onResetScripts) onResetScripts();
        }}
      />

      {/* Cloud Export Modal */}
      <CloudExportModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        call={lastLoggedCall}
        brandName={appName.name}
        onConfirmSync={(callId, provider, deleteFromServer) => {
          if (lastLoggedCall) {
            const updated: CallLog = {
              ...lastLoggedCall,
              cloudSyncedProvider: provider,
              cloudSyncTimestamp: 'Przed chwilą',
              deletedFromServer: deleteFromServer ? true : lastLoggedCall.deletedFromServer,
              deletedFromServerTimestamp: deleteFromServer ? 'Przed chwilą (Zero-Storage)' : lastLoggedCall.deletedFromServerTimestamp,
              serverRetentionExpiry: deleteFromServer ? 'Trwale wykasowane z serwera' : lastLoggedCall.serverRetentionExpiry
            };
            setLastLoggedCall(updated);
            onCallLogged(updated);
          }
        }}
      />
    </div>
  );
};
