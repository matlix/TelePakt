import React, { useState, useRef } from 'react';
import { LegalScript, AppNameOption } from '../types';
import { PolishVoiceSynthesizer } from '../utils/speech';
import {
  Mic, MicOff, Play, Pause, Square, Check, Volume2, Upload,
  Sparkles, ShieldCheck, RefreshCw, AlertCircle, FileAudio, HelpCircle, Plus
} from 'lucide-react';
import { CustomAnswerModal } from './CustomAnswerModal';

interface VoiceStudioProps {
  appName: AppNameOption;
  scripts: LegalScript[];
  onUpdateScript: (updated: LegalScript) => void;
  onAddCustomScript?: (script: LegalScript) => void;
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({
  appName,
  scripts,
  onUpdateScript,
  onAddCustomScript,
}) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scripts[0].id);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const activeScript = scripts.find(s => s.id === selectedScriptId) || scripts[0];

  const startMicrophoneRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);

        const updated: LegalScript = {
          ...activeScript,
          audioBlobUrl: url,
          isUserRecorded: true,
          recordedAt: new Date().toLocaleDateString('pl-PL')
        };
        onUpdateScript(updated);

        setSuccessToast(`Głos dla skryptu „${activeScript.title}” został nagrany i zapisany!`);
        setTimeout(() => setSuccessToast(null), 4000);

        // stop tracks to release microphone
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Mikrofon niedostępny:', err);
      alert('Nie udało się uzyskać dostępu do mikrofonu. Możesz nadal używać profesjonalnego polskiego syntezatora mowy (TTS).');
    }
  };

  const stopMicrophoneRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handlePlayTTS = () => {
    if (isPlayingTTS) {
      PolishVoiceSynthesizer.stop();
      setIsPlayingTTS(false);
    } else {
      setIsPlayingTTS(true);
      PolishVoiceSynthesizer.speak(activeScript.text, {
        rate: ttsSpeed,
        onStart: () => setIsPlayingTTS(true),
        onEnd: () => setIsPlayingTTS(false),
        onError: () => setIsPlayingTTS(false)
      });
    }
  };

  const handlePlayRecordedAudio = () => {
    if (!audioBlobUrl) return;

    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioBlobUrl);
      audioElementRef.current.onended = () => setIsPlayingRecorded(false);
    }

    if (isPlayingRecorded) {
      audioElementRef.current.pause();
      setIsPlayingRecorded(false);
    } else {
      audioElementRef.current.currentTime = 0;
      audioElementRef.current.play();
      setIsPlayingRecorded(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Mic className="w-3.5 h-3.5" />
            Studio Głosu & Klauzul Prawnych
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Nagraj swój własny głos lub wybierz polskiego lektora AI
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Nagranie skryptu własnym głosem sprawia, że telemarketer ma wrażenie rozmowy z Tobą na żywo. Gdy w trakcie połączenia klikniesz suwak w {appName.name}, bot chmurowy natychmiast odtworzy Twój plik audio.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Script Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dostępne odpowiedzi ({scripts.length})
            </h3>
            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nowa odpowiedź
            </button>
          </div>

          <div className="space-y-2">
            {scripts.map((script) => {
              const isSelected = script.id === selectedScriptId;
              return (
                <button
                  key={script.id}
                  onClick={() => {
                    setSelectedScriptId(script.id);
                    PolishVoiceSynthesizer.stop();
                    setIsPlayingTTS(false);
                    setIsPlayingRecorded(false);
                    setAudioBlobUrl(script.audioBlobUrl || null);
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-xs relative flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">
                      {script.title}
                    </span>
                    {script.isUserRecorded ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Twój głos
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                        Lektor AI
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-[11px] line-clamp-2">
                    {script.shortDesc}
                  </p>
                  <div className="text-[10px] font-mono text-indigo-400 pt-1">
                    {script.durationEst}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legal Hint */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Dlaczego treść musi być precyzyjna?
            </div>
            <p>
              Użycie zwrotu <em>„wnoszę sprzeciw z art. 21 RODO”</em> oraz <em>„art. 398 Prawa komunikacji elektronicznej”</em> pozbawia firmę telemarketingową prawa do dalszego dzwonienia, a nagranie ma pełną moc dowodową przed Prezesem UODO i UKE.
            </p>
          </div>
        </div>

        {/* Right Column: Audio Recording & TTS Studio */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Script Text Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">
                  Aktualna treść do odczytania:
                </span>
                <h4 className="text-lg font-bold text-white">
                  {activeScript.title}
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
                Podstawa: {activeScript.legalAct}
              </span>
            </div>

            {/* Script Text Display */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed font-sans relative">
              <p className="italic">
                „{activeScript.text}”
              </p>
            </div>

            {/* Controls Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              
              {/* Box 1: Record Your Voice (Microphone) */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-rose-400" />
                      Nagrywanie własnego głosu
                    </h5>
                    {isRecording && (
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Nagraj powyższą formułę swoim mikrofonem. Zostanie wgrana do Twojej chmury telefonii.
                  </p>
                </div>

                {isRecording ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-rose-400">
                      <span>Nagrywanie...</span>
                      <span>00:{recordingSeconds.toString().padStart(2, '0')}</span>
                    </div>
                    <button
                      onClick={stopMicrophoneRecording}
                      className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      Zatrzymaj i zapisz nagranie
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={startMicrophoneRecording}
                      className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      Rozpocznij nagrywanie (Mikrofon)
                    </button>

                    {audioBlobUrl && (
                      <button
                        onClick={handlePlayRecordedAudio}
                        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                      >
                        {isPlayingRecorded ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlayingRecorded ? 'Pauza' : 'Odsłuchaj Twoje nagranie'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Box 2: Polish Neural Voice (TTS) */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
                <div>
                  <h5 className="font-bold text-white text-sm flex items-center gap-1.5 mb-1">
                    <Volume2 className="w-4 h-4 text-indigo-400" />
                    Polski lektor syntezowany (TTS)
                  </h5>
                  <p className="text-xs text-slate-400">
                    Jeśli wolisz nie nagrywać głosu, bot użyje polskiego głosu lektorskiego (Polly.Maja / Ewa).
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Szybkość mowy:</span>
                    <span className="font-mono text-indigo-400">{ttsSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.8"
                    max="1.3"
                    step="0.05"
                    value={ttsSpeed}
                    onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />

                  <button
                    onClick={handlePlayTTS}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    {isPlayingTTS ? <Pause className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isPlayingTTS ? 'Zatrzymaj odsłuch' : 'Odsłuchaj lektora polskiego'}
                  </button>
                </div>
              </div>

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
          setSelectedScriptId(newScript.id);
        }}
      />
    </div>
  );
};
