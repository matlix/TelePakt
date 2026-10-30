import { LegalScript } from '../types';

export const LEGAL_SCRIPTS: LegalScript[] = [
  {
    id: 'script-1-marketer-rodo',
    title: 'Pełny sprzeciw RODO i art. 398 PKE',
    shortDesc: 'Kompletne, niepodważalne oświadczenie prawne z żądaniem usunięcia numeru i zapowiedzią skargi do UKE i UODO.',
    category: 'marketer-full',
    legalAct: 'Art. 398 PKE (Dz.U. 2024 poz. 1221) + Art. 21, 17, 15 RODO',
    badge: 'Maksymalny rygor prawny',
    durationEst: '34 sekundy (~1 min taryfikacji)',
    autoHangup: true,
    text: `Dzień dobry. Informuję, że ta rozmowa jest nagrywana. Nie wyraziłem zgody na kontakt marketingowy, a zgodnie z art. 398 ustawy – Prawo komunikacji elektronicznej taki kontakt wymaga mojej uprzedniej zgody. Na podstawie art. 21 RODO wnoszę sprzeciw wobec przetwarzania moich danych osobowych, w tym numeru telefonu, w celach marketingu bezpośredniego, a na podstawie art. 17 RODO żądam usunięcia moich danych z Państwa baz. Na podstawie art. 15 RODO proszę o informację, skąd pozyskali Państwo mój numer. W przypadku ponownego kontaktu złożę skargę do Prezesa UKE oraz Prezesa UODO i rozważę dochodzenie roszczeń na drodze sądowej. Do widzenia.`,
    legalBreakdown: [
      {
        article: 'Art. 398 PKE (od 10.11.2024)',
        description: 'Zastąpił dawny art. 172 Prawa telekomunikacyjnego. Telemarketing (w tym boty i systemy automatyczne) jest nielegalny bez wcześniejszej wyraźnej zgody konsumenta lub przedsiębiorcy.',
        penalty: 'Kara Prezesa UKE: do 3% przychodu za rok ubiegły lub do 1 000 000 zł.'
      },
      {
        article: 'Art. 21 RODO (Sprzeciw bezwzględny)',
        description: 'Sprzeciw wobec marketingu bezpośredniego ma charakter absolutny. Administrator nie może powoływać się na prawnie uzasadniony interes i MUSI natychmiast zaprzestać dzwonienia.',
        penalty: 'Kara Prezesa UODO: do 20 000 000 EUR lub 4% rocznego światowego obrotu.'
      },
      {
        article: 'Art. 17 RODO (Prawo do bycia zapomnianym)',
        description: 'Nakazuje trwałe wykasowanie numeru z systemów telemarketingowych i baz call center.',
        penalty: 'Obowiązek usunięcia bez zbędnej zwłoki pod rygorem kontroli UODO.'
      },
      {
        article: 'Art. 15 RODO (Prawo dostępu i źródło danych)',
        description: 'Zobowiązuje dzwoniącego do ujawnienia, kto i skąd sprzedał lub przekazał Twój numer telefonu.',
        penalty: 'Zezwala na wykrycie brokera baz danych handlującego numerami bezprawnie.'
      }
    ]
  },
  {
    id: 'script-2-recording-notice',
    title: 'Informacja o rejestracji połączenia',
    shortDesc: 'Zwięzła, oficjalna klauzula informacyjna. Do użycia przy każdej wątpliwej rozmowie.',
    category: 'recording-notice',
    legalAct: 'Art. 23 i 24 Kodeksu cywilnego (Dobra osobiste)',
    badge: 'Neutralna informacyjna',
    durationEst: '8 sekund',
    autoHangup: false,
    text: `Informuję, że ta rozmowa jest nagrywana. Kontynuując rozmowę, przyjmuje Pan/Pani to do wiadomości.`,
    legalBreakdown: [
      {
        article: 'Legalność nagrywania własnej rozmowy',
        description: 'W polskim prawie (art. 267 Kodeksu karnego dotyczy wyłącznie podsłuchu osób trzecich). Uczestnik rozmowy MOŻE ją nagrywać na własny użytek bez zgody drugiej strony.',
        penalty: 'Brak odpowiedzialności karnej; nagranie stanowi dopuszczalny dowód w sądzie i przed urzędami.'
      },
      {
        article: 'Art. 308 K.p.c. (Dowód z nagrania dźwiękowego)',
        description: 'Polskie sądy powszechne oraz organy administracji (UKE, UODO, Policja) rutynowo dopuszczają nagrania wykonane przez uczestnika rozmowy jako pełnoprawny dowód.',
        penalty: 'Materiały audio są kluczem do ukarania nielegalnego call center.'
      }
    ]
  },
  {
    id: 'script-3-short-rejection',
    title: 'Krótka odmowa z zakazem kontaktu',
    shortDesc: 'Szybkie zakończenie rozmowy bez zbędnej dyskusji, ale z zachowaniem rygoru RODO.',
    category: 'short-rejection',
    legalAct: 'Art. 21 ust. 2 i 3 RODO',
    badge: 'Ekspresowa odmowa',
    durationEst: '12 sekund',
    autoHangup: true,
    text: `Nie jestem zainteresowany i nie zgadzam się na kontakt marketingowy. Proszę trwale usunąć mój numer z Państwa listy kontaktowej. Ta rozmowa jest nagrywana jako dowód. Do widzenia.`,
    legalBreakdown: [
      {
        article: 'Art. 21 ust. 3 RODO',
        description: 'Jeżeli osoba zgłosi sprzeciw wobec przetwarzania w celach marketingu bezpośredniego, danych osobowych nie wolno już przetwarzać do takich celów pod żadnym pozorem.',
        penalty: 'Każdy kolejny telefon to bezpośrednie naruszenie prawa ze statusem recydywy.'
      }
    ]
  },
  {
    id: 'script-4-forward-reject',
    title: 'Automatyczna odpowiedź Bota (odrzuć i przekieruj)',
    shortDesc: 'Odtwarzana gdy odrzucasz połączenie na telefonie (poprzez bezwarunkowe przekierowanie zajętego numeru).',
    category: 'custom',
    legalAct: 'Art. 398 PKE + Art. 21 RODO',
    badge: 'Dla natrętnego spamu',
    durationEst: '25 sekund',
    autoHangup: true,
    text: `Połączyłeś się z automatycznym rejestratorem sprzeciwów marketingowych. Właściciel tego numeru oświadcza, że nie wyraził zgody na połączenia marketingowe i żąda zaprzestania kontaktu oraz usunięcia danych zgodnie z art. 398 PKE i art. 21 RODO. Połączenie oraz identyfikator Twojego numeru zostały zarejestrowane.`,
    legalBreakdown: [
      {
        article: 'Warunkowe przekierowanie (Busy Forwarding)',
        description: 'Gdy użytkownik klika "Odrzuć" w telefonie, sieć GSM (Play, Orange, Plus, T-Mobile) przekierowuje połączenie na polski numer Twilio bota, bez konieczności zestawiania telekonferencji.',
        penalty: 'Oszczędza czas użytkownika i zniechęca roboty dzwoniące.'
      }
    ]
  },
  {
    id: 'script-5-bank-fraud',
    title: 'Tarcza na Oszusta Bankowego (Anti-Spoofing)',
    shortDesc: 'Natychmiastowe rozbrojenie fałszywego pracownika banku żądającego BLIK lub AnyDesk.',
    category: 'bank-fraud',
    legalAct: 'Art. 286 K.k. + Rekomendacje KNF w sprawie uwierzytelniania',
    badge: 'Ochrona przed wyłudzeniem',
    durationEst: '28 sekund',
    autoHangup: true,
    text: `Weryfikacja bezpieczeństwa bankowego: Uwaga, ze względów bezpieczeństwa ta rozmowa jest rejestrowana. Zgodnie z oficjalną procedurą weryfikacji tożsamości pracownika banku proszę o natychmiastowe wysłanie autoryzacyjnego powiadomienia PUSH w mojej oficjalnej aplikacji bankowej lub podanie identyfikatora pracownika. Kategorycznie odmawiam podawania haseł, kodów BLIK oraz instalacji jakichkolwiek aplikacji zewnętrznych typu AnyDesk. Połączenie jest monitorowane.`,
    legalBreakdown: [
      {
        article: 'Art. 286 § 1 Kodeksu karnego (Oszustwo)',
        description: 'Podszywanie się pod pracowników instytucji finansowych w celu wyłudzenia środków to zbrodnia/występek zagrożony karą do 8 lat pozbawienia wolności.',
        penalty: 'Kara pozbawienia wolności od 6 miesięcy do lat 8.'
      },
      {
        article: 'Weryfikacja PUSH (Rekomendacja KNF)',
        description: 'Legalne polskie banki (mBank, PKO BP, Santander, ING) mają techniczny obowiązek potwierdzić tożsamość dzwoniącego konsultanta powiadomieniem w aplikacji mobilnej.',
        penalty: 'Oszust nie ma możliwości wysłania takiego powiadomienia i natychmiast ucieka.'
      }
    ]
  },
  {
    id: 'script-6-debt-collector',
    title: 'Obrona Praw Dłużnika (Zarzut Przedawnienia & Poczta)',
    shortDesc: 'Uciszenie natrętnej windykacji i przeniesienie sprawy wyłącznie na oficjalną drogę pocztową.',
    category: 'debt-collector',
    legalAct: 'Art. 190a K.k. + Art. 117 i 118 Kodeksu cywilnego',
    badge: 'Ochrona przed nękaniem',
    durationEst: '30 sekund',
    autoHangup: true,
    text: `Niniejszym oświadczam, że żądam natychmiastowego zaniechania kontaktu telefonicznego. Na podstawie artykułu 190a Kodeksu karnego ostrzegam, że powtarzające się telefony noszą znamiona uporczywego nękania. Na podstawie artykułu 117 Kodeksu cywilnego podnoszę zarzut przedawnienia ewentualnych roszczeń. Wszelkie wezwania oraz dokumenty źródłowe proszę kierować wyłącznie drogą pisemną, listem poleconym na mój adres korespondencyjny. Ta rozmowa jest nagrywana jako dowód.`,
    legalBreakdown: [
      {
        article: 'Art. 117 § 2 Kodeksu cywilnego (Przedawnienie)',
        description: 'Po upływie terminu przedawnienia ten, przeciwko komu przysługuje roszczenie, może uchylić się od jego zaspokojenia.',
        penalty: 'Sąd i komornik oddalają roszczenie.'
      },
      {
        article: 'Art. 190a § 1 K.k. (Stalking windykacyjny)',
        description: 'Uporczywe dzwonienie i wywieranie presji psychicznej przez windykatora może wypełniać znamiona przestępstwa nękania.',
        penalty: 'Podstawa do skargi do UOKiK i wniosku o ściganie.'
      }
    ]
  },
  {
    id: 'script-7-b2b-contract',
    title: 'Potwierdzenie Ustaleń Biznesowych (Ustna umowa B2B)',
    shortDesc: 'Zabezpieczenie ustaleń z klientem/fachowcem: zakres, cena, terminy i dodatkowe koszty.',
    category: 'b2b-agreement',
    legalAct: 'Art. 66 i 72 Kodeksu cywilnego + Art. 308 K.p.c.',
    badge: 'Zabezpieczenie zlecenia',
    durationEst: '22 sekundy',
    autoHangup: false,
    text: `Informuję, że niniejsza rozmowa jest rejestrowana za obopólną zgodą w celu sporządzenia wiążącej notatki oraz potwierdzenia ustaleń handlowych, zakresu prac, wyceny oraz terminów wykonania zgodnie z przepisami Kodeksu cywilnego. Ustalenia zostaną zarchiwizowane i stanowić będą integralną część naszego porozumienia.`,
    legalBreakdown: [
      {
        article: 'Art. 66 i 72 Kodeksu cywilnego',
        description: 'Umowa ustna jest w pełni wiążąca w polskim prawie. Nagranie potwierdzenia oferty i jej przyjęcia uniemożliwia wyparcie się warunków.',
        penalty: 'Podstawa do wydania nakazu zapłaty w postępowaniu upominawczym.'
      },
      {
        article: 'Art. 308 K.p.c. (Dowód audio w sporze gospodarczym)',
        description: 'W sprawach gospodarczych nagranie ustaleń telefonicznych jest koronnym dowodem na uzgodnienie wynagrodzenia dodatkowego.',
        penalty: 'Eliminuje 90% sporów o niezapłacone faktury.'
      }
    ]
  },
  {
    id: 'script-8-harassment',
    title: 'Zakaz Kontaktu & Stalking (Ochrona Osobista)',
    shortDesc: 'Stanowcze, niepodważalne wezwanie do zaprzestania nękania ze skutkiem prawno-karnym.',
    category: 'harassment-stalking',
    legalAct: 'Art. 190a § 1 Kodeksu karnego (Uporczywe nękanie)',
    badge: 'Rygor karny',
    durationEst: '26 sekund',
    autoHangup: true,
    text: `Oświadczam stanowczo i jednoznacznie, że kategorycznie nie wyrażam zgody na jakiekolwiek próby kontaktu ze mną – zarówno telefonicznego, jak i za pośrednictwem wiadomości. Kontynuowanie prób kontaktu stanowi przestępstwo stalkingu z artykułu 190a Kodeksu karnego i zostanie niezwłocznie zgłoszone organom ścigania z dołączeniem niniejszego nagrania jako materiału dowodowego. Proszę natychmiast zakończyć połączenie.`,
    legalBreakdown: [
      {
        article: 'Art. 190a § 1 Kodeksu karnego',
        description: 'Warunkiem skazania za stalking jest wykazanie, że sprawca wiedział o braku woli kontaktu ze strony ofiary. To nagranie stanowi niepodważalny dowód w Prokuraturze.',
        penalty: 'Kara pozbawienia wolności do 8 lat oraz natychmiastowy sądowy zakaz zbliżania.'
      }
    ]
  },
  {
    id: 'script-9-consumer-complaint',
    title: 'Oficjalna Reklamacja Konsumencka (Bieg terminu 14 dni)',
    shortDesc: 'Wszczęcie formalnej procedury reklamacyjnej wobec operatora sieci, ubezpieczyciela lub banku.',
    category: 'consumer-complaint',
    legalAct: 'Art. 7a Ustawy o prawach konsumenta',
    badge: 'Milczące uznanie w 14 dni',
    durationEst: '24 sekundy',
    autoHangup: false,
    text: `Niniejszym oświadczam, że składam oficjalną reklamację z tytułu nienależytego wykonania umowy. Zgodnie z ustawą o prawach konsumenta żądam usunięcia wady oraz korekty naliczonych opłat. Informuję, że ta rozmowa jest rejestrowana, a ustawowy 14-dniowy termin na udzielenie pisemnej odpowiedzi na moją reklamację rozpoczyna bieg od chwili niniejszego oświadczenia.`,
    legalBreakdown: [
      {
        article: 'Art. 7a Ustawy o prawach konsumenta',
        description: 'Jeżeli przedsiębiorca nie udzielił odpowiedzi na reklamację w terminie 14 dni od dnia jej otrzymania, uważa się, że uznał reklamację w całości.',
        penalty: 'Brak odpowiedzi w 14 dni oznacza bezwzględną wygraną konsumenta.'
      }
    ]
  },
  {
    id: 'script-10-emergency-exit',
    title: 'Awaryjne Kulturalne Wyjście z Rozmowy (Fake Exit)',
    shortDesc: 'Eleganckie przerwanie niekończącego się monologu bez urazy rozmówcy.',
    category: 'emergency-exit',
    legalAct: 'Komunikat centrali telefonicznej (Social / Business UX)',
    badge: 'Alibi & Oszczędność czasu',
    durationEst: '12 sekund',
    autoHangup: true,
    text: `Komunikat centrali: Uwaga, zarejestrowano drugie połączenie priorytetowe z systemu alarmowego. Bieżące połączenie zostanie automatycznie przerwane za 5 sekund. 3... 2... 1...`,
    legalBreakdown: [
      {
        article: 'Psychologiczne alibi (Social Grace)',
        description: 'Daje użytkownikowi natychmiastowe, niewzbudzające podejrzeń wyjście z trudnej, krępującej lub bezproduktywnej rozmowy.',
        penalty: 'Zero obrażonych klientów, partnerów czy znajomych.'
      }
    ]
  }
];

export const INITIAL_CALL_LOGS = [
  {
    id: 'call-101',
    callerNumber: '+48 22 104 39 88',
    callerName: 'Call Center Fotowoltaika (Spam)',
    spamCategory: 'Niechciana oferta / Pokazy',
    spamRisk: 'critical' as const,
    timestamp: 'Dzisiaj, 11:42',
    durationSeconds: 48,
    botConnectedSeconds: 38,
    scriptUsed: 'Pełny sprzeciw RODO i art. 398 PKE',
    status: 'objection_delivered' as const,
    complaintFiled: false,
    downloadedLocally: false,
    deletedFromServer: false,
    cloudSyncedProvider: null,
    serverRetentionExpiry: 'Za 29 dni (aktywny abonament)'
  },
  {
    id: 'call-102',
    callerNumber: '+48 71 889 02 11',
    callerName: 'Teleankieter Ubezpieczenia',
    spamCategory: 'Marketing bezpośredni bez zgody',
    spamRisk: 'high' as const,
    timestamp: 'Wczoraj, 16:15',
    durationSeconds: 22,
    botConnectedSeconds: 15,
    scriptUsed: 'Krótka odmowa z zakazem kontaktu',
    status: 'caller_hung_up' as const,
    complaintFiled: true,
    downloadedLocally: true,
    downloadTimestamp: 'Wczoraj, 16:20',
    deletedFromServer: false,
    cloudSyncedProvider: 'google-drive' as const,
    cloudSyncTimestamp: 'Wczoraj, 16:21',
    serverRetentionExpiry: 'Za 28 dni (aktywny abonament)'
  },
  {
    id: 'call-103',
    callerNumber: '+48 12 340 99 22',
    callerName: 'Pożyczki / Kredyty Bot',
    spamCategory: 'Automat (Robocall)',
    spamRisk: 'critical' as const,
    timestamp: '25 paź, 09:30',
    durationSeconds: 32,
    botConnectedSeconds: 30,
    scriptUsed: 'Automatyczna odpowiedź Bota',
    status: 'recorded_full' as const,
    complaintFiled: false,
    downloadedLocally: true,
    downloadTimestamp: '25 paź, 09:35',
    deletedFromServer: true,
    deletedFromServerTimestamp: '25 paź, 09:36 (Tryb Zero-Storage)',
    cloudSyncedProvider: null,
    serverRetentionExpiry: 'Trwale usunięte z serwera (Tylko w telefonie)'
  }
];

export const DEFAULT_RETENTION_SETTINGS = {
  subscriptionActive: true,
  retentionDays: 30,
  deleteImmediatelyAfterLocalSave: false,
  defaultCloudProvider: 'google-drive' as const,
  autoBackupToCloud: false
};

