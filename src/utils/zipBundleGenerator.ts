import JSZip from 'jszip';
import { AppNameOption, LegalScript } from '../types';
import { PYTHON_PROJECT_FILES } from '../data/pythonProjectFiles';
import { LEGAL_SCRIPTS } from '../data/legalScripts';

export interface GenerateZipOptions {
  appName: AppNameOption;
  onProgress?: (percent: number, statusText: string) => void;
}

export async function generateFullProjectZip({ appName, onProgress }: GenerateZipOptions): Promise<Blob> {
  const zip = new JSZip();

  const report = (p: number, msg: string) => {
    if (onProgress) onProgress(p, msg);
  };

  report(10, 'Przygotowywanie dokumentacji czatu i genezy pomysłu...');

  // 1. CHAT HISTORY & IDEA CONTEXT
  const chatHistoryContent = `# HISTORIA ROZMOWY, GENEZA POMYSŁU I ANALIZA PROJEKTU TELEPAKT
Data utworzenia: 2024 / 2025
Domena projektu: telepakt.pl
Marka: ${appName.name} - ${appName.tagline}

---

## 1. Zarys problemu i pierwotny pomysł użytkownika
Użytkownik przedstawił potrzebę stworzenia aplikacji na systemy Android oraz iPhone (iOS), która chroniłaby użytkowników przed niechcianymi połączeniami od marketerów, spamerów, teleakwizytorów, fotowoltaiki i naciągaczy.

Główne założenia początkowe:
- Podczas przychodzącego połączenia na ekranie telefonu użytkownika powinien pojawiać się dodatkowy panel suwaków (slider buttons).
- Przesunięcie suwaka odtwarza przygotowany wcześniej, oficjalny komunikat prawny – nagrany głosem użytkownika lub wygenerowany syntetycznie (AI/TTS).
- Komunikat musi zawierać oświadczenie o nagrywaniu rozmowy oraz powołanie na polskie przepisy prawne (RODO, Prawo komunikacji elektronicznej) z żądaniem natychmiastowego usunięcia numeru z bazy pod rygorem sankcji prawnych.
- Aplikacja powinna rejestrować rozmowę i tworzyć certyfikat dowodowy.

---

## 2. Analiza ograniczeń systemowych (iOS vs Android) i rozwiązanie inżynieryjne
Tradycyjna aplikacja mobilna zainstalowana ze sklepu nie jest w stanie bezpośrednio wstrzyknąć dźwięku do aktywnego połączenia komórkowego:
- **iOS (Apple):** Polityka bezpieczeństwa Apple uniemożliwia aplikacjom firm trzecich nakładanie paneli na systemowy ekran połączenia, nagrywanie audio połączenia komórkowego oraz wstrzykiwanie strumienia audio do trwającej rozmowy.
- **Android:** Od wersji Android 10 Google zablokował interfejsy nagrywania rozmów komórkowych. Choć aplikacja może stać się domyślnym programem do obsługi telefonu (Default Dialer), to bezpośrednie miksowanie audio do łącza GSM/VoLTE jest blokowane przez sterowniki modemu telefonu.

**Rozwiązanie: Chmurowa telekonferencja 3-stronna (3-way conference line)**
Wzorem światowych liderów (np. TapeACall, Robokiller):
1. Użytkownik odbiera połączenie od telemarketera.
2. Dotyka suwaka TelePakt – aplikacja nawiązuje połączenie z dedykowanym węzłem SIP w chmurze (np. na Twilio / Plivo).
3. Telefon scala połączenia w telekonferencję (na Androidzie automatycznie przez Dialer, na iPhone jednym kliknięciem "Połącz rozmowy / Merge").
4. Chmurowy bot dołącza do linii, oficjalnym tonem odczytuje formułę prawną sprzeciwu RODO i PKE oraz rejestruje wysokiej jakości ścieżkę dźwiękową (WAV).
5. Telemarketer w panice rozłącza się sam, a użytkownik otrzymuje certyfikat dowodowy z sumą kontrolną SHA-256 dla UKE/UODO.

---

## 3. Nowy stan prawny w Polsce (Ustawa PKE z 12 lipca 2024 r., obowiązuje od 10.11.2024)
- **Art. 398 ust. 1 PKE:** Bezwzględny zakaz marketingu bezpośredniego bez wcześniejszej, wyraźnej zgody abonenta. Nawet telefon z pytaniem „czy mogę przedstawić ofertę” jest już nielegalny!
- **Art. 445 PKE:** Kara administracyjna nakładana przez Prezesa UKE w wysokości do **3% rocznego przychodu** podmiotu lub do **1 000 000 PLN**.
- **Art. 21 i 17 RODO:** Prawo do natychmiastowego sprzeciwu wobec marketingu oraz prawo do trwałego usunięcia danych (bycia zapomnianym).
- **Art. 308 K.p.c. & Wyroki Sądu Najwyższego (II CSK 478/15, I UK 156/15):** Uczestnik rozmowy nagrywający własne połączenie w celu ochrony przed bezprawnym nękaniem NIE popełnia przestępstwa podsłuchu z art. 267 § 3 k.k. i może użyć nagrania jako pełnoprawnego dowodu przed sądem i urzędami.

---

## 4. Zakres funkcjonalny całego systemu
1. Własne odpowiedzi użytkownika i edytor formuł prawnych.
2. Opcja automatycznego rozłączania połączenia po wygłoszeniu formuły (lub pozostania na linii).
3. Personalizacja kolejności odpowiedzi na liście (góra/dół) i wyłączanie zbędnych scenariuszy.
4. Eksport nagrań lokalnie na komputer/telefon (WAV) oraz synchronizacja z Google Drive, Dropbox, OneDrive, Nextcloud, iCloud.
5. Unikalna procedura **Zero-Storage** – automatyczne, bezpowrotne kasowanie nagrań z serwerów chmurowych po ich zapisaniu przez użytkownika.
6. Komplet dokumentacji: Regulamin Serwisu, Polityka Prywatności, Klauzule RODO, Instrukcje dla operatorów (Play, Orange, Plus, T-Mobile).
7. Interaktywne studio animacji i wideo instruktażowych (TikTok 9:16, YouTube 16:9, Feed 1:1) z polskim lektorem i scenariuszami dla twórców.
`;

  zip.file('01_HISTORIA_CZATU_I_GENEZA_POMYSLU.md', chatHistoryContent);

  report(25, 'Generowanie biznesplanu i kalkulacji rynkowej...');

  // 2. BUSINESS PLAN & MARKET ANALYSIS
  const businessPlanContent = `# BIZNESPLAN, ANALIZA RYNKU (TAM/SAM/SOM) I RENTOWNOŚĆ TELEPAKT
Projekt: telepakt.pl
Data: 2024 / 2025

---

## 1. Analiza Rynku w Polsce
- **TAM (Total Addressable Market):** 25-28 milionów użytkowników smartfonów w Polsce. Z badań konsumenckich UKE wynika, że ponad 90% dorosłych Polaków regularnie otrzymuje uciążliwe połączenia marketingowe (fotowoltaika, instalacje medyczne, garnki, pożyczki).
- **SAM (Serviceable Available Market):** 4,5 - 6,0 milionów osób – przedsiębiorcy z jawnym numerem telefonu w CEIDG i KRS, seniorzy nękani oszustwami oraz osoby prywatne aktywnie poszukujące ochrony.
- **SOM (Serviceable Obtainable Market - cel na 24 miesiące):** 80 000 - 120 000 płatnych abonentów (ok. 1,5-2% SAM).
  * Przy cenie 14,99 zł/mies. = **1 200 000 zł - 1 800 000 zł MRR** (miesięcznego powtarzalnego przychodu).

---

## 2. Dlaczego konkurenci zawodzą?
- **Pasywne bazy numerów (Truecaller, Orange):** Nie chronią przed CLI spoofingiem (podstawianiem fałszywych numerów) oraz nie usuwają numeru z CRM telemarketera.
- **TelePakt:** Wymusza wpis w CRM telemarketera "ZAKAZ KONTAKTU / SPRZECIW RODO" pod groźbą kary 1 mln zł od Prezesa UKE. Telemarketer usuwa numer, by nie narażać call center na karę finansową.

---

## 3. Cennik i Unit Economics
- **Pakiet DARMOWY (Freemium):** 3 interwencje miesięcznie, standardowa formuła PKE, lokalny zapis na urządzeniu.
- **Pakiet OBYWATEL PRO (14,99 zł/mies. lub 119 zł/rok):** Nielimitowane interwencje, klonowanie głosu, certyfikaty dowodowe SHA-256 PDF dla UKE, integracja z Google Drive i procedura Zero-Storage.
- **Pakiet BIZNES (39,00 zł/mies.):** Ochrona numerów firmowych, obsługa rozmów windykacyjnych i negocjacyjnych, raporty CSV.

### Kalkulacja rentowności pojedynczego użytkownika (Unit Economics):
- Średni koszt minuty telekonferencji SIP Twilio w Polsce: ~0,05 PLN ($0.012).
- Średni czas rozmowy bota do rozłączenia: 35-45 sekund (1 minuta bilingowa).
- Średnia liczba spamów u użytkownika: 12 połączeń / miesiąc.
- Koszt telekomunikacyjny: 12 * 0,05 zł = **0,60 zł / użytkownika / miesiąc**.
- Przychód PRO: **14,99 zł**.
- **Marża brutto wynosi 96%!**
`;

  zip.file('02_BIZNESPLAN_I_ANALIZA_RYNKOWA.md', businessPlanContent);

  report(40, 'Generowanie wektorowych logotypów i grafik...');

  // 3. GRAPHICS & LOGO ASSETS
  const graphicsFolder = zip.folder('grafiki_i_logotypy');

  // Master Vector SVG Logo
  const masterSvgLogo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="25" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="800" rx="160" fill="url(#bgGrad)" stroke="#1e293b" stroke-width="4"/>

  <!-- Glowing Outer Aura -->
  <circle cx="400" cy="380" r="240" fill="#06b6d4" opacity="0.12" filter="url(#neonGlow)"/>

  <!-- Heraldic Modern Shield Contour -->
  <path d="M 400,140 C 530,140 600,180 600,320 C 600,510 400,640 400,640 C 400,640 200,510 200,320 C 200,180 270,140 400,140 Z"
        fill="url(#shieldGrad)"
        filter="url(#neonGlow)"
        opacity="0.95"/>

  <!-- Inner Dark Core Shield -->
  <path d="M 400,175 C 505,175 560,205 560,325 C 560,480 400,590 400,590 C 400,590 240,480 240,325 C 240,205 295,175 400,175 Z"
        fill="#090d16"
        stroke="#38bdf8"
        stroke-width="6"/>

  <!-- Sound Waves (Telecommunication Representation) -->
  <g fill="none" stroke="#38bdf8" stroke-width="8" stroke-linecap="round">
    <path d="M 330,300 C 315,330 315,390 330,420" opacity="0.5"/>
    <path d="M 300,270 C 275,320 275,400 300,450" opacity="0.3"/>
    <path d="M 470,300 C 485,330 485,390 470,420" opacity="0.5"/>
    <path d="M 500,270 C 525,320 525,400 500,450" opacity="0.3"/>
  </g>

  <!-- Central Legal Scale & Veto Pillar Symbol -->
  <g transform="translate(400, 360)">
    <!-- Scale Beam -->
    <path d="M -90,-20 L 90,-20" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round"/>
    <circle cx="0" cy="-20" r="10" fill="url(#goldGrad)"/>
    <path d="M 0,-20 L 0,80" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round"/>
    <path d="M -40,80 L 40,80" stroke="url(#goldGrad)" stroke-width="8" stroke-linecap="round"/>
    
    <!-- Scale Pans -->
    <path d="M -90,-20 L -120,30 L -60,30 Z" fill="none" stroke="#fef08a" stroke-width="5" stroke-linejoin="round"/>
    <path d="M 90,-20 L 60,30 L 120,30 Z" fill="none" stroke="#fef08a" stroke-width="5" stroke-linejoin="round"/>
  </g>

  <!-- Brand Typography -->
  <text x="400" y="720" font-family="'Inter', system-ui, sans-serif" font-weight="900" font-size="52" fill="#ffffff" text-anchor="middle" letter-spacing="4">
    TELE<tspan fill="#38bdf8">PAKT</tspan><tspan fill="#94a3b8" font-size="34">.PL</tspan>
  </text>
  <text x="400" y="755" font-family="'Inter', system-ui, sans-serif" font-weight="600" font-size="18" fill="#94a3b8" text-anchor="middle" letter-spacing="2">
    TARCZA PRAWNA PRZED TELEMARKETINGIEM
  </text>
</svg>`;

  graphicsFolder?.file('telepakt_logo_vector_master.svg', masterSvgLogo);

  // App Icon 512x512
  const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="shield" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <path d="M 256,70 C 350,70 400,100 400,210 C 400,350 256,440 256,440 C 256,440 112,350 112,210 C 112,100 162,70 256,70 Z" fill="url(#shield)"/>
  <path d="M 256,98 C 330,98 370,120 370,210 C 370,325 256,398 256,398 C 256,398 142,325 142,210 C 142,120 182,98 256,98 Z" fill="#090d16" stroke="#38bdf8" stroke-width="5"/>
  <path d="M 210,256 L 245,291 L 315,221" fill="none" stroke="#10b981" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  graphicsFolder?.file('telepakt_app_icon_512.svg', appIconSvg);

  // Horizontal Banner for Web & Socials
  const horizontalBannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="banBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="50%" stop-color="#090d16"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#banBg)"/>
  <text x="100" y="240" font-family="'Inter', sans-serif" font-weight="900" font-size="72" fill="#ffffff">
    TELE<tspan fill="#38bdf8">PAKT</tspan><tspan fill="#06b6d4" font-size="44">.PL</tspan>
  </text>
  <text x="100" y="310" font-family="'Inter', sans-serif" font-weight="700" font-size="34" fill="#38bdf8">
    Legalna Tarcza w Twoim Smartfonie
  </text>
  <text x="100" y="380" font-family="'Inter', sans-serif" font-weight="400" font-size="22" fill="#94a3b8">
    1-Tap Weto na telemarketerów i natrętny spam zgodne z art. 398 PKE (2024) i RODO.
  </text>
  <rect x="100" y="440" width="320" height="60" rx="16" fill="#4f46e5"/>
  <text x="260" y="478" font-family="'Inter', sans-serif" font-weight="700" font-size="20" fill="#ffffff" text-anchor="middle">
    ZOBACZ NA TELEPAKT.PL
  </text>
</svg>`;

  graphicsFolder?.file('telepakt_horizontal_banner_1200x630.svg', horizontalBannerSvg);

  // Brand Palette & Specs JSON
  const brandSpecs = {
    brandName: "TelePakt",
    domain: "telepakt.pl",
    tagline: "Legalna Tarcza i Weto w Twoim Smartfonie",
    primaryColors: {
      deepNavyBackground: "#020617",
      slateSurface: "#0f172a",
      cyanAccent: "#06b6d4",
      indigoPrimary: "#4f46e5",
      emeraldSuccess: "#10b981",
      amberWarning: "#f59e0b"
    },
    typography: {
      primaryFont: "Inter, system-ui, -apple-system, sans-serif",
      monoFont: "ui-monospace, SFMono-Regular, Menlo, monospace"
    },
    legalGrounds: [
      "Ustawa z 12 lipca 2024 r. - Prawo komunikacji elektronicznej (PKE) art. 398 i 445",
      "Kodeks postępowania cywilnego art. 308 (dowód z nagrania)",
      "RODO Rozporządzenie UE 2016/679 art. 21 (sprzeciw) i art. 17 (prawo do bycia zapomnianym)",
      "Wyroki SN: II CSK 478/15, I UK 156/15"
    ]
  };

  graphicsFolder?.file('brand_identity_guide.json', JSON.stringify(brandSpecs, null, 2));

  // Try to bundle original image if accessible in browser
  try {
    const imgResponse = await fetch('/src/assets/images/telepakt_logo_icon_1793197547893.jpg');
    if (imgResponse.ok) {
      const imgBlob = await imgResponse.blob();
      graphicsFolder?.file('telepakt_logo_original.jpg', imgBlob);
    }
  } catch {
    // If running in offline preview without fetch, svg remains the pristine master
  }

  report(60, 'Kompilacja dokumentów prawnych i regulaminów...');

  // 4. LEGAL DOCUMENTS
  const legalDocsFolder = zip.folder('dokumenty_prawne');

  const tos = `REGULAMIN ŚWIADCZENIA USŁUG DROGĄ ELEKTRONICZNĄ SERWISU I APLIKACJI TELEPAKT (telepakt.pl)
Wersja obowiązująca od: 10 listopada 2024 r. (zgodna z ustawą Prawo komunikacji elektronicznej)

§ 1. POSTANOWIENIA OGÓLNE
1. Niniejszy Regulamin określa zasady korzystania z aplikacji mobilnej i serwisu internetowego TelePakt (dalej: "Aplikacja" lub "Serwis"), dostępnego pod adresem https://telepakt.pl.
2. Usługodawcą jest operator platformy TelePakt (dalej: "Usługodawca").
3. Aplikacja służy do ochrony abonentów telekomunikacyjnych przed niechcianymi połączeniami bezpośrednimi (spam, telemarketing niezamówiony), realizacji uprawnień wynikających z art. 398 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE) oraz art. 17 i 21 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).
4. Warunkiem korzystania z Aplikacji jest zapoznanie się z niniejszym Regulaminem i akceptacja jego postanowień.

§ 2. ZASADA DZIAŁANIA I CHARAKTER USŁUGI
1. Aplikacja realizuje połączenia w architekturze telekonferencji (3-way call) lub przekierowania połączeń za pośrednictwem bezpiecznego węzła SIP/VoIP.
2. W trakcie trwania połączenia przychodzącego Użytkownik ma możliwość aktywowania modułu oświadczenia woli, który odtwarza uprawnioną formułę prawną sprzeciwu wobec marketingu bezpośredniego oraz żądania usunięcia danych osobowych (numeru telefonu) z bazy dzwoniącego.
3. Nagranie rozmowy realizowane jest na żądanie Użytkownika będącego stroną połączenia, na podstawie art. 308 ustawy z dnia 17 listopada 1964 r. – Kodeks postępowania cywilnego w celu zabezpieczenia materiału dowodowego na wypadek dochodzenia roszczeń lub złożenia zawiadomienia do Prezesa Urzędu Komunikacji Elektronicznej (UKE) lub Prezesa Urzędu Ochrony Danych Osobowych (UODO).

§ 3. OBOWIĄZKI UŻYTKOWNIKA I DOZWOLONY UŻYTEK
1. Użytkownik zobowiązuje się do korzystania z Aplikacji wyłącznie w celach zgodnych z powszechnie obowiązującym prawem, zasadami współżycia społecznego i dobrymi obyczajami.
2. Zabrania się wykorzystywania Aplikacji do nękania osób trzecich, podsłuchiwania rozmówców, w których Użytkownik nie bierze bezpośredniego udziału, ani rejestrowania rozmów w zamiarze popełnienia czynu zabronionego.
3. Użytkownik ponosi pełną odpowiedzialność za wykorzystanie zgromadzonych nagrań, w szczególności za ich ewentualne publiczne rozpowszechnianie bez zgody rozmówcy. Rekomendowanym przeznaczeniem nagrania jest wykorzystanie go w postępowaniu przed organami ścigania, sądami lub organami nadzorczymi (UKE, UODO).

§ 4. WARUNKI TECHNICZNE
1. Wymagania: urządzenie Android (10.0+) lub iOS (15.0+), karta SIM z włączoną przez operatora obsługą połączeń konferencyjnych oraz dostęp do Internetu.

§ 5. PŁATNOŚCI I SUBSKRYPCJE
1. Pakiet bezpłatny: do 3 interwencji miesięcznie.
2. Pakiet PRO: płatna subskrypcja (miesięczna 14,99 zł lub roczna 119 zł). Prawo odstąpienia od umowy w terminie 14 dni.

§ 6. REKLAMACJE
Kontakt: kontakt@telepakt.pl. Odpowiedź w terminie 14 dni.`;

  const privacyPolicy = `POLITYKA PRYWATNOŚCI I KLAUZULA OCHRONY DANYCH OSOBOWYCH (telepakt.pl)
Ochrona prywatności i procedura „Zero-Storage”

1. ADMINISTRATOR DANYCH
Administratorem danych osobowych Użytkowników serwisu telepakt.pl oraz aplikacji TelePakt jest TelePakt Polska (kontakt: iod@telepakt.pl).

2. JAKIE DANE PRZETWARZAMY?
a) Dane konta Użytkownika: adres e-mail, identyfikator użytkownika, typ subskrypcji;
b) Dane techniczne połączenia: data, godzina, czas trwania, caller ID dzwoniącego;
c) Pliki audio z nagrań rozmów: przetwarzane wyłącznie na bezpośrednie polecenie Użytkownika.

3. PROCEDURA „ZERO-STORAGE” (BEZWZGLĘDNA PRYWATNOŚĆ)
Aplikacja TelePakt została zaprojektowana zgodnie z zasadą Privacy by Design (art. 25 RODO):
- Po zakończeniu połączenia i pobraniu pliku audio przez telefon Użytkownika, serwer może natychmiast trwale usunąć plik audio z chmury.
- W planie chmurowym plik jest przechowywany maksymalnie przez 30 dni w szyfrowanym magazynie (AES-256), po czym następuje nieodwracalne skasowanie.

4. PODSTAWA PRAWNA
- Art. 6 ust. 1 lit. b RODO (wykonanie umowy);
- Art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes – ochrona praw i obrona przed roszczeniami);
- Motyw 18 RODO (Zwolnienie dla działalności osobistej i domowej użytkownika).`;

  const userManual = `OFICJALNA INSTRUKCJA UŻYTKOWANIA APLIKACJI TELEPAKT (telepakt.pl)
Przewodnik szybkiego startu dla sieci Play, Plus, Orange i T-Mobile

KROK 1: WŁĄCZENIE POŁĄCZEŃ TRÓJSTRONNYCH U OPERATORA
• ORANGE: Aplikacja „Mój Orange” lub kod USSD: *110*00# (zatwierdź zieloną słuchawką).
• PLAY: Domyślnie aktywne na wszystkich kartach SIM (lub weryfikacja w „Play24”).
• PLUS: Aktywacja w aplikacji „iPlus” lub darmowy telefon do BOK.
• T-MOBILE: Aktywacja w aplikacji „Mój T-Mobile” (Usługi dodatkowe -> Połączenia konferencyjne).

KROK 2: ODEBRANIE POŁĄCZENIA
1. Odbierz połączenie od nieznanego numeru.
2. Gdy słyszysz ofertę handlową, dotknij suwaka TelePakt.

KROK 3: DOŁĄCZENIE BOTA
• iPhone: Kliknij przycisk „Połącz rozmowy” (Merge calls).
• Android: Połączenie telekonferencji scala się automatycznie.
• Bot odczytuje formułę art. 398 PKE / RODO.
• Telemarketer rozłącza się w panice.

KROK 4: CERTYFIKAT I ZERO-STORAGE
Pobierz certyfikat dowodowy SHA-256 dla UKE lub zapisz nagranie do Google Drive / pamięci telefonu.`;

  legalDocsFolder?.file('Regulamin_Swiadczenia_Uslug_telepakt_pl.txt', tos);
  legalDocsFolder?.file('Polityka_Prywatnosci_Zero_Storage.txt', privacyPolicy);
  legalDocsFolder?.file('Instrukcja_Konfiguracji_Play_Orange_Plus_TMobile.txt', userManual);

  // Formal legal complaint to UKE template
  const ukeComplaintTemplate = `WZÓR SKARGI / ZAWIADOMIENIA O POPEŁNIENIU DELIKTU TELEKOMUNIKACYJNEGO
Do:
Prezes Urzędu Komunikacji Elektronicznej (UKE)
ul. Giełdowa 7/9, 01-211 Warszawa
(lub przez ePUAP: /UKE/SkrytkaESP)

Zgłaszający:
[Imię i Nazwisko / Nazwa Firmy]
[Adres korespondencyjny]
[Numer telefonu, na który wykonano połączenie]

Podmiot naruszający (Zgłaszany):
[Numer telefonu, z którego dzwoniono]
[Nazwa podmiotu / oferowana usługa, np. Fotowoltaika, Inwestycje]

ZAWIADOMIENIE O NARUSZENIU ART. 398 USTAWY PRAWO KOMUNIKACJI ELEKTRONICZNEJ
Wnoszę o wszczęcie postępowania administracyjnego i nałożenie administracyjnej kary pieniężnej na podstawie art. 445 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE).

UZASADNIENIE
W dniu [DATA] o godzinie [GODZINA] na mój numer telefonu wykonano niechciane połączenie o charakterze marketingu bezpośredniego.
Nigdy nie wyraziłem/am uprzedniej zgody na kontakt marketingowy. W trakcie połączenia za pośrednictwem systemu TelePakt złożyłem/am formalny sprzeciw z art. 398 PKE oraz art. 21 RODO.
W załączeniu przedkładam certyfikat zdarzenia wygenerowany przez system TelePakt (telepakt.pl) ze znacznikiem czasu i sumą kontrolną SHA-256.

[Podpis]`;

  legalDocsFolder?.file('Wzorzec_Wniosku_Skargi_do_Prezesa_UKE_Art398_PKE.txt', ukeComplaintTemplate);

  report(75, 'Zapisywanie scenariuszy wideo (TikTok, YouTube, Reels)...');

  // 5. VIDEO & ANIMATION SCRIPTS
  const videoFolder = zip.folder('wideo_i_animacje');

  const socialScripts = `# SCENARIUSZE WIDEO DLA TWÓRCÓW SOCIAL MEDIA (TIKTOK / REELS / SHORTS / YT)
Aplikacja: TelePakt (telepakt.pl)

---

## SCENARIUSZ 1: TIKTOK / INSTAGRAM REELS (9:16)
Tytuł: „Czy wiesz, że za ten 1 telefon możesz ukarać firmę na 1 000 000 zł?”
Czas: 25-30 sekund

[SCENA 1 - 0:00 do 0:05]
Wizualia: Zbliżenie na dzwoniący telefon, numer z Warszawy, napis „Fotowoltaika SPAM”.
Lektor (dynamicznie): „Dzwoni do Ciebie natrętny telemarketer z garnkami albo fotowoltaiką? NIE ROZŁĄCZAJ SIĘ!”

[SCENA 2 - 0:05 do 0:12]
Wizualia: Kciuk przesuwa suwak TelePakt na ekranie. Animacja tarczy.
Lektor: „10 listopada weszło w życie nowe prawo PKE. Przesuwasz jeden suwak TelePakt i włączasz bota prawnego!”

[SCENA 3 - 0:12 do 0:20]
Wizualia: Głos bota recytuje art. 398 PKE i art. 21 RODO. Po drugiej stronie telemarketer zszokowany szybko klika rozłącz.
Lektor bota: „Informuję, że rozmowa jest nagrywana, żądam usunięcia danych z CRM pod rygorem 1 miliona zł kary od UKE!”

[SCENA 4 - 0:20 do 0:28]
Wizualia: Ekran sukcesu TelePakt, pobieranie certyfikatu dowodowego i logo telepakt.pl.
Lektor: „Telemarketer ucieka w 10 sekund, Twój numer znika z ich bazy, a Ty masz dowód dla urzędu. Pobierz na telepakt.pl!”

Hashtagi: #telepakt #stopspam #rodo #prawo #telemarketing #polska #technologia

---

## SCENARIUSZ 2: YOUTUBE / LANDING PAGE (16:9)
Tytuł: „Jak TelePakt raz na zawsze usuwa Twój numer z baz telemarketerów”
Główne punkty:
1. Dlaczego blokowanie numeru nie działa (CLI spoofing i rotacja setek numerów).
2. Wyjaśnienie artykułu 398 PKE i kary do 1 000 000 PLN.
3. Zasada działania telekonferencji 3-way call na iOS i Android.
4. Procedura Zero-Storage – dlaczego TelePakt nie przechowuje Twoich prywatnych rozmów.
`;

  videoFolder?.file('Scenariusze_Social_Media_TikTok_Reels_Shorts.txt', socialScripts);

  report(85, 'Pakowanie kompletnego projektu Python (Django 5 / Render.com / Hostinger)...');

  // 6. PYTHON DJANGO BACKEND CODEBASE
  const pythonFolder = zip.folder('kod_zrodlowy_django_backend');

  PYTHON_PROJECT_FILES.forEach((pf) => {
    pythonFolder?.file(pf.path, pf.content);
  });

  // 7. COMPLETE SCRIPTS LIST IN POLISH
  const scriptsContent = LEGAL_SCRIPTS.map((s, idx) => {
    return `=== SKRYPT ${idx + 1}: ${s.title} ===
Kategoria: ${s.category}
Rozłącza po zakończeniu: ${s.autoHangup ? 'TAK' : 'NIE'}
Podstawa prawna: ${s.legalAct}

TREŚĆ OŚWIADCZENIA:
"${s.text}"
\n------------------------------------------------------------\n`;
  }).join('\n');

  zip.file('03_WSZYSTKIE_SKRYPTY_I_FORMULY_PRAWNE.txt', scriptsContent);

  report(95, 'Finalizowanie archiwum ZIP...');
  const blob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    report(95 + Math.round(metadata.percent * 0.05), `Kompresja ZIP: ${Math.round(metadata.percent)}%`);
  });

  report(100, 'Paczka gotowa do pobrania!');
  return blob;
}
