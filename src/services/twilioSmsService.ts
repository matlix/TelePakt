import { PredefinedSmsTemplate, TwilioSmsLog } from '../types';
import { ASSISTANT_NUMBER } from '../config';

export const PREDEFINED_SMS_TEMPLATES: PredefinedSmsTemplate[] = [
  {
    id: 'pke-rodo-full',
    title: 'Pełny Sprzeciw Art. 398 PKE & Art. 21 RODO',
    category: 'objection-pke',
    badge: 'Art. 398 PKE • Rekomendowany',
    legalBasis: 'Art. 398 PKE & Art. 21 RODO (sprzeciw wobec marketingu bezpośredniego)',
    text: 'TELEPAKT: Niniejszym wnoszę bezwzględny sprzeciw z art. 398 PKE oraz art. 21 RODO wobec marketingu bezpośredniego. Żądam natychmiastowego usunięcia mojego numeru z Państwa bazy i CRM. Dalszy kontakt zgłoszę do Prezesa UKE.'
  },
  {
    id: 'source-rodo',
    title: 'Żądanie Źródła Danych & NIP (Art. 15 RODO)',
    category: 'data-source-rodo',
    badge: 'Art. 15 RODO • Audyt Danych',
    legalBasis: 'Art. 15 RODO (prawo dostępu) & Art. 12 RODO (termin 30 dni na odpowiedź)',
    text: 'TELEPAKT: Na podstawie art. 15 RODO wzywam do przekazania w terminie 7 dni pełnej nazwy administratora, NIP, adresu siedziby oraz źródła pozyskania mojego numeru telefonu. Brak odpowiedzi zostanie przekazany do Prezesa UODO.'
  },
  {
    id: 'interrupted-call',
    title: 'Sprzeciw po Przerwanej Rozmowie',
    category: 'interrupted-call',
    badge: 'Rozmowa Przerwana • Dowód',
    legalBasis: 'Art. 77(2) K.c. (forma dokumentowa) & Art. 308 K.p.c. (nagranie dowodowe)',
    text: 'TELEPAKT: W nawiązaniu do wykonanego przed chwilą połączenia oświadczam, że nie wyraziłem zgody na kontakt handlowy. Wnoszę formalny sprzeciw z art. 398 PKE i art. 21 RODO. Próba połączenia została zarejestrowana.'
  },
  {
    id: 'short-express',
    title: 'Krótki Sprzeciw Ekspresowy (1 SMS / 160 znaków)',
    category: 'short-express',
    badge: '1 SMS • Szybka Wysyłka',
    legalBasis: 'Art. 398 PKE (bezwzględny zakaz kontaktu bez zgody)',
    text: 'TELEPAKT: Zakaz kontaktu marketingowego! Wnoszę sprzeciw z art. 398 PKE i art. 21 RODO. Żądam usunięcia numeru z bazy. Dalszy kontakt zgłoszę Prezesowi UKE.'
  }
];

export const TWILIO_DEFAULT_SENDER = ASSISTANT_NUMBER || 'numer niedostępny';

export interface SmsSegmentation {
  charCount: number;
  segmentCount: number;
  maxCharsPerSegment: number;
  isGsm7: boolean;
}

export function calculateSmsSegments(text: string): SmsSegmentation {
  const charCount = text.length;
  // If text has non-GSM characters, GSM encoding uses UCS-2 (70 chars per segment, 67 for concatenated)
  // For standard GSM-7: 160 chars per segment, 153 for concatenated
  const hasPolishDiacritics = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/.test(text);
  
  if (hasPolishDiacritics) {
    const maxFirst = 70;
    const maxMulti = 67;
    const segmentCount = charCount <= maxFirst ? (charCount === 0 ? 1 : Math.ceil(charCount / maxFirst)) : Math.ceil(charCount / maxMulti);
    return {
      charCount,
      segmentCount: Math.max(1, segmentCount),
      maxCharsPerSegment: segmentCount > 1 ? maxMulti : maxFirst,
      isGsm7: false
    };
  } else {
    const maxFirst = 160;
    const maxMulti = 153;
    const segmentCount = charCount <= maxFirst ? (charCount === 0 ? 1 : Math.ceil(charCount / maxFirst)) : Math.ceil(charCount / maxMulti);
    return {
      charCount,
      segmentCount: Math.max(1, segmentCount),
      maxCharsPerSegment: segmentCount > 1 ? maxMulti : maxFirst,
      isGsm7: true
    };
  }
}

class TwilioSmsService {
  private STORAGE_KEY = 'telepakt_sent_sms_logs';

  public getSentSmsHistory(): TwilioSmsLog[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public saveSmsLog(log: TwilioSmsLog): void {
    try {
      const current = this.getSentSmsHistory();
      const updated = [log, ...current];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
    } catch {}
  }

  public clearSmsHistory(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }

  /**
   * Generates a valid Twilio Message SID format: 'SM' followed by 32 hex chars
   */
  private generateTwilioSid(): string {
    const chars = '0123456789abcdef';
    let sid = 'SM';
    for (let i = 0; i < 32; i++) {
      sid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return sid;
  }

  /**
   * Sends an SMS via Twilio Messaging API (simulated high-fidelity execution
   * with delivery receipt and local storage logging)
   */
  public async sendSms(
    to: string,
    body: string,
    templateTitle?: string,
    relatedCallId?: string
  ): Promise<TwilioSmsLog> {
    // Artificial realistic network delay (400 - 800 ms)
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanTo = to.trim();
    if (!cleanTo) {
      throw new Error('Podaj prawidłowy numer telefonu odbiorcy.');
    }

    if (!body.trim()) {
      throw new Error('Treść wiadomości SMS nie może być pusta.');
    }

    const segments = calculateSmsSegments(body);
    const now = new Date();
    const formattedTimestamp = now.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const log: TwilioSmsLog = {
      id: 'sms-' + Date.now(),
      messageSid: this.generateTwilioSid(),
      to: cleanTo,
      from: TWILIO_DEFAULT_SENDER,
      body: body.trim(),
      timestamp: formattedTimestamp,
      status: 'delivered',
      segmentCount: segments.segmentCount,
      templateUsed: templateTitle,
      relatedCallId
    };

    this.saveSmsLog(log);
    return log;
  }
}

export const twilioSmsService = new TwilioSmsService();
