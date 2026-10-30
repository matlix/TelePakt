import { UseCaseDefinition } from '../types';

export const EXPANDED_USE_CASES: UseCaseDefinition[] = [
  {
    id: 'bank-fraud-defense',
    title: 'Tarcza na Oszusta Bankowego (Anti-Spoofing & Spoofed Bank Trap)',
    targetUser: 'Wszyscy obywatele, w szczególności osoby starsze oraz klienci bankowości online',
    tagline: 'Jedno kliknięcie suwaka rozbraja fałszywego „konsultanta ds. bezpieczeństwa banku”',
    iconName: 'ShieldAlert',
    category: 'bank-fraud',
    problem: 'Najgroźniejsze oszustwo w Polsce (vishing): przestępcy podszywają się pod numer infolinii PKO BP, mBanku, Santandera czy ING i nakłaniają do instalacji AnyDesk lub podania kodu BLIK.',
    solution: 'Suwak uruchamia oficjalną procedurę weryfikacyjną: żąda powiadomienia PUSH w aplikacji bankowej i oświadcza o rejestracji audio. Prawdziwy bank wyśle PUSH; oszust natychmiast rzuca słuchawką.',
    legalBasis: 'Art. 286 Kodeksu karnego (Oszustwo), Prawo bankowe, Rekomendacje KNF w sprawie uwierzytelniania transakcji',
    scriptPreview: 'Weryfikacja bezpieczeństwa bankowego: Ta rozmowa jest rejestrowana. Zgodnie z procedurą weryfikacji tożsamości pracownika banku, proszę o natychmiastowe wysłanie autoryzacyjnego powiadomienia PUSH w mojej oficjalnej aplikacji bankowej...',
    revenuePotential: 'very_high',
    realWorldScenario: 'Dzwoni telefon z numeru banku: „Pani Anno, ktoś wziął na Panią pożyczkę na 30 000 zł, musimy zabezpieczyć środki!”. Anna zamiast panikować przesuwa suwak „Weryfikacja Bankowa”. Oszust wie, że jest nagrywany i nie ma szans.',
    keyBenefits: [
      'Ratunek przed utratą oszczędności życia',
      'Usuwa psychologiczny szok i panikę u ofiary (to bot mówi zimnym tonem)',
      'Nagranie stanowi gotowy dowód dla Policji (Wydział Cyberprzestępczości)'
    ]
  },
  {
    id: 'debt-collector-shield',
    title: 'Obrona Praw Dłużnika (Nielegalna Windykacja & Przedawnienie)',
    targetUser: 'Osoby nękane przez firmy windykacyjne za przedawnione, sporne lub cudze długi',
    tagline: 'Zablokuj nękanie psychiczne i przenieś sprawę wyłącznie na drogę oficjalnej poczty',
    iconName: 'Scale',
    category: 'debt-collector',
    problem: 'Windykatorzy dzwonią o 6:00 rano lub 21:00, straszą komornikiem bez wyroku sądu, nagabują za cudze długi i żądają spłaty przedawnionych roszczeń.',
    solution: 'Formuła prawna wzywa do zaprzestania kontaktu telefonicznego pod rygorem art. 190a K.k. (stalking), podnosi zarzut przedawnienia (art. 117 K.c.) i nakazuje korespondencję wyłącznie pisemną.',
    legalBasis: 'Art. 190a Kodeksu karnego (uporczywe nękanie), Art. 117 i 118 Kodeksu cywilnego (zarzut przedawnienia)',
    scriptPreview: 'Żądam zaniechania kontaktu telefonicznego. Na podstawie art. 190a Kodeksu karnego ostrzegam, że natarczywe telefony noszą znamiona nękania. Na podstawie art. 117 K.c. podnoszę zarzut przedawnienia...',
    revenuePotential: 'high',
    realWorldScenario: 'Firma windykacyjna kupiła stary pakiet przedawnionych długów telefonicznych sprzed 8 lat i dzwoni 5 razy dziennie. Uruchomienie suwaka ucisza telefony natychmiast.',
    keyBenefits: [
      'Koniec zastraszania przez telefon',
      'Skuteczne podniesienie zarzutu przedawnienia z datą i godziną',
      'Podstawa do skargi do UOKiK i zawiadomienia do Prokuratury'
    ]
  },
  {
    id: 'b2b-contract-lock',
    title: 'Ustna Umowa Biznesowa & Zabezpieczenie Zlecenia (B2B & Freelance)',
    targetUser: 'Programiści, graficy, wykonawcy budowlani, mechanicy, agencje, prawnicy, handlowcy',
    tagline: 'Koniec z „przecież umawialiśmy się na coś innego”. Zamień rozmowę w wiążącą notatkę.',
    iconName: 'Briefcase',
    category: 'b2b-agreement',
    problem: 'Klienci zmieniają zdanie po telefonie: „Nie mówiłem, że zapłacę za poprawki”, „Cena miała być brutto, nie netto”, „Miał Pan skończyć do piątku”. Brak dowodu ustaleń telefonicznych to plaga polskiego biznesu.',
    solution: 'W trakcie dogadywania szczegółów klikasz suwak „Zabezpieczenie ustaleń”. Bot ogłasza rejestrację kluczowych warunków zlecenia na gruncie art. 66 K.c. i generuje transkrypcję audio.',
    legalBasis: 'Art. 66 i 72 Kodeksu cywilnego (zawarcie umowy drogą ustną), Art. 308 K.p.c. (dowód z nagrania)',
    scriptPreview: 'Informuję, że niniejsza rozmowa jest rejestrowana za obopólną zgodą w celu sporządzenia wiążącej notatki oraz potwierdzenia ustaleń handlowych, zakresu prac i wyceny zgodnie z Kodeksem cywilnym...',
    revenuePotential: 'very_high',
    realWorldScenario: 'Wykonawca remontu ustala z inwestorem przez telefon: „Za kucie tych kafelków będzie dodatkowo 1500 zł”. Włącza suwak – klient potwierdza do słuchawki. Zero sporów przy rozliczeniu.',
    keyBenefits: [
      'Gwarancja zapłaty za dodatkowe prace i nadgodziny',
      'Zmniejsza liczbę sporów sądowych o 90%',
      'Klient widzi profesjonalizm i nie kombinuje przy fakturze'
    ]
  },
  {
    id: 'harassment-stalking-shield',
    title: 'Tarcza Ochronna Przed Stalkingiem & Toksycznym Kontaktem',
    targetUser: 'Kobiety i mężczyźni nękani przez byłych partnerów, natrętnych sąsiadów, stalkerów',
    tagline: 'Oficjalny dowód braku zgody na kontakt niezbędny do uzyskania zakazu zbliżania',
    iconName: 'UserX',
    category: 'harassment-stalking',
    problem: 'Policja często umarza sprawy o stalking (art. 190a K.k.), twierdząc, że „ofiara odbierała i rozmawiała, więc nie ma dowodu, że zakazała kontaktu w sposób stanowczy”.',
    solution: 'Jedno kliknięcie odtwarza chłodną, jednoznaczną formułę prawną zakazującą jakichkolwiek prób kontaktu pod rygorem karnym. System zapisuje plik audio z sumą kontrolną dla Prokuratury.',
    legalBasis: 'Art. 190a § 1 Kodeksu karnego (kara pozbawienia wolności od 6 miesięcy do 8 lat)',
    scriptPreview: 'Oświadczam stanowczo, że żądam natychmiastowego zaprzestania jakichkolwiek prób kontaktu ze mną. Kontynuowanie połączeń stanowi przestępstwo stalkingu z art. 190a Kodeksu karnego...',
    revenuePotential: 'high',
    realWorldScenario: 'Toksyczny były partner wydzwania w nocy. Zamiast wdawać się w płacz lub awantury, ofiara klika suwak. Oficjalny głos lektora wygłasza rygor karny. Zgłoszenie na Policji jest nie do podważenia.',
    keyBenefits: [
      'Ochrona psychiczna (nie musisz z nim/nią rozmawiać)',
      'Niezbędny wymóg formalny do złożenia wniosku z art. 190a K.k.',
      'Szybkie uzyskanie sądowego zakazu kontaktowania się i zbliżania'
    ]
  },
  {
    id: 'consumer-warranty-complaint',
    title: 'Oficjalna Reklamacja Konsumencka (Rękojmia & Zgłoszenie do Operatora)',
    targetUser: 'Konsumenci walczący z korporacjami (operatorzy komórkowi, ubezpieczyciele, linie lotnicze)',
    tagline: 'Uruchom bieg 14-dniowego terminu rozpatrzenia reklamacji prosto z telefonu',
    iconName: 'Receipt',
    category: 'consumer-complaint',
    problem: 'Infolinie korporacji „gubią” zgłoszenia telefoniczne, twierdząc: „w systemie nie ma śladu, że zgłaszał Pan awarię w zeszłym miesiącu”. Klient traci uprawnienia i pieniądze.',
    solution: 'Naciskasz suwak „Zgłoszenie Reklamacji”. Bot wypowiada oficjalną formułę wszczęcia procedury reklamacyjnej z art. 7a ustawy o prawach konsumenta. Jeśli firma nie odpowie w 14 dni – reklamacja jest uznana z mocy prawa!',
    legalBasis: 'Art. 7a ustawy o prawach konsumenta (milczące uznanie reklamacji po 14 dniach)',
    scriptPreview: 'Niniejszym oświadczam, że składam oficjalną reklamację z tytułu rękojmi. Bieg ustawowego 14-dniowego terminu na odpowiedź rozpoczyna się od chwili niniejszego nagranego oświadczenia...',
    revenuePotential: 'high',
    realWorldScenario: 'Internet domowy nie działa od tygodnia. Na infolinii konsultant zbywa klienta. Klient klika suwak reklamacji – od tego momentu tyka zegar 14 dni na zwrot abonamentu.',
    keyBenefits: [
      'Niepodważalny dowód zgłoszenia reklamacji w terminie',
      'Skorzystanie z zasady milczącego uznania reklamacji (brak odpowiedzi = wygrana)',
      'Koniec z wmawianiem, że „zgłoszenie nie wpłynęło”'
    ]
  },
  {
    id: 'polite-emergency-exit',
    title: 'Kulturalne Awaryjne Przerwanie Rozmowy („Fake Urgent Exit”)',
    targetUser: 'Każdy, kto bywa uwięziony w niekończących się, męczących rozmowach towarzyskich lub biznesowych',
    tagline: 'Eleganckie alibi, które ratuje Cię z 45-minutowego monologu bez urazy rozmówcy',
    iconName: 'PhoneOff',
    category: 'emergency-exit',
    problem: 'Utknąłeś na telefonie z gadatliwym współpracownikiem, natrętnym sprzedawcą lub dalekim krewnym i nie wypada Ci po prostu rzucić słuchawką.',
    solution: 'Suwak wstrzykuje do rozmowy realistyczny profesjonalny komunikat centrali: „Uwaga, zarejestrowano drugie połączenie o statusie priorytetowym / awaria techniczna centrali. Połączenie zostanie zawieszone”.',
    legalBasis: 'Etykieta biznesowa i higiena psychiczna (rozwiązanie UX/Social)',
    scriptPreview: 'Komunikat centrali telefonicznej: Uwaga, zarejestrowano drugie połączenie priorytetowe z systemu alarmowego. Połączenie zostanie automatycznie przerwane za 5 sekund...',
    revenuePotential: 'viral',
    realWorldScenario: 'Współpracownik po raz trzeci opowiada tę samą historię o urlopie, a Ty masz za 5 minut spotkanie z zarządem. Przesuwasz suwak – głośnik wydaje sygnał priorytetowy i rozłącza.',
    keyBenefits: [
      'Zero niezręczności społecznej i zepsutych relacji',
      'Wygląda jak błąd operatora sieci lub pilne wezwanie',
      'Oszczędza godziny cennego czasu każdego tygodnia'
    ]
  }
];
