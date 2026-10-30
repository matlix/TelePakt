import React, { useState, useRef } from 'react';
import { LegalScript } from '../types';
import { PolishVoiceSynthesizer } from '../utils/speech';
import {
  Mic, MicOff, Play, Pause, Square, Plus, Sparkles,
  Volume2, X, Check, FileText, Briefcase, Truck, Clock, ShieldCheck,
  PhoneOff, Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CustomAnswerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomScript: (script: LegalScript) => void;
}

const TEMPLATE_PRESETS = [
  {
    title: 'Paczka u sąsiada (Kurier)',
    badge: 'Dostawa / Kurier',
    category: 'custom' as const,
    autoHangup: true,
    text: 'Dzień dobry. Proszę zostawić przesyłkę pod drzwiami lub u sąsiada w lokalu numer 12. Dziękuję i życzę miłego dnia.'
  },
  {
    title: 'Spotkanie – oddzwonię po 16:00',
    badge: 'Spotkanie / Biznes',
    category: 'b2b-agreement' as const,
    autoHangup: true,
    text: 'Dzień dobry. Jestem obecnie na ważnym spotkaniu i nie mogę rozmawiać. Bardzo proszę o kontakt SMS lub oddzwonię po godzinie 16:00.'
  },
  {
    title: 'Wycena dodatkowych prac (Fachowiec)',
    badge: 'Ustalenia B2B',
    category: 'b2b-agreement' as const,
    autoHangup: false,
    text: 'Dzień dobry. Informuję, że koszt dodatkowego zakresu prac ustalony podczas tej rozmowy wynosi 1500 zł netto z terminem wykonania do piątku. Rozmowa jest rejestrowana w celu sporządzenia wiążącej notatki do zlecenia.'
  },
  {
    title: 'Odmowa oferty kredytowej / ubezpieczenia',
    badge: 'Szybka Odmowa',
    category: 'short-rejection' as const,
    autoHangup: true,
    text: 'Dziękuję za telefon. Nie jestem zainteresowany ofertami pożyczkowymi ani ubezpieczeniowymi i nie wyrażam zgody na przetwarzanie mojego numeru w celach marketingowych. Do widzenia.'
  }
];

export const CustomAnswerModal: React.FC<CustomAnswerModalProps> = ({
  isOpen,
  onClose,
  onSaveCustomScript,
}) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [badge, setBadge] = useState('Moja odpowiedź');
  const [category, setCategory] = useState<'custom' | 'b2b-agreement' | 'short-rejection' | 'bank-fraud'>('custom');
  const [autoHangup, setAutoHangup] = useState<boolean>(true);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSecs, setRecordingSecs] = useState(0);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof TEMPLATE_PRESETS[0]) => {
    setTitle(preset.title);
    setText(preset.text);
    setBadge(preset.badge);
    setCategory(preset.category);
    setAutoHangup(preset.autoHangup ?? true);
  };

  const startMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecordingMic(true);
      setRecordingSecs(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSecs(p => p + 1);
      }, 1000);
    } catch (err) {
      console.error(err);
      alert('Nie udało się uzyskać dostępu do mikrofonu. Możesz nadal używać polskiego lektora AI!');
    }
  };

  const stopMicrophone = () => {
    if (mediaRecorderRef.current && isRecordingMic) {
      mediaRecorderRef.current.stop();
      setIsRecordingMic(false);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    }
  };

  const handlePlayTTS = () => {
    if (isPlayingTTS) {
      PolishVoiceSynthesizer.stop();
      setIsPlayingTTS(false);
    } else {
      if (!text.trim()) return;
      setIsPlayingTTS(true);
      PolishVoiceSynthesizer.speak(text, {
        onStart: () => setIsPlayingTTS(true),
        onEnd: () => setIsPlayingTTS(false),
        onError: () => setIsPlayingTTS(false)
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) {
      alert('Proszę podać tytuł oraz treść odpowiedzi.');
      return;
    }

    const estSec = Math.max(6, Math.round(text.split(' ').length * 0.45));
    const newScript: LegalScript = {
      id: `custom-script-${Date.now()}`,
      title: title.trim(),
      shortDesc: text.trim().slice(0, 90) + (text.length > 90 ? '...' : ''),
      category: category,
      legalAct: category === 'b2b-agreement' ? 'Art. 66 i 72 K.c.' : 'Własne oświadczenie użytkownika',
      badge: badge.trim() || 'Własna formuła',
      durationEst: `~${estSec} sekund`,
      autoHangup: autoHangup,
      text: text.trim(),
      legalBreakdown: [
        {
          article: 'Oświadczenie woli użytkownika',
          description: 'Zgodnie z Kodeksem cywilnym oświadczenie woli złożone innej osobie drogą elektroniczną lub telefoniczną ma pełną moc prawną.',
          penalty: 'Wiążące dla stron rozmowy.'
        }
      ],
      audioBlobUrl: recordedAudioUrl || undefined,
      isUserRecorded: Boolean(recordedAudioUrl),
      recordedAt: new Date().toLocaleDateString('pl-PL')
    };

    onSaveCustomScript(newScript);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/95 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Kreator Własnych Odpowiedzi do Rozmowy
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Stwórz swój własny suwak odpowiedzi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Wpisz dowolny tekst, nagraj go swoim głosem lub użyj lektora AI. Nowy suwak natychmiast pojawi się na ekranie rozmowy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          
          {/* Quick presets bar */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              Popularne gotowe szablony (kliknij, aby załadować):
            </span>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_PRESETS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500 text-slate-300 hover:text-white border border-slate-700 text-xs transition-all flex items-center gap-1.5"
                >
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Nazwa przycisku / suwaka na telefonie *
              </label>
              <input
                type="text"
                required
                placeholder="np. Paczka u sąsiada, Wycena 2500 zł"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Etykieta / Kategoria
              </label>
              <input
                type="text"
                placeholder="np. Kurier, Biznes, Rodzina"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">
                Pełna treść wypowiadana do słuchawki przez bota *
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {text.length} znaków
              </span>
            </div>
            <textarea
              required
              rows={4}
              placeholder="Wpisz słowa, które bot lub Twój głos ma odtworzyć rozmówcy..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
            />
          </div>

          {/* Call Termination Option (Auto-Hangup vs Stay on Call) */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                Zakończenie połączenia po wygłoszeniu odpowiedzi:
              </label>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                autoHangup 
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}>
                {autoHangup ? '⚡ Auto-Rozłączenie włączone' : '📞 Pozostanie na linii'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option: Auto Hangup */}
              <button
                type="button"
                onClick={() => setAutoHangup(true)}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  autoHangup
                    ? 'bg-rose-950/20 border-rose-500/60 shadow-md shadow-rose-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-1.5">
                  <div className={`p-2 rounded-lg ${autoHangup ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'}`}>
                    <PhoneOff className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Rozłącz automatycznie
                      {autoHangup && <span className="text-[10px] text-rose-400 font-bold">✓ Wybrane</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      Natychmiast kończy połączenie zaraz po wygłoszeniu tekstu.
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-rose-300/80 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10">
                  Idealne dla: RODO, spam, nękanie, kurier, fałszywy bank.
                </div>
              </button>

              {/* Option: Stay on Call */}
              <button
                type="button"
                onClick={() => setAutoHangup(false)}
                className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                  !autoHangup
                    ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-2.5 mb-1.5">
                  <div className={`p-2 rounded-lg ${!autoHangup ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      Pozostań na linii
                      {!autoHangup && <span className="text-[10px] text-emerald-400 font-bold">✓ Wybrane</span>}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-snug mt-0.5">
                      Rozmowa trwa dalej, nagrywanie jest w toku, możesz dalej rozmawiać.
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-emerald-300/80 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10">
                  Idealne dla: umowy ustne B2B, reklamacje, negocjacje.
                </div>
              </button>
            </div>
          </div>

          {/* Voice Audio Options */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Record mic */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Opcja A: Nagraj własnym mikrofonem
              </span>
              {isRecordingMic ? (
                <button
                  type="button"
                  onClick={stopMicrophone}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Zatrzymaj (00:{recordingSecs.toString().padStart(2, '0')})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startMicrophone}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Mic className="w-4 h-4 text-rose-400" />
                  {recordedAudioUrl ? 'Nagraj ponownie' : 'Nagraj Twój głos'}
                </button>
              )}
            </div>

            {/* Test TTS */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">
                Opcja B: Polski lektor syntezowany (TTS)
              </span>
              <button
                type="button"
                onClick={handlePlayTTS}
                disabled={!text.trim()}
                className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/40 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <Volume2 className="w-4 h-4 text-emerald-400" />
                {isPlayingTTS ? 'Zatrzymaj odsłuch' : 'Odsłuchaj na żywo'}
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Zapisz i dodaj suwak do telefonu
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
