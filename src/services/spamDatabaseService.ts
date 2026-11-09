// ============================================================================
// TelePakt - Lokalna lista zgłoszonych numerów (zgłoszenia użytkownika)
// Baza startowa jest PUSTA. Brak wpisu NIE oznacza, że numer jest bezpieczny.
// Docelowo: współdzielona baza zgłoszeń społeczności (backend) + zakresy numeracji UKE.
// Zero-Storage: sprawdzany numer nie jest wysyłany na serwer.
// ============================================================================

export interface SpamRecord {
  number: string;
  normalizedNumber: string;
  name: string;
  tellowsScore: number; // 1 (bezpieczny) do 9 (niebezpieczny spam)
  riskLevel: 'safe' | 'suspicious' | 'dangerous' | 'critical';
  category: 'Fotowoltaika' | 'Spoofing Bankowy' | 'Windykacja' | 'Pokazy Handlowe' | 'Giełda i Krypto' | 'Premium Rate UKE' | 'Telekomunikacja' | 'Inne';
  reportsCount: number;
  lastReported: string;
  delictDescription: string;
  legalBasis: string;
  isUkePremium?: boolean;
  costEstimatePerMin?: string;
  isUserReported?: boolean;
}

export interface LookupResult {
  isValid: boolean;
  validationError?: string;
  found: boolean;
  record: SpamRecord;
  source: 'tellows_scorelist' | 'uke_register' | 'telepakt_community' | 'verified_safe';
  responseTimeMs: number;
  costPLN: number; // 0.00 PLN dzięki lokalnej bazie offline
}

export interface DatabaseStats {
  totalNumbers: number;
  tellowsScorelistEntries: number;
  ukePremiumEntries: number;
  telepaktCommunityReports: number;
  lastSyncDate: string;
  cacheStatus: 'cached_offline' | 'needs_sync' | 'syncing';
  savedVsTwilioLookupPLN: number;
}

// Baza startowa jest pusta: wpisy pochodzą wyłącznie ze zgłoszeń użytkownika (zapisanych lokalnie).
// Nie wolno tu wstawiać przykładowych numerów ani liczby zgłoszeń - to byłyby dane nieprawdziwe.
const INITIAL_POLISH_SPAM_DATABASE: SpamRecord[] = [];

class SpamDatabaseService {
  private db: Map<string, SpamRecord> = new Map();
  private userReports: SpamRecord[] = [];
  private lastSync: string = '-';
  private totalChecksPerformed: number = 0;

  constructor() {
    this.initDatabase();
  }

  private normalize(num: string): string {
    return num.replace(/[^0-9]/g, '');
  }

  private initDatabase() {
    // Ładowanie bazy początkowej Tellows Scorelist + UKE
    INITIAL_POLISH_SPAM_DATABASE.forEach(record => {
      this.db.set(record.normalizedNumber, record);
      // Dodaj wariant bez kierunkowego 48
      if (record.normalizedNumber.startsWith('48') && record.normalizedNumber.length > 9) {
        this.db.set(record.normalizedNumber.substring(2), record);
      }
    });

    // Sprawdź czy użytkownik ma zapisane lokalne zgłoszenia
    try {
      const stored = localStorage.getItem('telepakt_user_spam_reports');
      if (stored) {
        const parsed: SpamRecord[] = JSON.parse(stored);
        this.userReports = parsed;
        parsed.forEach(r => this.db.set(r.normalizedNumber, r));
      }
    } catch {
      // Ignoruj błędy storage
    }
  }

  /**
   * Sprawdza numer w lokalnej bazie offline (0 ms, 0 PLN)
   */
  public lookupNumber(query: string): LookupResult {
    const startTime = performance.now();
    const clean = this.normalize(query);
    this.totalChecksPerformed++;

    // Walidacja formatu numeru (odrzucenie ciągów niebędących numerami, np. "abc" lub zbyt krótkich)
    if (clean.length < 7) {
      return {
        isValid: false,
        validationError: 'Wprowadź prawidłowy numer telefonu (minimum 7 cyfr, np. 22 123 45 67 lub 500 123 456).',
        found: false,
        record: {
          number: query,
          normalizedNumber: clean,
          name: 'Nieprawidłowy format numeru',
          tellowsScore: 1,
          riskLevel: 'safe',
          category: 'Inne',
          reportsCount: 0,
          lastReported: '-',
          delictDescription: 'Wprowadzony ciąg nie jest prawidłowym numerem telefonu. Podaj numer stacjonarny, komórkowy lub infolinii.',
          legalBasis: 'Art. 398 PKE'
        },
        source: 'verified_safe',
        responseTimeMs: 0.1,
        costPLN: 0.00
      };
    }

    // 1. Sprawdzenie dokładnego dopasowania w bazie Tellows/UKE
    const foundRecord = this.db.get(clean) || 
      (clean.startsWith('48') ? this.db.get(clean.substring(2)) : this.db.get(`48${clean}`));

    if (foundRecord) {
      const endTime = performance.now();
      return {
        isValid: true,
        found: true,
        record: foundRecord,
        source: foundRecord.isUkePremium ? 'uke_register' : (foundRecord.isUserReported ? 'telepakt_community' : 'tellows_scorelist'),
        responseTimeMs: Math.round((endTime - startTime) * 10) / 10 || 0.4,
        costPLN: 0.00,
      };
    }

    // 2. Sprawdzenie prefiksu UKE Premium (70x, 71x, 72x, 73x, 74x, 79x, 80x)
    const localNine = clean.startsWith('48') ? clean.substring(2) : clean;
    if (localNine.length >= 3) {
      const prefix = localNine.substring(0, 3);
      if (['700', '701', '703', '704', '707', '708', '709'].includes(prefix)) {
        const ukeRecord: SpamRecord = {
          number: query,
          normalizedNumber: clean,
          name: `Zakres numeracji ${prefix}xx (usługi o podwyższonej opłacie)`,
          tellowsScore: 5,
          riskLevel: 'suspicious',
          category: 'Premium Rate UKE',
          reportsCount: 0,
          lastReported: '-',
          delictDescription: `Numery z zakresu ${prefix}xx są zwykle numerami usług o podwyższonej opłacie. Przed oddzwonieniem sprawdź cennik u swojego operatora.`,
          legalBasis: 'Plan numeracji krajowej',
          isUkePremium: true
        };
        return {
          isValid: true,
          found: true,
          record: ukeRecord,
          source: 'uke_register',
          responseTimeMs: 0.5,
          costPLN: 0.00,
        };
      }
    }

    // 3. Rzetelna odpowiedź: numer nie figuruje w czarnej liście Tellows ani rejestrze UKE
    const safeRecord: SpamRecord = {
      number: query,
      normalizedNumber: clean,
      name: 'Brak zgłoszeń w bazie TelePakt',
      tellowsScore: 1,
      riskLevel: 'safe',
      category: 'Inne',
      reportsCount: 0,
      lastReported: 'Brak zgłoszeń',
      delictDescription: 'Ten numer nie ma jeszcze zgłoszeń w bazie TelePakt. To nie oznacza, że jest bezpieczny — nasza baza dopiero powstaje.',
      legalBasis: 'Art. 398 ust. 1 PKE, art. 21 RODO',
    };

    return {
      isValid: true,
      found: false,
      record: safeRecord,
      source: 'verified_safe',
      responseTimeMs: Math.round((performance.now() - startTime) * 10) / 10 || 0.3,
      costPLN: 0.00,
    };
  }

  /**
   * Zgłaszanie numeru przez społeczność TelePakt z formułą art. 398 PKE
   */
  public reportNumber(record: Omit<SpamRecord, 'normalizedNumber' | 'isUserReported'>): SpamRecord {
    const clean = this.normalize(record.number);
    const newRecord: SpamRecord = {
      ...record,
      normalizedNumber: clean,
      isUserReported: true,
    };

    this.db.set(clean, newRecord);
    this.userReports.push(newRecord);

    try {
      localStorage.setItem('telepakt_user_spam_reports', JSON.stringify(this.userReports));
    } catch {
      // ignore
    }

    return newRecord;
  }

  /**
   * Pobranie statystyk bazy i oszczędności vs płatne API Twilio Lookup
   */
  public getDatabaseStats(): DatabaseStats {
    // Koszt Twilio Lookup to $0.015 do $0.03 za zapytanie (~0.08 - 0.12 PLN)
    const savedVsTwilio = 0;

    return {
      totalNumbers: this.db.size,
      tellowsScorelistEntries: 0,
      ukePremiumEntries: 0,
      telepaktCommunityReports: this.userReports.length,
      lastSyncDate: this.lastSync,
      cacheStatus: 'cached_offline',
      savedVsTwilioLookupPLN: savedVsTwilio,
    };
  }

}

export const spamDatabaseService = new SpamDatabaseService();
