/**
 * Syntezator dzwonka telefonicznego i sygnałów centrali (Web Audio API)
 * Działa bez konieczności pobierania zewnętrznych plików MP3.
 */

class RingtoneAudioService {
  private ctx: AudioContext | null = null;
  private isRinging: boolean = false;
  private ringInterval: number | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private activeGainNodes: GainNode[] = [];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Odtwarza realistyczny dzwonek telefoniczny z przerwami (cadence: 1.5s dzwonek, 2s cisza)
   * oraz uruchamia wibrację na telefonach z Androidem.
   */
  public startRinging(): void {
    if (this.isRinging) return;
    this.isRinging = true;

    // Trigger vibration on Android
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([700, 300, 700, 300, 1500]);
      } catch (e) {}
    }

    const ringPulse = () => {
      if (!this.isRinging) return;
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const duration = 1.6;

      // Realistic dual-frequency phone ring (440Hz & 480Hz with warble)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now);

      // Amplitude modulation for realistic phone bell ring
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);

      this.activeOscillators.push(osc1, osc2);
      this.activeGainNodes.push(gain);

      // Re-trigger vibration during pulse
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([700, 300, 700]);
        } catch (e) {}
      }
    };

    // First pulse immediately
    ringPulse();

    // Subsequent pulses every 3.5 seconds
    this.ringInterval = window.setInterval(() => {
      if (this.isRinging) {
        ringPulse();
      }
    }, 3600);
  }

  public stopRinging(): void {
    this.isRinging = false;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }

    this.activeOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) {}
    });
    this.activeOscillators = [];
    this.activeGainNodes = [];

    // Stop vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  /**
   * Krótki sygnał dźwiękowy rozłączenia (tzw. sygnał zajętości po zakończeniu rozmowy)
   */
  public playBusyTone(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const start = now + i * 0.4;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(425, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.setValueAtTime(0.2, start + 0.18);
      gain.gain.linearRampToValueAtTime(0.001, start + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.2);
    }
  }

  /**
   * Nowoczesny dźwięk potwierdzenia aktywacji Tarczy TelePakt
   */
  public playShieldActivate(): void {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const RingtoneService = new RingtoneAudioService();
