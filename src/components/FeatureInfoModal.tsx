import React from 'react';
import {
  Shield,
  Scale,
  Mic,
  Clock,
  PhoneOff,
  PhoneCall,
  Lock,
  Database,
  Search,
  CheckCircle2,
  X,
  AlertTriangle,
  FileCheck2,
  Sparkles
} from 'lucide-react';

export type FeatureInfoKey =
  | 'autosprzeciw'
  | 'dowod_audio'
  | 'probne_polaczenie'
  | 'blokada_zastrzezonych'
  | 'lektor_glos'
  | 'opoznienie'
  | 'auto_hangup'
  | 'tryb_odrzucenia'
  | 'wyszukiwarka_offline'
  | 'zero_storage';

interface FeatureDetail {
  id: FeatureInfoKey;
  badge: string;
  badgeColor: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  whatIsIt: string;
  howItWorks: string[];
  legalBasis: string;
  telemarketerReaction: string;
  tip: string;
}

const FEATURE_DETAILS: Record<FeatureInfoKey, FeatureDetail> = {
  autosprzeciw: {
    id: 'autosprzeciw',
    badge: 'Tarcza Prawna • Art. 398 PKE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <Shield className="w-7 h-7 text-emerald-400" />,
    title: 'Auto-Sprzeciw (Art. 398 PKE & Art. 21 RODO)',
    subtitle: 'Automatyczne wygłoszenie formuły zdejmującej Twój numer z bazy call center',
    whatIsIt:
      'Gdy dzwoni niechciany telemarketer, asystent TelePakt natychmiast lub jednym ruchem odczytuje oficjalną, bezwzględną formułę sprzeciwu prawnego.',
    howItWorks: [
      'Asystent wita konsultanta oficjalnym, spokojnym głosem prawnym.',
      'Powołuje się na art. 398 Prawa komunikacji elektronicznej (zakaz kontaktu bez wcześniejszej zgody) oraz art. 21 RODO.',
      'Żąda natychmiastowego usunięcia Twojego numeru z systemów CRM dzwoniącego.',
      'Ostrzega konsultanta przed karą finansową nakładaną przez Prezesa UKE (do 3% przychodu lub 1 000 000 zł).'
    ],
    legalBasis:
      'Art. 398 ustawy Prawo Komunikacji Elektronicznej (PKE) oraz Art. 21 ust. 2 i 3 RODO. Sprzeciw wobec marketingu bezpośredniego ma charakter absolutny — firma nie ma prawa dalej dzwonić.',
    telemarketerReaction:
      'Konsultant w call center ma bezwzględny obowiązek systemowy oznaczyć Twój rekord jako „ZAKAZ KONTAKTU / SPRZECIW RODO”, by chronić firmę przed wielotysięcznymi karami.',
    tip: 'Nie musisz się denerwować, tłumaczyć ani wdawać w dyskusje — bot wykonuje całą procedurę za Ciebie w kilkanaście sekund.'
  },
  dowod_audio: {
    id: 'dowod_audio',
    badge: 'Kryptografia • Suma SHA-256',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: <Mic className="w-7 h-7 text-cyan-400" />,
    title: 'Dowód Audio & Suma Kontrolna SHA-256',
    subtitle: 'Niepodważalny materiał dowodowy dla Prezesa UKE i UODO',
    whatIsIt:
      'Rejestruje kluczowy fragment rozmowy (wygłoszenie formuły sprzeciwu) i zabezpiecza go unikalnym stemplem kryptograficznym w Twoim telefonie.',
    howItWorks: [
      'Podczas rozmowy zapisywane jest audio wygłoszonego oświadczenia.',
      'Aplikacja wylicza unikalną sumę kontrolną SHA-256 pliku audio.',
      'Suma SHA-256 jest wpisywana do oficjalnego zawiadomienia do Prezesa UKE / UODO.',
      'Jeżeli telemarketer skłamie, że „rozmowy nie było”, stempel dowodzi autentyczności i nienaruszenia nagrania.'
    ],
    legalBasis:
      'Art. 308 Kodeksu postępowania cywilnego (K.p.c.) dopuszcza dowody z nagrań dźwiękowych. Nagrywanie rozmowy, w której sam uczestniczysz, jest w 100% legalne w polskim prawie.',
    telemarketerReaction:
      'Obecność sumy kontrolnej SHA-256 uniemożliwia call center mataczenie lub twierdzenie, że doszło do pomyłki systemowej.',
    tip: 'Zasada Zero-Storage: Pliki audio NIGDY nie są wysyłane na nasze serwery. Wszystko pozostaje bezpiecznie w Twoim urządzeniu.'
  },
  probne_polaczenie: {
    id: 'probne_polaczenie',
    badge: 'Symulator Testowy',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    icon: <PhoneCall className="w-7 h-7 text-indigo-400" />,
    title: 'Wywołaj Próbne Połączenie Anty-Spam',
    subtitle: 'Sprawdź jak działa ochrona w bezpiecznych warunkach',
    whatIsIt:
      'Uruchamia interaktywny symulator przychodzącego połączenia od typowego spamera (fotowoltaika, fałszywa wygrana, call center).',
    howItWorks: [
      'Na ekranie pojawia się realistyczne przychodzące połączenie.',
      'Możesz odebrać, przetestować głos asystenta (Tomasz / Joanna) oraz suwaki natychmiastowych odpowiedzi.',
      'Zobaczysz jak bot przejmuje rozmowę i jak generowany jest gotowy wniosek do UKE.'
    ],
    legalBasis:
      'Środowisko testowe nie łączy z prawdziwą siecią GSM — nie ponosisz żadnych kosztów impulsów telefonicznych.',
    telemarketerReaction:
      'Pozwala zapoznać się z reakcją bota, abyś podczas prawdziwego ataku spamu czuł się w 100% pewnie.',
    tip: 'Przetestuj różne scenariusze (np. fotowoltaika z automatu lub natrętny telemarketer medyczny).'
  },
  blokada_zastrzezonych: {
    id: 'blokada_zastrzezonych',
    badge: 'Bezpieczeństwo Połączeń',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: <PhoneOff className="w-7 h-7 text-rose-400" />,
    title: 'Blokada Numerów Zastrzeżonych',
    subtitle: 'Automatyczne odrzucanie anonimowych połączeń ukrytych',
    whatIsIt:
      'Odrzuca połączenia przychodzące od osób i automatów, które maskują swój identyfikator (tzw. „Numer prywatny” lub „Zastrzeżony”).',
    howItWorks: [
      'System w ułamku sekundy wykrywa brak numeru dzwoniącego.',
      'Jeśli opcja jest aktywna, telefon nie dzwoni i nie odrywa Cię od pracy.',
      'Numer ukryty nie może zostawić spamu ani nękać powtarzającymi się dzwonkami.'
    ],
    legalBasis:
      'Zgodnie z art. 396 PKE abonent ma pełne prawo do odrzucania połączeń z zastrzeżoną prezentacją numeru.',
    telemarketerReaction:
      'Agresywne boty i nielegalne call center ukrywają numer, by uniknąć kary. Blokada zmusza ich do ujawnienia tożsamości.',
    tip: 'Jeśli czekasz na ważny telefon ze szpitala lub komendy policji (które czasem dzwonią z zastrzeżonego), możesz na ten czas wyłączyć ten przełącznik jednym kliknięciem.'
  },
  lektor_glos: {
    id: 'lektor_glos',
    badge: 'Synteza Głosu Asystenta',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: <Sparkles className="w-7 h-7 text-purple-400" />,
    title: 'Głos Asystenta Prawnego',
    subtitle: 'Mecenas Tomasz (męski) lub Radca Joanna (żeński)',
    whatIsIt:
      'Wybór profesjonalnego głosu lektorskiego, który odczytuje formułę sprzeciwu prawnego do słuchawki konsultanta.',
    howItWorks: [
      'Głos brzmi naturalnie, stanowczo i w pełni urzędowo.',
      'Dostępny w dwóch wariantach barwy głosu w zależności od Twoich preferencji.',
      'Możesz także wgrać lub nagrać własny głos w Studiu Głosu TelePakt.'
    ],
    legalBasis:
      'Oświadczenie woli może być złożone w formie ustnej przez pełnomocnika technicznego lub nagranie audio (art. 60 Kodeksu cywilnego).',
    telemarketerReaction:
      'Urzędowy ton natychmiast zmienia nastawienie telemarketera: zdaje sobie sprawę, że po drugiej stronie jest zorganizowany system prawny, a nie zdezorientowany konsument.',
    tip: 'Oba głosy czytają tę samą, prawnie wiążącą klauzulę z pełną artykulacją artykułów PKE i RODO.'
  },
  opoznienie: {
    id: 'opoznienie',
    badge: 'Czas Reakcji',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: <Clock className="w-7 h-7 text-amber-400" />,
    title: 'Opóźnienie Włączenia Formuły (0s, 3s, 5s)',
    subtitle: 'Kontrola momentu, w którym asystent zabiera głos',
    whatIsIt:
      'Określa, ile sekund po odebraniu połączenia asystent zacznie odczytywać klauzulę sprzeciwu.',
    howItWorks: [
      '0 sekund: Asystent zaczyna mówić natychmiast po podniesieniu słuchawki (idealne na znane numery botów).',
      '3 sekundy: Daje Ci czas na usłyszenie pierwszych słów („Dzień dobry, dzwonię z firmy...”) i upewnienie się, że to telemarketing.',
      '5 sekund: Dłuższy bufor na spokojną decyzję i ewentualne ręczne przerwanie.'
    ],
    legalBasis:
      'Zapewnia pewność, że sprzeciw trafia do właściwej osoby i po nawiązaniu pełnego połączenia dwustronnego.',
    telemarketerReaction:
      'Opóźnienie 3s pozwala konsultantowi rozpocząć swoją regułkę, po czym natychmiast wchodzi stanowczy głos bota prawnego.',
    tip: 'Zalecamy domyślne ustawienie 3 sekund — to złoty środek między komfortem a skutecznością.'
  },
  auto_hangup: {
    id: 'auto_hangup',
    badge: 'Automatyzacja Połączenia',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: <PhoneOff className="w-7 h-7 text-rose-400" />,
    title: 'Koniec Wypowiedzi: Auto-Rozłączenie vs Na Linii',
    subtitle: 'Decyduj, co dzieje się po wygłoszeniu formuły sprzeciwu',
    whatIsIt:
      'Przełącznik sterujący zachowaniem telefonu w momencie, gdy asystent zakończy czytanie klauzuli prawnej.',
    howItWorks: [
      'Auto-rozłącz (WŁĄCZONE): Telefon natychmiast zrywa połączenie po słowach „Do widzenia”. Telemarketer nie może wciągnąć Cię w kłótnię, a Ty nie tracisz ani sekundy.',
      'Na linii (POZOSTAŃ): Połączenie pozostaje aktywne, abyś mógł usłyszeć reakcję konsultanta lub zadać dodatkowe pytania (np. zażądać NIP firmy dzwoniącej).'
    ],
    legalBasis:
      'Skutek prawny sprzeciwu z art. 398 PKE następuje w chwili dojścia oświadczenia do wiadomości rozmówcy. Dalsza rozmowa nie jest prawnie wymagana.',
    telemarketerReaction:
      'Gdy połączenie zrywa się automatycznie po sprzeciwie, telemarketer nie ma możliwości manipulacji ani negocjacji — jedyne co może zrobić, to usunąć rekord w CRM.',
    tip: 'Włącz Auto-rozłącz, jeśli chcesz mieć święty spokój i zero kontaktu z telemarketerami.'
  },
  tryb_odrzucenia: {
    id: 'tryb_odrzucenia',
    badge: 'Przekierowanie Linii',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: <PhoneCall className="w-7 h-7 text-blue-400" />,
    title: 'Tryb Odrzucenia Połączenia',
    subtitle: 'Zwykłe odrzucenie vs Przekierowanie do bota ze sprzeciwem',
    whatIsIt:
      'Pozwala wybrać, co ma się stać, gdy na ekranie klikniesz czerwony przycisk „Odrzuć połączenie”.',
    howItWorks: [
      'Zwykłe odrzucenie: Klasyczne odrzucenie dzwonka (sygnał zajętości). Telemarketer może jednak zadzwonić ponownie za 2 godziny.',
      'Przekieruj do bota ze sprzeciwem: Zamiast sygnału zajętości, połączenie odbiera bot TelePakt, który odczytuje zakaz kontaktu z art. 398 PKE i usuwa numer z ich bazy raz na zawsze.'
    ],
    legalBasis:
      'Automatyczna sekretarka prawna działająca na prawach oświadczenia woli abonenta.',
    telemarketerReaction:
      'Zamiast kolejnej próby dodzwonienia się, telemarketer otrzymuje zakaz kontaktu pod rygorem kary UKE.',
    tip: 'Przekierowanie do bota całkowicie eliminuje ponowne dzwonienie tego samego call center.'
  },
  wyszukiwarka_offline: {
    id: 'wyszukiwarka_offline',
    badge: 'Baza Zaufania Offline',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: <Search className="w-7 h-7 text-emerald-400" />,
    title: 'Wyszukiwarka Numerów Offline',
    subtitle: 'Sprawdzanie podejrzanych numerów bez internetu i bez opłat',
    whatIsIt:
      'Wbudowana w aplikację lokalna baza tysięcy prefiksów i numerów znanych z nielegalnego telemarketingu, botów AI (np. Klara), fałszywych inwestycji i naciągaczy.',
    howItWorks: [
      'Wpisujesz numer telefonu w pole wyszukiwania.',
      'Aplikacja w 0 ms przeszukuje lokalny rejestr.',
      'Wyświetla ocenę ryzyka, wskaźnik Tellows (1-9) oraz raportowaną kategorię spamu.'
    ],
    legalBasis:
      'Jawne rejestry naruszeń i zgłoszeń konsumenckich.',
    telemarketerReaction:
      'Pozwala zidentyfikować firmę i jej faktyczny cel, zanim w ogóle odbierzesz połączenie.',
    tip: 'Działa całkowicie bez internetu — przydatne w podróży, w roamingu czy na wsi.'
  },
  zero_storage: {
    id: 'zero_storage',
    badge: 'Architektura Bezpieczeństwa',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    icon: <Lock className="w-7 h-7 text-cyan-400" />,
    title: 'Prywatność Zero-Storage',
    subtitle: 'Twoje rozmowy i dane nigdy nie opuszczają Twojego telefonu',
    whatIsIt:
      'Fundamentalna zasada architektury TelePakt: nie gromadzimy, nie przetwarzamy i nie przechowujemy Twoich rozmów na żadnych zewnętrznych serwerach.',
    howItWorks: [
      'Wszelkie nagrania i dowody audio pozostają w lokalnej pamięci Twojego urządzenia.',
      'Aplikacja nie wymaga wysyłania plików do chmury podmiotów trzecich.',
      'Tylko Ty decydujesz, czy wyeksportować zawiadomienie do UKE w formacie PDF/ZIP.'
    ],
    legalBasis:
      'Zasada minimalizacji danych (art. 5 ust. 1 lit. c RODO) oraz ochrona tajemnicy telekomunikacyjnej (art. 387 PKE).',
    telemarketerReaction:
      'Nikt poza Tobą i ewentualnie organem ścigania (UKE/UODO) nie ma dostępu do materiału dowodowego.',
    tip: 'Pełna anonimowość i 100% kontroli nad własnymi danymi.'
  }
};

interface FeatureInfoModalProps {
  isOpen: boolean;
  featureKey: FeatureInfoKey | null;
  onClose: () => void;
}

export const FeatureInfoModal: React.FC<FeatureInfoModalProps> = ({
  isOpen,
  featureKey,
  onClose
}) => {
  if (!isOpen || !featureKey) return null;

  const detail = FEATURE_DETAILS[featureKey];
  if (!detail) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-info-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-slate-200 p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Close */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 shadow-inner">
              {detail.icon}
            </div>
            <div className="min-w-0">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${detail.badgeColor} uppercase tracking-wider`}
              >
                {detail.badge}
              </span>
              <h2
                id="feature-info-title"
                className="text-base sm:text-lg font-black text-white mt-1 leading-snug"
              >
                {detail.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle / Key statement */}
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 text-xs sm:text-sm text-cyan-300 font-medium">
          💡 {detail.subtitle}
        </div>

        {/* Section 1: What is it? */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-cyan-400" />
            Co to jest i do czego służy?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {detail.whatIsIt}
          </p>
        </div>

        {/* Section 2: How it works step by step */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Jak to działa krok po kroku?
          </h3>
          <ul className="space-y-2 text-xs text-slate-300">
            {detail.howItWorks.map((step, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Legal Basis & Impact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
            <div className="text-[11px] font-bold text-indigo-300 uppercase font-mono flex items-center gap-1">
              <Scale className="w-3.5 h-3.5" />
              Podstawa Prawna
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {detail.legalBasis}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1">
            <div className="text-[11px] font-bold text-amber-300 uppercase font-mono flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Skutek dla telemarketera
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {detail.telemarketerReaction}
            </p>
          </div>
        </div>

        {/* Tip Box */}
        <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 text-xs text-emerald-300 flex items-start gap-2.5">
          <span className="text-base leading-none">🛡️</span>
          <span className="leading-relaxed">
            <strong>Wskazówka:</strong> {detail.tip}
          </span>
        </div>

        {/* Close Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-cyan-500/20 transition-transform active:scale-98"
          >
            Rozumiem, zamknij wyjaśnienie
          </button>
        </div>
      </div>
    </div>
  );
};
