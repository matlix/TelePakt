/**
 * Syntezator mowy TelePakt (Web Speech API) - brzmi szybciej i bardziej naturalnie niż
 * domyślne `speechSynthesis`:
 *
 *  1. wybiera NAJLEPSZY dostępny głos dla języka (neuronowe/"Natural"/Google/online
 *     przed lokalnymi robotycznymi),
 *  2. rozwija skróty i symbole, które silniki czytają literowo ("art." -> "artykuł"),
 *  3. dzieli tekst na zdania i człony - między nimi robi krótkie, ludzkie pauzy
 *     i lekko zmienia tempo/wysokość, zamiast czytać jednym monotonnym ciągiem,
 *  4. domyślne tempo jest szybsze (x1.12), a `options.rate` działa jako mnożnik.
 */

/** Domyślne przyspieszenie względem tempa silnika (1.0 brzmi ospale). */
const BASE_RATE = 1.12;

/** Słowa w nazwie głosu wskazujące na lepszą (neuronową/online) jakość. */
const QUALITY_HINTS = ['natural', 'neural', 'online', 'google', 'wavenet', 'enhanced', 'premium'];
/** Znane, dobrze brzmiące polskie głosy. */
const PREFERRED_PL_NAMES = ['zofia', 'agnieszka', 'marek', 'paulina', 'ewa', 'jacek', 'zosia'];

/** Rozwija skróty tak, by silnik TTS wymawiał je po ludzku. */
export function prepareSpeechText(text: string): string {
  return text
    .replace(/\bart\.\s*(?=\d)/gi, 'artykuł ')
    .replace(/\bust\.\s*(?=\d)/gi, 'ustęp ')
    .replace(/\bpkt\.?\s*(?=\d)/gi, 'punkt ')
    .replace(/\bnr\.?\s*(?=\d)/gi, 'numer ')
    .replace(/\bPKE\b/g, 'Prawa komunikacji elektronicznej')
    .replace(/\bRODO\b/g, 'rodo')
    .replace(/\bUKE\b/g, 'U K E')
    .replace(/\bUODO\b/g, 'U O D O')
    .replace(/\bNIP\b/g, 'N I P')
    .replace(/\bSMS\b/g, 'es em es')
    .replace(/\b(\d[\d\s]*)\s*zł\b/g, '$1 złotych')
    .replace(/\s*[–—]\s*/g, ', ')
    .replace(/[()]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Dzieli tekst na zdania, a zbyt długie zdania na człony (po przecinku/średniku). */
export function splitIntoChunks(text: string, maxLen = 120): string[] {
  const sentences = text.match(/[^.!?…]+[.!?…]*/g) ?? [text];
  const chunks: string[] = [];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (!sentence) continue;
    if (sentence.length <= maxLen) {
      chunks.push(sentence);
      continue;
    }
    let current = '';
    for (const part of sentence.split(/(?<=[,;:])\s+/)) {
      if (current && (current + ' ' + part).length > maxLen) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? `${current} ${part}` : part;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks;
}

/** Wybiera najlepszy głos dla danego języka (np. `pl-PL`). */
export function pickBestVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  preferredName?: string
): SpeechSynthesisVoice | null {
  const prefix = lang.slice(0, 2).toLowerCase();
  const candidates = voices.filter(v => v.lang.toLowerCase().replace('_', '-').startsWith(prefix));
  if (candidates.length === 0) return null;

  if (preferredName) {
    const wanted = candidates.find(v => v.name === preferredName);
    if (wanted) return wanted;
  }

  const score = (v: SpeechSynthesisVoice): number => {
    const name = v.name.toLowerCase();
    let s = 0;
    if (v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase()) s += 2;
    if (QUALITY_HINTS.some(h => name.includes(h))) s += 10;
    if (PREFERRED_PL_NAMES.some(n => name.includes(n))) s += 3;
    if (!v.localService) s += 2; // głosy sieciowe są zwykle neuronowe
    return s;
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0];
}

/** Czeka, aż przeglądarka załaduje listę głosów (Chrome ładuje ją asynchronicznie). */
function loadVoices(synth: SpeechSynthesis): Promise<SpeechSynthesisVoice[]> {
  const now = synth.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise(resolve => {
    const done = () => resolve(synth.getVoices());
    synth.addEventListener('voiceschanged', done, { once: true });
    setTimeout(done, 800);
  });
}

export class PolishVoiceSynthesizer {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  /** Zwiększane przy każdym speak()/stop(), by przerwać starsze kolejki zdań. */
  private static session = 0;
  private static speaking = false;

  public static isSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Odczytuje tekst naturalnym, szybszym głosem.
   * @param options.rate    mnożnik tempa (1 = domyślne naturalne, 1.2 = szybciej)
   * @param options.pitch   wysokość głosu (1 = bez zmian)
   * @param options.lang    język (domyślnie `pl-PL`)
   * @param options.voiceName wymuszona nazwa głosu z `speechSynthesis.getVoices()`
   */
  public static speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      lang?: string;
      voiceName?: string;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    } = {}
  ): void {
    const synth = this.synth;
    if (!synth) {
      options.onError?.(new Error('Web Speech API niedostępne'));
      return;
    }

    this.stop();
    const session = this.session;
    const lang = options.lang ?? 'pl-PL';
    const isPolish = lang.toLowerCase().startsWith('pl');
    const chunks = splitIntoChunks(isPolish ? prepareSpeechText(text) : text);
    if (chunks.length === 0) {
      options.onEnd?.();
      return;
    }

    const baseRate = Math.min(Math.max((options.rate ?? 1) * BASE_RATE, 0.6), 1.8);
    const basePitch = options.pitch ?? 1;

    loadVoices(synth).then(voices => {
      if (session !== this.session) return; // w międzyczasie wywołano stop()/speak()
      const voice = pickBestVoice(voices, lang, options.voiceName);
      this.speaking = true;

      const speakChunk = (i: number) => {
        if (session !== this.session) return;
        if (i >= chunks.length) {
          this.speaking = false;
          options.onEnd?.();
          return;
        }
        const chunk = chunks[i];
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = lang;
        if (voice) utterance.voice = voice;

        // Naturalna zmienność: pytania wyżej, ostatnie zdanie wolniej, drobny jitter.
        const jitter = 1 + (Math.random() - 0.5) * 0.06;
        utterance.rate = Math.min(Math.max(baseRate * jitter * (i === chunks.length - 1 ? 0.96 : 1), 0.6), 1.8);
        utterance.pitch = Math.min(Math.max(basePitch * (chunk.endsWith('?') ? 1.08 : 1) * (1 + (Math.random() - 0.5) * 0.04), 0.5), 1.6);

        if (i === 0) utterance.onstart = () => options.onStart?.();
        utterance.onend = () => {
          // Krótka pauza oddechowa: dłuższa po kropce, krótsza po przecinku.
          const pause = /[.!?…]$/.test(chunk) ? 180 : 90;
          setTimeout(() => speakChunk(i + 1), pause);
        };
        utterance.onerror = e => {
          if (session !== this.session) return;
          // 'interrupted'/'canceled' to zwykły stop() użytkownika, nie błąd.
          const code = (e as SpeechSynthesisErrorEvent).error;
          if (code === 'interrupted' || code === 'canceled') return;
          this.speaking = false;
          options.onError?.(e);
        };
        synth.speak(utterance);
      };
      speakChunk(0);
    });
  }

  public static stop(): void {
    this.session++;
    this.speaking = false;
    this.synth?.cancel();
  }

  public static isSpeaking(): boolean {
    return this.speaking || (this.synth?.speaking ?? false);
  }
}
