import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Mic, Play, Plus, Square, Trash2, Volume2 } from 'lucide-react';
import { voiceService, VoiceMessage, VoiceSettings } from '../services/voiceService';
import { MAX_RECORD_SECONDS, microphoneErrorMessage, VoiceRecorder } from '../utils/wavRecorder';

const field =
  'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500';

function ErrorBox({ text }: { text: string }) {
  return (
    <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-200">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ głos i tempo */

function VoiceSettingsCard({ settings, voice, rate, onChange, onSaved }: {
  settings: VoiceSettings; voice: string; rate: number; onChange: (voice: string, rate: number) => void; onSaved: (s: VoiceSettings) => void;
}) {
  const setVoice = (v: string) => onChange(v, rate);
  const setRate = (r: number) => onChange(voice, r);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = voice !== settings.voice || rate !== settings.rate;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await voiceService.saveSettings(voice, rate));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
      <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Głos i tempo</h2>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-slate-300">Głos komunikatów</span>
        <select className={field} value={voice} onChange={e => setVoice(e.target.value)}>
          {settings.voices.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-slate-300">Tempo: {rate}%</span>
        <input
          type="range" min={settings.rate_min} max={settings.rate_max} step={5} value={rate}
          onChange={e => setRate(Number(e.target.value))} className="w-full accent-cyan-500"
        />
        <span className="flex justify-between text-[10px] text-slate-500"><span>wolniej</span><span>szybciej</span></span>
      </label>
      <p className="text-[10px] text-slate-500 leading-snug">
        Dotyczy komunikatów czytanych głosem syntezatora. Własne nagranie jest odtwarzane bez zmian. Przycisk „Odtwórz głosem AI” przy komunikacie pokazuje, jak zabrzmi wybrany głos i tempo (także przed zapisaniem).
      </p>
      {error && <ErrorBox text={error} />}
      <button onClick={save} disabled={!dirty || busy} className="w-full py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs font-bold disabled:opacity-40">
        {busy ? 'Zapisywanie…' : saved ? 'Zapisano ✓' : 'Zapisz głos i tempo'}
      </button>
    </section>
  );
}

/* ------------------------------------------------------------------ pojedynczy komunikat */

function MessageCard({ message, settings, previewVoice, previewRate, onChanged, onDeleted }: {
  message: VoiceMessage; settings: VoiceSettings; previewVoice: string; previewRate: number;
  onChanged: (m: VoiceMessage) => void; onDeleted: (id: number) => void;
}) {
  const [title, setTitle] = useState(message.title);
  const [text, setText] = useState(message.text);
  const [situation, setSituation] = useState(message.situation);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const recorder = useRef<VoiceRecorder | null>(null);
  const timer = useRef<number | null>(null);
  const dirty = title !== message.title || text !== message.text || situation !== message.situation;

  const stopTimer = () => { if (timer.current) { window.clearInterval(timer.current); timer.current = null; } };
  useEffect(() => () => { stopTimer(); recorder.current?.cancel(); }, []);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try { await action(); } catch (err: any) { setError(err.message); } finally { setBusy(false); }
  };

  const save = () => run(async () => onChanged(await voiceService.update(message.id, { title, text, situation })));
  const toggleActive = () => run(async () => onChanged(await voiceService.update(message.id, { is_active: !message.is_active })));
  const remove = () => run(async () => { await voiceService.remove(message.id); onDeleted(message.id); });

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    try {
      const r = new VoiceRecorder();
      await r.start();
      recorder.current = r;
      setRecording(true);
      setSeconds(0);
      timer.current = window.setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_RECORD_SECONDS) { stopRecording(); }
          return s + 1;
        });
      }, 1000);
    } catch (err: any) {
      setError(microphoneErrorMessage(err));
    }
  };

  const stopRecording = async () => {
    stopTimer();
    const r = recorder.current;
    if (!r) return;
    recorder.current = null;
    setRecording(false);
    await run(async () => {
      const wav = await r.stop();
      onChanged(await voiceService.uploadAudio(message.id, wav.blob));
    });
  };

  const listen = () => run(async () => setAudioUrl(await voiceService.audioUrl(message.id)));
  // Podgląd czyta aktualną treść z pola (także niezapisaną) wybranym głosem i tempem.
  const preview = () => run(async () => setAudioUrl(await voiceService.previewUrl(message.id, { voice: previewVoice, rate: previewRate, text })));
  const dropRecording = () => run(async () => { setAudioUrl(null); onChanged(await voiceService.removeAudio(message.id)); });

  return (
    <li className={`rounded-2xl border p-3.5 space-y-3 ${message.is_active ? 'bg-slate-900 border-slate-800' : 'bg-slate-950 border-slate-800/60 opacity-80'}`}>
      <input className={field} value={title} onChange={e => setTitle(e.target.value)} maxLength={80} aria-label="Tytuł komunikatu" />
      <select className={field} value={situation} onChange={e => setSituation(e.target.value)} aria-label="Sytuacja">
        {settings.situations.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <textarea
        className={`${field} min-h-[88px] resize-y`} value={text} onChange={e => setText(e.target.value)} maxLength={1000}
        aria-label="Treść komunikatu" placeholder="Treść czytana głosem syntezatora"
      />
      <button onClick={preview} disabled={busy || recording || !text.trim()} className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-700 text-slate-200 text-[11px] font-bold disabled:opacity-50">
        <Volume2 className="w-3.5 h-3.5" /> {busy ? 'Generuję…' : 'Odtwórz głosem AI'}
      </button>
      {dirty && (
        <button onClick={save} disabled={busy} className="w-full py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold disabled:opacity-50">
          Zapisz zmiany
        </button>
      )}

      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-white">{message.has_audio ? 'Własne nagranie' : 'Głos syntezatora'}</span>
          {message.has_audio && <span className="text-slate-400">{message.audio_seconds.toFixed(1)} s</span>}
        </div>
        {recording ? (
          <button onClick={stopRecording} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black">
            <Square className="w-3.5 h-3.5" /> Zatrzymaj ({seconds} s / {MAX_RECORD_SECONDS} s)
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={startRecording} disabled={busy} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-[11px] font-bold disabled:opacity-50">
              <Mic className="w-3.5 h-3.5" /> {message.has_audio ? 'Nagraj ponownie' : 'Nagraj własny głos'}
            </button>
            {message.has_audio ? (
              <button onClick={listen} disabled={busy} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-slate-700 text-slate-200 text-[11px] font-bold disabled:opacity-50">
                <Play className="w-3.5 h-3.5" /> Odsłuchaj
              </button>
            ) : (
              <span className="text-[10px] text-slate-500 leading-snug self-center">Bez nagrania komunikat czyta syntezator.</span>
            )}
          </div>
        )}
        {audioUrl && <audio controls autoPlay src={audioUrl} className="w-full" />}
        {message.has_audio && !recording && (
          <button onClick={dropRecording} disabled={busy} className="w-full py-1.5 text-[10px] text-slate-400 underline disabled:opacity-50">
            Usuń nagranie i wróć do głosu syntezatora
          </button>
        )}
      </div>

      {error && <ErrorBox text={error} />}

      <div className="flex items-center justify-between gap-2">
        <label className="inline-flex items-center gap-2 text-[11px] text-slate-300">
          <input type="checkbox" checked={message.is_active} onChange={toggleActive} disabled={busy} className="w-4 h-4 accent-cyan-500" />
          Pokazuj w nakładce
        </label>
        {confirmDelete ? (
          <span className="flex gap-1.5">
            <button onClick={() => setConfirmDelete(false)} className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[10px] font-bold text-white">Anuluj</button>
            <button onClick={remove} disabled={busy} className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-[10px] font-bold text-white disabled:opacity-60">Usuń</button>
          </span>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300">
            <Trash2 className="w-3.5 h-3.5" /> Usuń komunikat
          </button>
        )}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ zakładka */

export function MessagesTab() {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceDraft, setVoiceDraft] = useState<{ voice: string; rate: number } | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: '', text: '', situation: 'custom' });
  const [addBusy, setAddBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, m] = await Promise.all([voiceService.getSettings(), voiceService.list()]);
      setSettings(s);
      setVoiceDraft(d => d ?? { voice: s.voice, rate: s.rate });
      setMessages(m);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    setAddBusy(true);
    setError(null);
    try {
      const created = await voiceService.create(draft);
      setMessages(list => [...(list || []), created]);
      setDraft({ title: '', text: '', situation: 'custom' });
      setAdding(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Komunikaty dla rozmówcy</h2>
        <p className="text-[11px] text-slate-400 leading-snug">
          Na ekranie rozmowy najpierw przesuwasz suwak „Wybierz odpowiedź”, a potem pojawiają się Twoje komunikaty - każdy to osobny suwak. Przesunięty komunikat odtwarza się przez głośnik telefonu (włącz głośnik w rozmowie), więc rozmówca słyszy go przez mikrofon.
        </p>
      </div>

      {error && <ErrorBox text={error} />}
      {!settings && !error && <p className="text-[11px] text-slate-400">Ładowanie…</p>}

      {settings && voiceDraft && (
        <VoiceSettingsCard
          settings={settings} voice={voiceDraft.voice} rate={voiceDraft.rate}
          onChange={(voice, rate) => setVoiceDraft({ voice, rate })}
          onSaved={saved => { setSettings(saved); setVoiceDraft({ voice: saved.voice, rate: saved.rate }); }}
        />
      )}

      {settings && messages && voiceDraft && (
        <>
          {messages.length === 0 && <p className="text-[11px] text-slate-400">Nie masz jeszcze komunikatów. Dodaj pierwszy poniżej.</p>}
          <ul className="space-y-3">
            {messages.map(m => (
              <MessageCard
                key={m.id} message={m} settings={settings} previewVoice={voiceDraft.voice} previewRate={voiceDraft.rate}
                onChanged={updated => setMessages(list => (list || []).map(x => (x.id === updated.id ? updated : x)))}
                onDeleted={id => setMessages(list => (list || []).filter(x => x.id !== id))}
              />
            ))}
          </ul>

          {adding ? (
            <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 space-y-3">
              <h3 className="text-xs font-bold text-white">Nowy komunikat</h3>
              <input className={field} placeholder="Tytuł (np. Odmowa - ubezpieczenia)" maxLength={80} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
              <select className={field} value={draft.situation} onChange={e => setDraft({ ...draft, situation: e.target.value })}>
                {settings.situations.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <textarea className={`${field} min-h-[88px]`} placeholder="Treść czytana głosem syntezatora" maxLength={1000} value={draft.text} onChange={e => setDraft({ ...draft, text: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setAdding(false)} className="py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-white">Anuluj</button>
                <button onClick={create} disabled={addBusy || !draft.title.trim() || !draft.text.trim()} className="py-2.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-black disabled:opacity-40">
                  {addBusy ? 'Dodawanie…' : 'Dodaj'}
                </button>
              </div>
            </section>
          ) : (
            <button onClick={() => setAdding(true)} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-slate-700 text-xs font-bold text-cyan-200">
              <Plus className="w-4 h-4" /> Dodaj komunikat
            </button>
          )}
        </>
      )}
      <p className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px text-slate-600" />
        W nakładce pokazujemy do 4 aktywnych komunikatów. Wyłącz te, których nie używasz.
      </p>
    </div>
  );
}
