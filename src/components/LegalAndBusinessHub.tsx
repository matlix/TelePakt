import React, { useState } from 'react';
import { AppNameOption } from '../types';
import {
  Scale, Shield, TrendingUp, FileText, CheckCircle2, AlertTriangle,
  Download, Copy, Check, DollarSign, Users, Award, BookOpen,
  ArrowRight, Landmark, Lock, HelpCircle, ExternalLink, Zap
} from 'lucide-react';

interface LegalAndBusinessHubProps {
  appName: AppNameOption;
  onOpenSimulator?: () => void;
  onOpenAnimation?: () => void;
}

type HubTab = 'analysis_legal' | 'analysis_business' | 'terms_of_service' | 'privacy_policy' | 'rodo_clause' | 'user_manual';

export const LegalAndBusinessHub: React.FC<LegalAndBusinessHubProps> = ({
  appName,
  onOpenSimulator,
  onOpenAnimation,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('analysis_legal');
  const [copiedDoc, setCopiedDoc] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDoc(id);
    setTimeout(() => setCopiedDoc(null), 3000);
  };

  const handleDownloadTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Document texts ---

  const termsOfServiceText = `REGULAMIN ŚWIADCZENIA USŁUG DROGĄ ELEKTRONICZNĄ SERWISU I APLIKACJI TELEPAKT (telepakt.pl)
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
3. Użytkownik ponosi pełną odpowiedzialność za wykorzystanie zgromadzonych nagrań, w szczególności za ich ewentualne publiczne rozpowszechnianie bez zgody rozmówcy (co może stanowić naruszenie dóbr osobistych z art. 23 i 24 Kodeksu cywilnego). Rekomendowanym i prawnie chronionym przeznaczeniem nagrania jest wykorzystanie go w postępowaniu przed organami ścigania, sądami lub organami nadzorczymi (UKE, UODO).

§ 4. WARUNKI TECHNICZNE
1. Do prawidłowego działania Aplikacji wymagane jest:
   a) Posiadanie urządzenia z systemem Android (wersja 10.0+) lub iOS (wersja 15.0+);
   b) Aktywna karta SIM z włączoną przez operatora telekomunikacyjnego obsługą połączeń konferencyjnych (tzw. połączenia trójstronne / telekonferencja);
   c) Dostęp do sieci Internet (LTE/5G/Wi-Fi) na potrzeby synchronizacji statusu i pobierania certyfikatów.

§ 5. PŁATNOŚCI I SUBSKRYPCJE
1. Korzystanie z Aplikacji w wersji podstawowej (do 3 interwencji miesięcznie) jest bezpłatne.
2. Dostęp do pakietu PRO (nielimitowane interwencje, certyfikaty SHA-256, własny klon głosu, integracja z chmurą) realizowany jest w modelu subskrypcyjnym (miesięcznym lub rocznym) zgodnie z aktualnym Cennikiem w Aplikacji.
3. Konsument ma prawo odstąpić od umowy zawartej na odległość w terminie 14 dni bez podawania przyczyny, chyba że wyraził wyraźną zgodę na rozpoczęcie świadczenia usługi przed upływem tego terminu.

§ 6. REKLAMACJE I KONTAKT
1. Wszelkie reklamacje dotyczące funkcjonowania Aplikacji można zgłaszać pod adresem: kontakt@telepakt.pl.
2. Usługodawca rozpatruje reklamację w terminie 14 dni od dnia jej otrzymania.`;

  const privacyPolicyText = `POLITYKA PRYWATNOŚCI I KLAUZULA OCHRONY DANYCH OSOBOWYCH (telepakt.pl)
Ochrona prywatności i procedura „Zero-Storage”

1. ADMINISTRATOR DANYCH
Administratorem danych osobowych Użytkowników serwisu telepakt.pl oraz aplikacji TelePakt jest TelePakt Polska.
Kontakt w sprawach związanych z danymi: iod@telepakt.pl.

2. JAKIE DANE PRZETWARZAMY?
a) Dane konta Użytkownika: adres e-mail, identyfikator użytkownika, typ subskrypcji;
b) Dane techniczne połączenia: data, godzina nawiązania połączenia, czas trwania, numer dzwoniący (caller ID) – wyłącznie w celach technicznej realizacji telekonferencji i wystawienia certyfikatu dowodowego;
c) Pliki audio z nagrań rozmów: przetwarzane wyłącznie na bezpośrednie polecenie Użytkownika.

3. UNIKALNA PROCEDURA „ZERO-STORAGE” (BEZWZGLĘDNA PRYWATNOŚĆ)
Aplikacja TelePakt została zaprojektowana zgodnie z zasadą Privacy by Design (art. 25 RODO):
- Po zakończeniu połączenia i pobraniu pliku audio przez telefon Użytkownika, serwer może natychmiast trwale usunąć plik audio z chmury (opcja Zero-Storage włączona domyślnie lub jednym kliknięciem).
- Jeżeli Użytkownik wybierze opcję archiwizacji chmurowej, plik przechowywany jest przez maksymalnie 30 dni w szyfrowanym magazynie (AES-256), po czym ulega automatycznemu, nieodwracalnemu skasowaniu.
- Żaden pracownik ani podmiot trzeci nie ma wglądu do treści nagrań Użytkownika.

4. PODSTAWA PRAWNA PRZETWARZANIA
- Art. 6 ust. 1 lit. b RODO – niezbędność do wykonania umowy o świadczenie usługi telekomunikacyjnej;
- Art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes Administratora (ochrona przed nadużyciami, realizacja prawa obrony przed roszczeniami);
- Motyw 18 RODO (Zwolnienie domowe): Zgodnie z motywem 18 RODO przetwarzanie danych przez osobę fizyczną w działalności czysto osobistej lub domowej (w tym nagranie rozmówcy naruszającego spokój) wyłączone jest spod rygorów nakładanych na administratorów komercyjnych.

5. ODBIORCY DANYCH
Dane telemetryczne połączeń przekazywane są wyłącznie licencjonowanym operatorom telekomunikacyjnym (SIP trunking providers, np. Twilio Ireland Ltd.) w minimalnym zakresie niezbędnym do zestawienia telekonferencji.

6. PRAWA UŻYTKOWNIKA
Użytkownik posiada prawo dostępu do swoich danych, ich sprostowania, żądania ich usunięcia („prawo do bycia zapomnianym”), ograniczenia przetwarzania oraz przenoszenia danych.`;

  const rodoClauseText = `KLAUZULA INFORMACYJNA DLA ROZMÓWCÓW (ART. 13 i 14 RODO)
Do wykorzystania w procedurze zgłoszenia naruszenia do Prezesa UODO / UKE

Zgodnie z art. 13 ust. 1 i 2 oraz art. 14 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO):
1. Podmiot dzwoniący (agencja telemarketingowa / call center / zlecający kampanię) jest Administratorem Danych Osobowych w zakresie numeru telefonu abonenta, na który wykonano połączenie.
2. Zgodnie z art. 398 ust. 1 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE), używanie telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących dla celów marketingu bezpośredniego wymaga uprzedniej, wyraźnej zgody abonenta lub użytkownika końcowego.
3. Wobec braku uprzedniej zgody, przetwarzanie numeru telefonu nastąpiło bez podstawy prawnej z art. 6 ust. 1 RODO.
4. Złożenie przez abonenta oświadczenia za pośrednictwem systemu TelePakt stanowi:
   a) Sprzeciw wobec przetwarzania danych w celach marketingu bezpośredniego na podstawie art. 21 ust. 2 RODO (skutkujący bezwzględnym zakazem dalszego przetwarzania numeru w celach marketingowych);
   b) Żądanie niezwłocznego usunięcia danych ze wszystkich zbiorów danych i systemów CRM na podstawie art. 17 ust. 1 lit. d RODO;
   c) Wniosek o udzielenie informacji o źródle pozyskania danych na podstawie art. 15 ust. 1 lit. g RODO.
5. Naruszenie powyższych praw stanowi podstawę do nałożenia administracyjnej kary pieniężnej przez Prezesa UODO (do 20 mln EUR lub 4% obrotu) oraz przez Prezesa UKE na podstawie art. 445 PKE (do 3% przychodu lub 1 000 000 PLN).`;

  const userManualText = `OFICJALNA INSTRUKCJA UŻYTKOWANIA APLIKACJI TELEPAKT (telepakt.pl)
Przewodnik szybkiego startu dla sieci Play, Plus, Orange i T-Mobile

KROK 1: WŁĄCZENIE POŁĄCZEŃ TRÓJSTRONNYCH (TELEKONFERENCJI) U OPERATORA
Aplikacja TelePakt działa w niezawodnej architekturze 3-way conference. Większość polskich operatorów ma tę funkcję włączoną domyślnie. Jeśli nie:
• ORANGE: Włącz usługę w aplikacji „Mój Orange” lub wpisz kod: *110*00# i zatwierdź zieloną słuchawką.
• PLAY: Funkcja jest domyślnie aktywna na wszystkich kartach SIM (abonament i na kartę). W razie wątpliwości sprawdź w aplikacji „Play24”.
• PLUS: Aktywuj w aplikacji „iPlus” lub zadzwoń pod bezpłatny numer obsługi klienta.
• T-MOBILE: Aktywuj w aplikacji „Mój T-Mobile” w zakładce „Usługi dodatkowe -> Połączenia konferencyjne”.

KROK 2: ODEBRANIE POŁĄCZENIA OD TELEMARKETERA
1. Gdy dzwoni natrętny numer, odbierz połączenie normalnie.
2. Gdy słyszysz, że to oferta handlowa (fotowoltaika, garnki, inwestycje, telekomunikacja), dotknij pływającego suwaka TelePakt na ekranie (lub otwórz aplikację TelePakt).
3. Wybierz odpowiednią formułę (np. „Telemarketer – Pełny sprzeciw art. 398 PKE”).

KROK 3: DOŁĄCZENIE BOTA I ROZŁĄCZENIE
• NA IPHONE: Telefon zadzwoni na Twój dedykowany numer chmurowy TelePakt. Na ekranie iPhone'a kliknij przycisk „Połącz rozmowy” (Merge calls).
• NA ANDROID: Jeśli TelePakt jest ustawiony jako domyślny dialer, połączenie zostanie połączone w konferencję całkowicie automatycznie!
• Bot oficjalnym tonem odczyta formułę prawną.
• Telemarketer w 95% przypadków rozłącza się sam w ciągu 10-25 sekund.
• Jeśli wybrałeś opcję „Automatyczne rozłączenie”, TelePakt sam zakończy rozmowę po wygłoszeniu formuły.

KROK 4: CERTYFIKAT I ZERO-STORAGE
• Po zakończeniu połączenia otrzymasz powiadomienie: „Rozmowa zabezpieczona”.
• Możesz pobrać certyfikat dowodowy dla UKE z sumą SHA-256.
• W opcjach możesz jednym kliknięciem wybrać „Pobierz na telefon i skasuj z serwera” (procedura Zero-Storage).`;

  return (
    <div className="space-y-8">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Scale className="w-3.5 h-3.5" />
              <span>Centrum Prawne, Analiza Rynkowa i Oficjalna Dokumentacja</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Analiza Legalności, Potencjał Biznesowy i Dokumenty TelePakt
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Kompleksowe opracowanie prawne (art. 308 K.p.c., art. 398 PKE 2024, orzecznictwo SN), kalkulacja rentowności i marż VoIP, analiza konkurencji oraz komplet gotowych dokumentów: Regulamin, Polityka Prywatności z Zero-Storage, Klauzule RODO i Instrukcja Obsługi.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAnimation}
              className="px-4 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-md shadow-cyan-600/10 flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Zobacz Animację (TikTok/YT)</span>
            </button>
            <button
              onClick={onOpenSimulator}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <span>Symulator Rozmowy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => setActiveTab('analysis_legal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'analysis_legal'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>1. Analiza Prawna & Legalność w Polsce</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis_business')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'analysis_business'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span>2. Analiza Biznesowa, Ceny i Rynek (TAM/SAM)</span>
        </button>

        <button
          onClick={() => setActiveTab('terms_of_service')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'terms_of_service'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>3. Regulamin Serwisu (ToS)</span>
        </button>

        <button
          onClick={() => setActiveTab('privacy_policy')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'privacy_policy'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-indigo-400" />
          <span>4. Polityka Prywatności & Zero-Storage</span>
        </button>

        <button
          onClick={() => setActiveTab('rodo_clause')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'rodo_clause'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4 text-rose-400" />
          <span>5. Klauzula RODO (Art. 13/14)</span>
        </button>

        <button
          onClick={() => setActiveTab('user_manual')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
            activeTab === 'user_manual'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <span>6. Instrukcja Obsługi (Play/Orange/Plus/T-Mobile)</span>
        </button>
      </div>

      {/* Tab 1: Comprehensive Legal Analysis */}
      {activeTab === 'analysis_legal' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Nagrywanie własnej rozmowy jest w 100% legalne
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Art. 267 § 3 Kodeksu karnego (podsłuch) dotyczy <strong>wyłącznie osób trzecich</strong> („kto nie będąc do tego uprawnionym uzyskuje dostęp...”). Uczestnik rozmowy jest jej bezpośrednim odbiorcą, więc nie popełnia przestępstwa podsłuchu.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Moc dowodowa: Art. 308 K.p.c. & Sąd Najwyższy
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sąd Najwyższy w wyrokach (m.in. <strong>II CSK 478/15</strong> oraz <strong>I UK 156/15</strong>) jednoznacznie uznał dopuszczalność dowodu z nagrania dokonanego przez jednego z rozmówców, szczególnie w celu wykazania bezprawności działania drugiej strony.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Kara do 1 000 000 zł z PKE (Nowość 2024/2025)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Od 10 listopada 2024 r. obowiązuje ustawa <strong>Prawo komunikacji elektronicznej (art. 398)</strong>. Za telemarketing bez uprzedniej zgody Prezes UKE nakłada karę do 3% rocznego przychodu lub do 1 mln zł (art. 445 PKE).
              </p>
            </div>
          </div>

          {/* Detailed Legal Analysis Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              <span>Szczegółowa Analiza Prawna Aplikacji TelePakt na Terytorium RP</span>
            </h3>

            <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  1. Kwestia przestępstwa podsłuchu (Art. 267 Kodeksu karnego)
                </h4>
                <p className="text-xs text-slate-300">
                  Zgodnie z ugruntowanym orzecznictwem Sądu Najwyższego (np. postanowienie SN z dnia 27 kwietnia 2016 r., sygn. akt III KK 265/16), <strong>osoba biorąca udział w rozmowie nie jest sprawcą przestępstwa z art. 267 § 3 k.k.</strong>, gdyż informacja została jej zakomunikowana bezpośrednio przez drugą stronę. TelePakt łączy bota w formie telekonferencji, a użytkownik od początku uczestniczy w połączeniu.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  2. Nowe Prawo komunikacji elektronicznej (PKE) z 12 lipca 2024 r. (obowiązuje od 10.11.2024)
                </h4>
                <p className="text-xs text-slate-300">
                  Artykuł 398 ust. 1 PKE zamknął dotychczasowe luki prawne: <em>„Zakazane jest używanie telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących dla celów marketingu bezpośredniego lub przesyłania niezamówionej informacji handlowej do abonenta lub użytkownika końcowego, chyba że uprzednio wyraził on na to zgodę.”</em>
                  Dzwonienie z pytaniem „czy wyraża Pan zgodę na przedstawienie oferty” jest <strong>już samo w sobie nielegalne</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  3. Ochrona Danych Osobowych i Sprzeciw RODO (Art. 21 i 17 RODO)
                </h4>
                <p className="text-xs text-slate-300">
                  Na podstawie art. 21 ust. 2 RODO, osoba której dane dotyczą ma prawo w dowolnym momencie wnieść <strong>bezwzględny sprzeciw</strong> wobec przetwarzania jej danych w celach marketingu bezpośredniego. Z chwilą wniesienia sprzeciwu administratorowi nie wolno już przetwarzać tych danych. Z kolei art. 17 nakazuje ich trwałe skasowanie (prawo do bycia zapomnianym).
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  4. Ważność oświadczenia woli odtwarzanego przez automat (Art. 60 Kodeksu cywilnego)
                </h4>
                <p className="text-xs text-slate-300">
                  Zgodnie z art. 60 K.c. wola osoby dokonującej czynności prawnej może być wyrażona przez każde zachowanie się tej osoby, które ujawnia jej wolę w sposób dostateczny, w tym również przez ujawnienie tej woli w postaci elektronicznej. Uruchomienie bota odtwarzającego nagraną formułę sprzeciwu stanowi <strong>pełnoprawne, wiążące oświadczenie woli</strong> złożone telemarketerowi.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  5. Granice dozwolonego użytku i ochrona dóbr osobistych (Art. 23 i 24 K.c.)
                </h4>
                <p className="text-xs text-slate-300">
                  Zarejestrowane nagranie <strong>nie może być upubliczniane</strong> w mediach społecznościowych (np. z ujawnieniem imienia, nazwiska czy intymnych danych telemarketera), chyba że jego głos i tożsamość zostaną zanonimizowane. Nagranie wolno bez żadnych ograniczeń przedstawić jako dowód w Urzędzie Komunikacji Elektronicznej (UKE), Urzędzie Ochrony Danych Osobowych (UODO) lub w sądzie.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Commercial & Business Analysis */}
      {activeTab === 'analysis_business' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Całkowity Rynek w PL (TAM)
              </span>
              <div className="text-2xl font-black text-white">25-28 mln</div>
              <p className="text-[11px] text-slate-400">
                Aktywnych smartfonów w Polsce (92% dorosłych odbiera spam telefoniczny)
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                Rynek Dostępny (SAM)
              </span>
              <div className="text-2xl font-black text-cyan-300">4,5 - 6,0 mln</div>
              <p className="text-[11px] text-slate-400">
                Przedsiębiorcy w CEIDG, seniorzy, osoby prywatne szukające ochrony
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                Cel Pozyskania (SOM - 2 lata)
              </span>
              <div className="text-2xl font-black text-emerald-300">80k - 120k</div>
              <p className="text-[11px] text-slate-400">
                Płatnych abonentów PRO (1,5-2% SAM) = <strong>1,2 - 1,8 mln zł MRR</strong>
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                Marża Brutto na Połączeniu
              </span>
              <div className="text-2xl font-black text-amber-300">&gt; 92%</div>
              <p className="text-[11px] text-slate-400">
                Koszt SIP Twilio to ~0,05 zł / rozmowę vs 14,99 zł/mies. zysku
              </p>
            </div>
          </div>

          {/* Why Standard Blocklists Fail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>Dlaczego Zwykłe Pasywne Blokery Zawodzą?</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-2">
                <span className="text-red-400 font-bold uppercase tracking-wider block">
                  Tradycyjne Aplikacje Pasywne – Przestarzały Model
                </span>
                <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                  <li><strong>CLI Spoofing</strong>: Call center podstawiają co godzinę nowe, losowe numery polskich komórek. Zanim jakakolwiek baza zaktualizuje numer, wykonano już 10 000 połączeń.</li>
                  <li><strong>Brak usunięcia z CRM</strong>: Odrzucenie połączenia powoduje, że system telemarketera ustawia status „Nie odebrano – ponów za 2 godziny”. Telemarketer zadzwoni jutro z innego numeru.</li>
                  <li><strong>Brak sankcji</strong>: Dzwoniący nie ponosi żadnych konsekwencji ani ryzyka kary.</li>
                </ul>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider block">
                  TelePakt (telepakt.pl) – Aktywna Tarcza Prawna
                </span>
                <ul className="space-y-1.5 text-slate-300 list-disc pl-4">
                  <li><strong>Uderzenie w bazę CRM</strong>: Odtworzenie formuły prawnej zmusza telemarketera do oznaczenia numeru statusem „ZAKAZ KONTAKTU / SPRZECIW RODO”, by uniknąć kary.</li>
                  <li><strong>Realna kara do 1 mln zł</strong>: Podanie art. 398 PKE paraliżuje konsultanta – wie, że nagranie może trafić do UKE i narazić firmę na wielkie straty.</li>
                  <li><strong>Certyfikat dowodowy</strong>: Aplikacja generuje gotowy wniosek ze znacznikiem czasu i sumą SHA-256.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pricing Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Porównanie Rynkowe i Przewaga Technologiczna TelePakt</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono">
                    <th className="py-3 px-4">Kategoria Rozwiązania</th>
                    <th className="py-3 px-4">Średnia Cena</th>
                    <th className="py-3 px-4">Usuwanie z CRM</th>
                    <th className="py-3 px-4">Polska Ustawa PKE 2024</th>
                    <th className="py-3 px-4">Protokół Dowodowy UKE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Zwykłe Pasywne Czarne Listy</td>
                    <td className="py-3 px-4">15,99 - 24,99 zł</td>
                    <td className="py-3 px-4 text-red-400">NIE (tylko lokalna czarna lista)</td>
                    <td className="py-3 px-4 text-red-400">BRAK</td>
                    <td className="py-3 px-4 text-red-400">BRAK</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Zagraniczne Aplikacje Antyspamowe</td>
                    <td className="py-3 px-4">~25 - 40 zł</td>
                    <td className="py-3 px-4 text-amber-400">Niedostosowane do polskiego prawa</td>
                    <td className="py-3 px-4 text-red-400">BRAK (tylko prawo USA FTC)</td>
                    <td className="py-3 px-4 text-red-400">BRAK</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">Tradycyjne Aplikacje Nagrywające</td>
                    <td className="py-3 px-4">39,99 - 59,99 zł</td>
                    <td className="py-3 px-4 text-red-400">BRAK (brak aspektu prawnego)</td>
                    <td className="py-3 px-4 text-red-400">BRAK</td>
                    <td className="py-3 px-4 text-red-400">BRAK</td>
                  </tr>
                  <tr className="bg-indigo-950/30 border-l-4 border-cyan-400">
                    <td className="py-3 px-4 font-black text-cyan-300 flex items-center gap-1.5">
                      <span>TelePakt PRO (telepakt.pl)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">NASZA OFERTA</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">14,99 zł / mies. (lub 119 zł/rok)</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">TAK (wymuszony sprzeciw RODO)</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">TAK (Art. 398 & 445 PKE)</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">TAK (WAV + SHA-256 PDF)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Unit Economics Breakdown */}
            <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Kalkulacja Kosztu Połączenia (Twilio / Plivo SIP Trunking):
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Średni koszt minuty telekonferencji SIP w Polsce wynosi ok. $0.012 (~0,05 PLN). Średnia interwencja trwa 35 sekund (1 minuta bilingowa). Użytkownik odbiera średnio 10-15 spamów w miesiącu. Koszt serwerowy telekomunikacji wynosi zaledwie <strong>~0,60 zł / użytkownika / miesiąc</strong>. Przy cenie abonamentu PRO równej <strong>14,99 zł</strong> marża brutto przekracza <strong>92%</strong>!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Terms of Service */}
      {activeTab === 'terms_of_service' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Regulamin Świadczenia Usług Drogą Elektroniczną
              </h3>
              <p className="text-xs text-slate-400">
                Wersja gotowa do wdrożenia na stronie telepakt.pl (zgodna z ustawą PKE i prawami konsumenta)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(termsOfServiceText, 'tos')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedDoc === 'tos' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDoc === 'tos' ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
              <button
                onClick={() => handleDownloadTxt('regulamin_telepakt.txt', termsOfServiceText)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz TXT</span>
              </button>
            </div>
          </div>

          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-950 p-5 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed">
            {termsOfServiceText}
          </pre>
        </div>
      )}

      {/* Tab 4: Privacy Policy & Zero-Storage */}
      {activeTab === 'privacy_policy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Polityka Prywatności & Ochrony Danych Osobowych
              </h3>
              <p className="text-xs text-slate-400">
                Zawiera procedurę Zero-Storage, brak profilowania oraz 30-dniową retencję
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(privacyPolicyText, 'privacy')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedDoc === 'privacy' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDoc === 'privacy' ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
              <button
                onClick={() => handleDownloadTxt('polityka_prywatnosci_telepakt.txt', privacyPolicyText)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz TXT</span>
              </button>
            </div>
          </div>

          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-950 p-5 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed">
            {privacyPolicyText}
          </pre>
        </div>
      )}

      {/* Tab 5: RODO Clause */}
      {activeTab === 'rodo_clause' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Klauzula Informacyjna RODO (Art. 13 & 14)
              </h3>
              <p className="text-xs text-slate-400">
                Wzorzec prawny do skargi do Prezesa UODO oraz wezwania agencji marketingu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(rodoClauseText, 'rodo')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedDoc === 'rodo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDoc === 'rodo' ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
              <button
                onClick={() => handleDownloadTxt('klauzula_rodo_telepakt.txt', rodoClauseText)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz TXT</span>
              </button>
            </div>
          </div>

          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-950 p-5 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed">
            {rodoClauseText}
          </pre>
        </div>
      )}

      {/* Tab 6: User Manual */}
      {activeTab === 'user_manual' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">
                Oficjalna Instrukcja Użytkowania dla Klientów
              </h3>
              <p className="text-xs text-slate-400">
                Szczegółowa instrukcja konfiguracji telekonferencji w sieciach Play, Plus, Orange i T-Mobile
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(userManualText, 'manual')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedDoc === 'manual' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedDoc === 'manual' ? 'Skopiowano' : 'Kopiuj'}</span>
              </button>
              <button
                onClick={() => handleDownloadTxt('instrukcja_uzytkowania_telepakt.txt', userManualText)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Pobierz TXT</span>
              </button>
            </div>
          </div>

          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans bg-slate-950 p-5 rounded-xl border border-slate-800 max-h-[500px] overflow-y-auto leading-relaxed">
            {userManualText}
          </pre>
        </div>
      )}

    </div>
  );
};
