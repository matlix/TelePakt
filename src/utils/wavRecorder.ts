/**
 * Nagrywanie własnego głosu z mikrofonu do pliku WAV (mono, 16-bit PCM, 8 kHz).
 *
 * Przeglądarka nagrywa w webm/opus, a dostawcy telefonii odtwarzają tylko WAV/MP3 - dlatego po nagraniu
 * dekodujemy dźwięk, zmniejszamy próbkowanie do 8 kHz (jak w linii telefonicznej) i składamy WAV.
 * 8 kHz mono to ok. 16 KB na sekundę, więc 60 s mieści się w limicie 2 MB.
 */

export const MAX_RECORD_SECONDS = 55;
const TARGET_RATE = 8000;

export interface RecordedWav {
  blob: Blob;
  seconds: number;
}

/** Czytelny komunikat zamiast surowego błędu przeglądarki. */
export function microphoneErrorMessage(err: any): string {
  const name = err?.name as string | undefined;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Brak dostępu do mikrofonu. Zezwól w ustawieniach telefonu: Aplikacje > TelePakt > Uprawnienia > Mikrofon.';
  }
  if (name === 'NotFoundError') return 'Nie znaleziono mikrofonu w tym urządzeniu.';
  if (name === 'NotReadableError') return 'Mikrofon jest zajęty przez inną aplikację (np. trwa rozmowa).';
  return `Nie udało się nagrać głosu: ${err?.message || name || 'nieznany błąd'}`;
}

function encodeWav(samples: Float32Array, rate: number): Blob {
  // Lekkie wyrównanie głośności: cicho nagrany mikrofon byłby słabo słyszalny w słuchawce rozmówcy.
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const gain = peak > 0.001 ? Math.min(0.9 / peak, 8) : 1;

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);       // rozmiar bloku fmt
  view.setUint16(20, 1, true);        // PCM
  view.setUint16(22, 1, true);        // mono
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true); // bajtów na sekundę
  view.setUint16(32, 2, true);        // blok
  view.setUint16(34, 16, true);       // bity
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i] * gain));
    view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** Zamienia nagranie z przeglądarki (webm/opus/mp4) na WAV 8 kHz mono. */
export async function toPhoneWav(recording: Blob): Promise<RecordedWav> {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(await recording.arrayBuffer());
    const length = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE));
    const offline = new OfflineAudioContext(1, length, TARGET_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    return { blob: encodeWav(rendered.getChannelData(0), TARGET_RATE), seconds: decoded.duration };
  } finally {
    ctx.close().catch(() => {});
  }
}

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('Ta przeglądarka nie obsługuje nagrywania z mikrofonu.');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } });
    this.chunks = [];
    this.recorder = new MediaRecorder(this.stream);
    this.recorder.ondataavailable = e => { if (e.data.size) this.chunks.push(e.data); };
    this.recorder.start();
  }

  async stop(): Promise<RecordedWav> {
    const recorder = this.recorder;
    if (!recorder) throw new Error('Nagrywanie nie zostało rozpoczęte.');
    await new Promise<void>(resolve => { recorder.onstop = () => resolve(); recorder.stop(); });
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.recorder = null;
    return toPhoneWav(new Blob(this.chunks, { type: this.chunks[0]?.type || 'audio/webm' }));
  }

  /** Przerywa bez zapisu (np. przy zamknięciu ekranu). */
  cancel(): void {
    try { this.recorder?.stop(); } catch { /* już zatrzymany */ }
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
    this.recorder = null;
  }
}
