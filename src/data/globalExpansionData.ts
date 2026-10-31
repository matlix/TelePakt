export interface GlobalMarket {
  countryCode: string;
  name: string;
  nativeName: string;
  flag: string;
  currency: string;
  recommendedPriceMonthly: string;
  recommendedPriceYearly: string;
  marketSizeSmartphones: string;
  robocallVolumeAnnual: string;
  primaryLaw: string;
  lawEnforcementBody: string;
  penalties: string;
  keyUniqueAngle: string;
  wiretapConsentRule: 'one_party' | 'two_party' | 'strict_notice';
  wiretapDetails: string;
  legalScriptSample: {
    language: string;
    title: string;
    speech: string;
    statute: string;
  };
}

export const GLOBAL_MARKETS: GlobalMarket[] = [
  {
    countryCode: 'US',
    name: 'Stany Zjednoczone (USA)',
    nativeName: 'United States',
    flag: '🇺🇸',
    currency: 'USD ($)',
    recommendedPriceMonthly: '$9.99 / mies.',
    recommendedPriceYearly: '$79.99 / rok',
    marketSizeSmartphones: '310 milionów smartfonów',
    robocallVolumeAnnual: 'Ponad 50 miliardów robocalli rocznie',
    primaryLaw: 'TCPA (Telephone Consumer Protection Act - 47 U.S.C. § 227) & TSR',
    lawEnforcementBody: 'FTC (Federal Trade Commission) & Federal District Courts',
    penalties: 'Odszkodowanie ustawowe: 500$ do 1 500$ ZA KAŻDE NIELEGALNE POŁĄCZENIE (płatne bezpośrednio konsumentowi!)',
    keyUniqueAngle: '„TCPA Bounty Hunter” – w USA konsumenci zarabiają tysiące dolarów rocznie, pozywając spamerów w sądach drobnych roszczeń (Small Claims Court). TelePakt generuje gotowe wezwania do zapłaty (Demand Letters).',
    wiretapConsentRule: 'strict_notice',
    wiretapDetails: '35 stanów to One-Party Consent, 15 stanów (m.in. Kalifornia, Floryda, Pensylwania) to Two-Party Consent. Odczytanie formuły TelePakt „This call is being recorded” spełnia wymogi we wszystkich 50 stanach!',
    legalScriptSample: {
      language: 'English (US)',
      title: 'TCPA Statutory Revocation & $1,500 Warning',
      speech: 'Notice: This call is being recorded. Under the Telephone Consumer Protection Act, 47 U.S.C. Section 227, I hereby revoke any prior express consent and demand to be placed on your internal Do Not Call list. Continuing to call this number subjects your company to statutory damages of up to $1,500 per call. State your full corporate name and address now.',
      statute: '47 U.S.C. § 227(b)(3)'
    }
  },
  {
    countryCode: 'UK',
    name: 'Wielka Brytania (UK)',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    currency: 'GBP (£)',
    recommendedPriceMonthly: '£7.99 / mies.',
    recommendedPriceYearly: '£64.99 / rok',
    marketSizeSmartphones: '65 milionów smartfonów',
    robocallVolumeAnnual: 'Około 3,8 miliarda niechcianych połączeń',
    primaryLaw: 'PECR (Privacy and Electronic Communications Regulations 2003) & UK GDPR',
    lawEnforcementBody: 'ICO (Information Commissioner\'s Office)',
    penalties: 'Kary administracyjne do 500 000 GBP nakładane przez komisarza ICO oraz prawo do odszkodowania z art. 82 UK GDPR.',
    keyUniqueAngle: 'Automatyczne zgłoszenie do Telephone Preference Service (TPS) oraz generowanie skarg do ICO za naruszenie Regulation 19 & 21 PECR.',
    wiretapConsentRule: 'one_party',
    wiretapDetails: 'W prawie angielskim (RIPA 2000) nagrywanie rozmowy na własny użytek jest w 100% legalne (One-Party Consent). Poinformowanie o nagrywaniu umożliwia wykorzystanie pliku w sporach handlowych.',
    legalScriptSample: {
      language: 'English (UK)',
      title: 'UK PECR & ICO Enforcement Notice',
      speech: 'Please be informed that this call is recorded. Under Regulation 21 of the Privacy and Electronic Communications Regulations 2003 and Section 122 of the Data Protection Act, I object to unsolicited direct marketing. Remove my number immediately. This recording will be submitted to the Information Commissioner\'s Office for enforcement of fines up to £500,000.',
      statute: 'PECR 2003 Reg. 21 / UK GDPR'
    }
  },
  {
    countryCode: 'DE',
    name: 'Niemcy / Austria / Szwajcaria (DACH)',
    nativeName: 'Deutschland (DACH)',
    flag: '🇩🇪',
    currency: 'EUR (€)',
    recommendedPriceMonthly: '8,99 € / mies.',
    recommendedPriceYearly: '79,00 € / rok',
    marketSizeSmartphones: '72 miliony smartfonów',
    robocallVolumeAnnual: 'Około 1,5 miliarda połączeń typu Cold Calling',
    primaryLaw: 'UWG § 7 (Gesetz gegen den unlauteren Wettbewerb) & DSGVO (RODO)',
    lawEnforcementBody: 'Bundesnetzagentur & Verbraucherzentrale',
    penalties: 'Kary urzędowe do 300 000 € od Bundesnetzagentur oraz natychmiastowe wezwania kancelaryjne (Abmahnung) z karami umownymi 3 000 - 10 000 €.',
    keyUniqueAngle: 'Niemcy mają najwyższą świadomość ochrony prywatności (Datenschutz) na świecie. Cold calling bez wyraźnej wcześniejszej zgody (Opt-in) jest bezwzględnie zakazany. Klienci chętnie płacą abonament za ochronę.',
    wiretapConsentRule: 'two_party',
    wiretapDetails: '§ 201 StGB (Verletzung der Vertraulichkeit des Wortes) wymaga zgody na nagrywanie. Komunikat bota TelePakt w pierwszej sekundzie: „Dieses Gespräch wird aufgezeichnet” w pełni legalizuje nagranie w przypadku kontynuacji rozmowy przez spamera.',
    legalScriptSample: {
      language: 'Deutsch (Niemiecki)',
      title: 'UWG § 7 Abmahnung & Bundesnetzagentur Anzeige',
      speech: 'Achtung: Dieses Gespräch wird aufgezeichnet. Gemäß § 7 des Gesetzes gegen den unlauteren Wettbewerb (UWG) ist unerlaubte Telefonwerbung rechtswidrig. Ich widerspreche hiermit nach Art. 21 DSGVO der Verarbeitung meiner Daten und fordere die unverzügliche Löschung. Diese Aufzeichnung wird an die Bundesnetzagentur zur Verhängung eines Bußgeldes bis zu 300.000 Euro übermittelt.',
      statute: '§ 7 Abs. 2 Nr. 2 UWG, Art. 21 DSGVO'
    }
  },
  {
    countryCode: 'FR',
    name: 'Francja',
    nativeName: 'France',
    flag: '🇫🇷',
    currency: 'EUR (€)',
    recommendedPriceMonthly: '6,99 € / mies.',
    recommendedPriceYearly: '59,00 € / rok',
    marketSizeSmartphones: '58 milionów smartfonów',
    robocallVolumeAnnual: 'Około 2,9 miliarda połączeń marketingowych',
    primaryLaw: 'Code de la consommation (Art. L. 223-1) & Loi Naegelen (2020)',
    lawEnforcementBody: 'DGCCRF (Ochrona konkurencji i konsumentów) & CNIL',
    penalties: 'Kary administracyjne do 375 000 € za nieprzestrzeganie rejestru Bloctel i telefonowanie poza dozwolonymi dniami/godzinami.',
    keyUniqueAngle: 'Francja wprowadziła surowe ramy prawne dopuszczające telemarketing tylko w dni robocze w ściśle określonych godzinach. Naruszenie rejestru Bloctel jest karane z urzędu.',
    wiretapConsentRule: 'strict_notice',
    wiretapDetails: 'Nagrywanie do celów dowodowych dopuszczalne po powiadomieniu rozmówcy. Wyrok Cour de cassation (2023) dopuszcza nagrania w obronie praw konsumenta.',
    legalScriptSample: {
      language: 'Français (Francuski)',
      title: 'Bloctel & Code de la consommation',
      speech: 'Attention: cet appel est enregistré. Conformément à l\'article L. 223-1 du Code de la consommation et au RGPD, je vous informe de mon opposition formelle à tout démarchage téléphonique. Veuillez supprimer immédiatement mes coordonnées sous peine de signalement à la DGCCRF pour une amende pouvant atteindre 375 000 euros.',
      statute: 'Art. L. 223-1 Code de la consommation'
    }
  },
  {
    countryCode: 'AU',
    name: 'Australia',
    nativeName: 'Australia',
    flag: '🇦🇺',
    currency: 'AUD ($)',
    recommendedPriceMonthly: '$11.99 AUD / mies.',
    recommendedPriceYearly: '$89.99 AUD / rok',
    marketSizeSmartphones: '22 miliony smartfonów',
    robocallVolumeAnnual: 'Około 1,2 miliarda połączeń scam/spam',
    primaryLaw: 'Do Not Call Register Act 2006 (Cth) & Telecommunications Act',
    lawEnforcementBody: 'ACMA (Australian Communications and Media Authority)',
    penalties: 'Kary nakładane przez ACMA do 2,22 miliona AUD za uporczywe naruszenia rejestru DNCR.',
    keyUniqueAngle: 'Wysoka zamożność i plaga fałszywych połączeń z Azji podszywających się pod Australian Taxation Office (ATO). ACMA intensywnie ściga i nakłada wielomilionowe kary.',
    wiretapConsentRule: 'strict_notice',
    wiretapDetails: 'Surveillance Devices Act w stanach NSW, Victoria i Queensland wymaga poinformowania o nagrywaniu. Komunikat TelePakt spełnia wymogi stanowe.',
    legalScriptSample: {
      language: 'English (AU)',
      title: 'ACMA Do Not Call Register Enforcement',
      speech: 'Notice: This telephone call is being recorded. Under the Do Not Call Register Act 2006, my number is registered on the national register. I demand the immediate cessation of contact and deletion of my personal details. Non-compliance will be formally escalated to the ACMA with this recording for enforcement of penalties up to 2.22 million dollars.',
      statute: 'Do Not Call Register Act 2006'
    }
  },
  {
    countryCode: 'ES',
    name: 'Hiszpania i Kraje Iberoamerykańskie (LATAM)',
    nativeName: 'España y Latinoamérica',
    flag: '🇪🇸',
    currency: 'EUR (€) / USD ($)',
    recommendedPriceMonthly: '5,99 € / mies.',
    recommendedPriceYearly: '49,00 € / rok',
    marketSizeSmartphones: 'Ponad 350 milionów smartfonów',
    robocallVolumeAnnual: 'Ponad 25 miliardów połączeń spamowych',
    primaryLaw: 'Ley General de Telecomunicaciones (Ley 11/2022) & Lista Robinson',
    lawEnforcementBody: 'AEPD (Agencia Española de Protección de Datos)',
    penalties: 'Art. 66 Ley 11/2022 wprowadził bezwzględny zakaz cold callingu bez wyraźnej uprzedniej zgody. Kary AEPD do 20 milionów euro lub 4% obrotu.',
    keyUniqueAngle: 'Hiszpania zakazała niechcianych telefonów w czerwcu 2023 r., ale firmy nadal dzwonią. Rynek hiszpańskojęzyczny (Hiszpania, Meksyk, Kolumbia, Argentyna) to olbrzymi potencjał wirusowy.',
    wiretapConsentRule: 'one_party',
    wiretapDetails: 'Trybunał Konstytucyjny Hiszpanii (STC 114/1984) potwierdza, że nagrywanie rozmowy, w której się uczestniczy, nie narusza tajemnicy komunikacji.',
    legalScriptSample: {
      language: 'Español (Hiszpański)',
      title: 'Ley 11/2022 & Lista Robinson AEPD',
      speech: 'Aviso: Esta llamada está siendo grabada. Según el artículo 66 de la Ley General de Telecomunicaciones 11/2022 y el RGPD, queda prohibido realizar llamadas comerciales no solicitadas. Exijo la baja inmediata de mi número y la supresión de mis datos. Esta grabación se presentará ante la Agencia Española de Protección de Datos (AEPD).',
      statute: 'Art. 66 Ley 11/2022, RGPD Art. 21'
    }
  }
];

export interface GlobalArchitectureComponent {
  layer: string;
  name: string;
  tech: string;
  globalReadiness: string;
  description: string;
}

export const GLOBAL_ARCHITECTURE_STACK: GlobalArchitectureComponent[] = [
  {
    layer: '1. Telefonia & SIP (Warstwa Połączeń)',
    name: 'Global Distributed SIP Conference Bridge',
    tech: 'Twilio Voice / Telnyx / Plivo (Multi-Region Anycast)',
    globalReadiness: '100+ krajów obsługiwanych natychmiast',
    description: 'System przydziela lokalne numery dostępowe (DIDs) w USA (+1), UK (+44), Niemczech (+49) itd. Użytkownik w Nowym Jorku scala połączenie z lokalnym węzłem w Wirginii, użytkownik w Londynie z węzłem we Frankfurcie/Londynie (opóźnienia <15ms).'
  },
  {
    layer: '2. Silnik Prawny & AI TTS',
    name: 'Multi-Jurisdiction Legal Rule Engine',
    tech: 'Neural TTS (Polly / ElevenLabs) + Smart Script Engine',
    globalReadiness: 'Ponad 30 języków i dialektów',
    description: 'Aplikacja na podstawie prefiksu kraju i preferencji użytkownika natychmiast dobiera właściwą podstawę prawną (TCPA w USA, UWG w Niemczech, PECR w UK, PKE w Polsce) i odtwarza formułę z naturalnym, autorytatywnym akcentem prawnika.'
  },
  {
    layer: '3. Generator Dokumentów Procesowych',
    name: 'Automated Demand Letter & Regulatory Complaint PDF',
    tech: 'Python ReportLab / Jinja2 PDF Generator',
    globalReadiness: 'Szablony dla sądów US Small Claims, UK ICO, DE Bundesnetzagentur',
    description: 'W USA użytkownik jednym kliknięciem generuje formalne przedsądowe wezwanie do zapłaty (Demand Letter na $500–$1,500 za naruszenie TCPA) z osadzonym nagraniem, datą, godziną i sumą kontrolną SHA-256.'
  },
  {
    layer: '4. Prywatność i Międzynarodowa Zgodność',
    name: 'Zero-Storage Privacy by Design',
    tech: 'AES-256, TLS 1.3, Automatyczny Shredding Nagrań',
    globalReadiness: 'Zgodne z GDPR, CCPA, CPRA, HIPAA, Australian Privacy Principles',
    description: 'Brak przechowywania nagrań na serwerach chmurowych (nagrania trafiają bezpośrednio na telefon lub prywatny dysk klienta Google Drive/Dropbox/iCloud) eliminuje problem transgranicznego transferu danych (tzw. problem Schrems II między USA a Europą).'
  },
  {
    layer: '5. Globalna Monetyzacja i Płatności',
    name: 'Merchant of Record App Store Subscriptions',
    tech: 'Google Play Billing + Apple StoreKit 2',
    globalReadiness: '175 krajów, ponad 40 lokalnych walut, 0 licencji bankowych',
    description: 'Google i Apple jako pośrednicy prawni (Merchant of Record) automatycznie pobierają płatności w lokalnych walutach (USD, EUR, GBP, AUD, CAD, JPY), rozliczają lokalny podatek VAT/Sales Tax i przesyłają środki netto raz w miesiącu.'
  }
];
