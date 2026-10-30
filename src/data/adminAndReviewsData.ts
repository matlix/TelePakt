import { CustomerReview, IntegrationCredential, UserCredentialItem } from '../types';

export const INITIAL_CUSTOMER_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    authorName: 'Marek z Poznania',
    rating: 5,
    title: 'Fotowoltaika przestała dzwonić po pierwszym użyciu suwaka!',
    content: 'Dzwonili do mnie 3 razy dziennie z różnych numerów na 22 i 42. Za pierwszym razem przesunąłem suwak TelePakt z formułą art. 398 PKE. Telemarketer w panice rozłączył się po 8 sekundach. Od tygodnia absolutna cisza!',
    createdAt: '2026-10-24 14:22',
    isApproved: true,
    isFeatured: true,
    verifiedSubscriber: true,
    deviceType: 'Android',
    spamTypeBlocked: 'Fotowoltaika & Pompy Ciepła',
    adminReply: 'Dziękujemy Panie Marku! Cieszymy się, że art. 398 PKE zadziałał z pełną mocą.'
  },
  {
    id: 'rev-2',
    authorName: 'Karolina W. (Radca Prawny)',
    rating: 5,
    title: 'Rewelacyjna sprawa od strony dowodowej dla UKE',
    content: 'Jako prawnik doceniam wyliczenie sumy kontrolnej SHA-256 dla nagrania audio. Złożyłam zawiadomienie do Prezesa UKE o naruszenie art. 398 PKE wraz z wygenerowanym pismem z TelePakt. Sprawa jest już prowadzona przez Departament Kontroli UKE.',
    createdAt: '2026-10-26 09:15',
    isApproved: true,
    isFeatured: true,
    verifiedSubscriber: true,
    deviceType: 'iPhone',
    spamTypeBlocked: 'Wycena Kredytów & Pożyczki',
  },
  {
    id: 'rev-3',
    authorName: 'Tomasz S. - Właściciel agencji B2B',
    rating: 5,
    title: 'Tryb ustaleń ustnych B2B uratował mi 12 000 zł',
    content: 'Używam TelePakt nie tylko na spamerów, ale przede wszystkim przy ustnych ustaleniach z podwykonawcami. Formuła powiadamiająca o rejestracji ustaleń handlowych sprawiła, że wykonawca dotrzymał pierwotnej wyceny bez żadnych dyskusji.',
    createdAt: '2026-10-27 18:40',
    isApproved: true,
    isFeatured: true,
    verifiedSubscriber: true,
    deviceType: 'Android',
    spamTypeBlocked: 'Ustalenia B2B',
    adminReply: 'Świetny use-case! Dlatego wdrożyliśmy opcję auto-hangup = False, aby rozmowa mogła trwać dalej po oświadczeniu.'
  },
  {
    id: 'rev-4',
    authorName: 'Piotr K.',
    rating: 4,
    title: 'Działa bez zarzutu na iOS 18 (iPhone 15 Pro)',
    content: 'Początkowo bałem się jak zadziała telekonferencja na iPhone, ale przycisk Połącz Rozmowy na ekranie Apple działa błyskawicznie. Super, że nagranie można od razu przenieść na Google Drive i skasować z serwera.',
    createdAt: '2026-10-28 11:05',
    isApproved: true,
    isFeatured: false,
    verifiedSubscriber: true,
    deviceType: 'iPhone',
    spamTypeBlocked: 'Inwestycje krypto / Oszuści',
  },
  {
    id: 'rev-5',
    authorName: 'Anonimowy Użytkownik',
    rating: 5,
    title: 'Czy możecie dodać jeszcze mocniejszą formułę na naciągaczy medycznych?',
    content: 'Moi starsi rodzice byli ciągle nękani zaproszeniami na pokazy garnków i mat magnetycznych. Zainstalowałem im aplikację. Proponuję dodać do formularza UKE bezpośrednie powiadomienie do UOKiK.',
    createdAt: '2026-10-29 16:30',
    isApproved: false, // oczekuje na moderację w panelu admina
    isFeatured: false,
    verifiedSubscriber: false,
    deviceType: 'Android',
    spamTypeBlocked: 'Pokazy medyczne i garnki',
  }
];

export const INITIAL_INTEGRATION_CREDENTIALS: IntegrationCredential[] = [
  {
    id: 'cred-twilio-sid',
    category: 'twilio',
    name: 'Twilio Account SID',
    key: 'TWILIO_ACCOUNT_SID',
    valueMasked: 'AC78b9••••••••••••••••••••••••34ef',
    status: 'active',
    lastTested: 'Dzisiaj, 21:10 (Ping: 18ms)',
    description: 'Identyfikator konta Twilio odpowiedzialnego za polskie linie SIP i węzły telekonferencji.',
    instructions: 'Kopiuj z Twilio Console -> Account Info -> Account SID. Wymagany polski numer stacjonarny (+48 22...) lub komórkowy.'
  },
  {
    id: 'cred-twilio-token',
    category: 'twilio',
    name: 'Twilio Auth Token',
    key: 'TWILIO_AUTH_TOKEN',
    valueMasked: '9a8d••••••••••••••••••••••••21c4',
    status: 'active',
    lastTested: 'Dzisiaj, 21:10 (Autoryzacja OK)',
    description: 'Klucz prywatny autoryzacji webhooków TwiML i weryfikacji podpisu X-Twilio-Signature.',
    instructions: 'Trzymaj w sekrecie. W panelu Render dodaj jako zmienną środowiskową TWILIO_AUTH_TOKEN.'
  },
  {
    id: 'cred-gplay-sa',
    category: 'google_play',
    name: 'Google Play Developer Service Account (JSON)',
    key: 'GOOGLE_PLAY_SERVICE_ACCOUNT_KEY',
    valueMasked: '{"type": "service_account", "project_id": "telepakt-pl-prod", "client_email": "play-billing@telepakt...}',
    status: 'active',
    lastTested: 'Wczoraj, 14:00 (Połączono z Google Play Developer API)',
    description: 'Klucz do weryfikacji subskrypcji in-app purchase oraz powiadomień Real-Time Developer Notifications (RTDN).',
    instructions: 'Google Play Console -> API Access -> Create Service Account -> Uprawnienia do zarządzania zamówieniami i subskrypcjami.'
  },
  {
    id: 'cred-apple-asc',
    category: 'apple_store',
    name: 'Apple App Store Connect API Key (p8)',
    key: 'APPLE_STOREKIT_KEY_P8',
    valueMasked: 'AuthKey_9X2K7••••••••.p8 (Key ID: 9X2K7LM432, Issuer ID: 69a6••••-••••-••••-••••)',
    status: 'active',
    lastTested: 'Dzisiaj, 18:45 (StoreKit 2 Server API zweryfikowane)',
    description: 'Klucz do weryfikacji paragonów subskrypcyjnych StoreKit 2 i powiadomień App Store Server Notifications v2.',
    instructions: 'App Store Connect -> Users and Access -> Integrations -> In-App Purchase -> Generate Private Key.'
  },
  {
    id: 'cred-s3-r2',
    category: 'cloud_storage',
    name: 'Cloudflare R2 / AWS S3 Zero-Storage Retention Bucket',
    key: 'AWS_S3_EVIDENCE_BUCKET',
    valueMasked: 'telepakt-evidence-vault-eu (Endpoint: eu-frankfurt.r2.cloudflarestorage.com)',
    status: 'active',
    lastTested: 'Dzisiaj, 20:00 (Szyfrowanie AES-256 aktywne)',
    description: 'Zaszyfrowany magazyn tymczasowy dla nagrań i sum SHA-256 z automatyczną regułą cyklu życia (auto-delete po 30 dniach).',
    instructions: 'Reguła Object Lifecycle Rule ustawiona na 30 dni zgodnie z RODO i polityką Zero-Storage.'
  }
];

export const INITIAL_USER_ACCOUNTS: UserCredentialItem[] = [
  {
    id: 'usr-101',
    email: 'jan.kowalski@gmail.com',
    phone: '+48 601 234 567',
    plan: 'Roczny Tarcza (179 zł)',
    status: 'active',
    joinedDate: '2026-09-15',
    quotaMinutesUsed: 14,
    totalMinutes: 120,
    provider: 'Google Play IAP'
  },
  {
    id: 'usr-102',
    email: 'anna.nowak@icloud.com',
    phone: '+48 502 987 654',
    plan: 'Miesięczny (19,99 zł)',
    status: 'active',
    joinedDate: '2026-10-01',
    quotaMinutesUsed: 28,
    totalMinutes: 60,
    provider: 'Apple App Store'
  },
  {
    id: 'usr-103',
    email: 'kancelaria.legal@wp.pl',
    phone: '+48 22 890 12 34',
    plan: 'B2B Firma (499 zł)',
    status: 'active',
    joinedDate: '2026-08-10',
    quotaMinutesUsed: 89,
    totalMinutes: 500,
    provider: 'Web Direct (telepakt.pl)'
  },
  {
    id: 'usr-104',
    email: 'marek.tester@interia.pl',
    phone: '+48 791 112 233',
    plan: 'Darmowy (3 dni)',
    status: 'active',
    joinedDate: '2026-10-28',
    quotaMinutesUsed: 3,
    totalMinutes: 10,
    provider: 'Google Play IAP'
  }
];
