import React, { useState } from 'react';
import { AppNameOption } from '../types';
import {
  Scale, Shield, TrendingUp, FileText, CheckCircle2, AlertTriangle,
  Download, Copy, Check, DollarSign, Users, Award, BookOpen,
  ArrowRight, Landmark, Lock, HelpCircle, ExternalLink, Zap,
  Gift, Share2, Search
} from 'lucide-react';
import {
  TERMS_OF_SERVICE_TEXT as termsOfServiceText,
  PRIVACY_POLICY_TEXT as privacyPolicyText,
  RODO_CLAUSE_TEXT as rodoClauseText,
  USER_MANUAL_TEXT as userManualText
} from '../data/legalDocuments';

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

  // Unit Economics & Profitability Simulator State
  const [simUsers, setSimUsers] = useState<number>(10000); // Total users in cohort
  const [simConversion, setSimConversion] = useState<number>(5.0); // % paying users
  const [simFreeMinUsed, setSimFreeMinUsed] = useState<number>(2.0); // average minutes used by free users (out of 3.0 min max)
  
  // Google AdWords & Acquisition Marketing State
  const [adwordsPaidShare, setAdwordsPaidShare] = useState<number>(50); // % of users acquired via Google Ads (rest from referrals & SEO)
  const [adwordsCPI, setAdwordsCPI] = useState<number>(1.80); // Cost per install / lead from Google Ads in PLN
  const [repeatPurchaseRate, setRepeatPurchaseRate] = useState<number>(25); // % repeat package purchases within 12 months (LTV booster)

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
                Płatnych pakietów (1,5-2% SAM) = <strong>1,2 - 1,8 mln zł</strong> przychodu
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider">
                Marża Brutto na Połączeniu
              </span>
              <div className="text-2xl font-black text-amber-300">&gt; 84%</div>
              <p className="text-[11px] text-slate-400">
                Koszt SIP Twilio + STT/AI to 0,08 zł/min vs 0,50 zł/min przychodu
              </p>
            </div>
          </div>

          {/* Interactive Unit Economics & Profitability Simulator (Kalkulator Kosztów i Zysków) */}
          <div className="bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <TrendingUp className="w-3.5 h-3.5" />
                  SYMULATOR RENTOWNOŚCI UNIT ECONOMICS
                </div>
                <h3 className="text-xl font-black text-white">
                  Kalkulator Kosztów i Zysków Realnego Biznesu TelePakt
                </h3>
                <p className="text-xs text-slate-300">
                  Przetestuj realne założenia: ile kosztują darmowe 3 minuty, ile przynosi pakiet 14,99 zł oraz jaki jest zysk netto.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">Model rozliczeń:</span>
                <span className="text-xs font-bold text-emerald-400">Prepaid bezterminowy (Zero subskrypcji)</span>
              </div>
            </div>

            {/* Controls (Sliders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
              
              {/* Slider 1: Total Users */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Łączna liczba użytkowników:</label>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {simUsers.toLocaleString('pl-PL')} abonentów
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={simUsers}
                  onChange={(e) => setSimUsers(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1 000</span>
                  <span>50 000</span>
                  <span>100 000</span>
                </div>
              </div>

              {/* Slider 2: Conversion to Paid */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Konwersja na pakiety płatne (%):</label>
                  <span className="font-mono font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {simConversion.toFixed(1)}% ({Math.round(simUsers * (simConversion / 100)).toLocaleString('pl-PL')} płacących)
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="20.0"
                  step="0.5"
                  value={simConversion}
                  onChange={(e) => setSimConversion(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>1.0% (bardzo ostrożna)</span>
                  <span>5.0% (standard rynkowy)</span>
                  <span>20.0% (optymistyczna)</span>
                </div>
              </div>

              {/* Slider 3: Average free minutes used by non-paying users */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Średnie zużycie darmowych minut przez niepłacących:</label>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {simFreeMinUsed.toFixed(1)} min (z 3.0 min gratis)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={simFreeMinUsed}
                  onChange={(e) => setSimFreeMinUsed(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5 min</span>
                  <span>2.0 min (średnio)</span>
                  <span>3.0 min (pełne 100%)</span>
                </div>
              </div>


              {/* Slider 5: Google AdWords Paid Traffic Share */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Udział pozyskania z Google AdWords / Ads:</label>
                  <span className="font-mono font-bold text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {adwordsPaidShare}% z reklam ({Math.round(simUsers * (adwordsPaidShare / 100)).toLocaleString('pl-PL')} instalacji)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={adwordsPaidShare}
                  onChange={(e) => setAdwordsPaidShare(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (100% wirus/SEO)</span>
                  <span>50% (mix zrównoważony)</span>
                  <span>100% (sama reklama)</span>
                </div>
              </div>

              {/* Slider 6: Google AdWords CPI / CPA (Cost Per Install / Lead) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Koszt instalacji w Google Ads (CPI/CPA):</label>
                  <span className="font-mono font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {adwordsCPI.toFixed(2)} zł / instalację
                  </span>
                </div>
                <input
                  type="range"
                  min="0.80"
                  max="5.00"
                  step="0.10"
                  value={adwordsCPI}
                  onChange={(e) => setAdwordsCPI(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0,80 zł (App Campaigns)</span>
                  <span>1,80 zł (Średnia PL)</span>
                  <span>5,00 zł (Search trudne frazy)</span>
                </div>
              </div>

              {/* Slider 7: Repeat Purchase Rate (LTV Booster over 12 months) */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-slate-300">Wskaźnik ponownych doładowań w skali roku (LTV Booster):</label>
                  <span className="font-mono font-bold text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                    +{repeatPurchaseRate}% kolejnych zakupów pakietów
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="5"
                  value={repeatPurchaseRate}
                  onChange={(e) => setRepeatPurchaseRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0% (tylko 1 zakup w życiu)</span>
                  <span>25% (realne doładowania po wyczerpaniu)</span>
                  <span>60% (wysoka lojalność)</span>
                </div>
              </div>

            </div>

            {/* Calculations Engine */}
            {(() => {
              const freeUsersCount = Math.round(simUsers * (1 - simConversion / 100));
              const payingUsersCount = Math.round(simUsers * (simConversion / 100));
              const buyers30Count = payingUsersCount;

              // Initial Purchase Revenue (only the 14,99 zł / 30 min package is sold)
              const initialRevenue = buyers30Count * 14.99;

              // LTV Booster (Repurchases over 12 months)
              const ltvBonusRevenue = initialRevenue * (repeatPurchaseRate / 100);
              const totalGrossRevenue = initialRevenue + ltvBonusRevenue;

              // Google AdWords Costs
              const adwordsAcquiredUsers = Math.round(simUsers * (adwordsPaidShare / 100));
              const organicAndReferralUsers = simUsers - adwordsAcquiredUsers;
              const adwordsBudget = adwordsAcquiredUsers * adwordsCPI;

              // Infrastructure unit cost: Twilio SIP 0.05 zł/min + STT & Gemini analysis 0.03 zł/min = 0.08 zł/min
              const costPerMin = 0.08;
              const freeMinutesConsumed = freeUsersCount * simFreeMinUsed;
              const costFreeUsers = freeMinutesConsumed * costPerMin;

              // Paying minutes delivered (including repeat purchases, assuming 75% utilized on average)
              const paidMinutesDelivered = (buyers30Count * 30) * (1 + repeatPurchaseRate / 100) * 0.75;
              const costPaidUsers = paidMinutesDelivered * costPerMin;

              const totalTelecomCost = costFreeUsers + costPaidUsers;
              const fixedServerCost = 2500; // Cloud infrastructure, databases, domain, monitoring
              
              // Total Operating Costs including Google Ads
              const totalOperatingCostWithAds = totalTelecomCost + fixedServerCost + adwordsBudget;
              const grossProfit = totalGrossRevenue - totalTelecomCost;
              const grossMarginPct = totalGrossRevenue > 0 ? (grossProfit / totalGrossRevenue) * 100 : 0;
              const netOperatingProfit = totalGrossRevenue - totalOperatingCostWithAds;

              // Google Ads Metrics: ROAS & Blended CAC
              const adwordsROAS = adwordsBudget > 0 ? (totalGrossRevenue / adwordsBudget) * 100 : 0;
              const blendedCAC = payingUsersCount > 0 ? adwordsBudget / payingUsersCount : 0;

              // Leverage ratio: how many free users (at simFreeMinUsed min) are funded by 1 paying pack:
              const costOfOneFreeUser = simFreeMinUsed * costPerMin;
              const freeUsersFundedBy30Pack = costOfOneFreeUser > 0 ? Math.floor((14.99 - (30 * 0.75 * costPerMin)) / costOfOneFreeUser) : 0;
              return (
                <div className="space-y-6">
                  
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Przychód Całkowity (LTV):</span>
                      <div className="text-2xl font-black text-cyan-300 font-mono">
                        {totalGrossRevenue.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Pakiety: {initialRevenue.toFixed(0)} zł + Doładowania: {ltvBonusRevenue.toFixed(0)} zł
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-blue-400 font-bold">Budżet Google AdWords:</span>
                      <div className="text-2xl font-black text-blue-300 font-mono">
                        {adwordsBudget.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {adwordsAcquiredUsers.toLocaleString('pl-PL')} instalacji x {adwordsCPI.toFixed(2)} zł (CPI)
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-amber-400 font-bold">Efektywność AdWords:</span>
                      <div className="text-2xl font-black text-amber-300 font-mono">
                        ROAS: {adwordsBudget > 0 ? `${adwordsROAS.toFixed(0)}%` : 'Organiczny'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Blended CAC: <strong>{blendedCAC.toFixed(2)} zł</strong> / klienta płacącego
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-1">
                      <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold">Czysty Zysk Netto (EBITDA):</span>
                      <div className={`text-2xl font-black font-mono ${netOperatingProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                        {netOperatingProfit.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł
                      </div>
                      <p className="text-[11px] text-emerald-300">
                        Po AdWords, serwerach i VoIP (Marża: {grossMarginPct.toFixed(1)}%)
                      </p>
                    </div>

                  </div>

                  {/* Deep Dive Breakdown */}
                  <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Analiza Współczynnika Pokrycia Kosztów (Unit Economics):</span>
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <strong className="text-cyan-300 block">Pakiet 30 minut (14,99 zł):</strong>
                        <ul className="space-y-1 text-slate-300 text-[11px] list-disc pl-4">
                          <li>Cena dla klienta: <strong>14,99 zł</strong> (0,50 zł / min).</li>
                          <li>Koszt dostarczenia 30 minut połączeń (Twilio + AI): <strong>1,80 zł</strong>.</li>
                          <li>Zysk bezpośredni z 1 klienta: <strong>13,19 zł</strong>.</li>
                          <li>Koszt 1 darmowego usera ({simFreeMinUsed.toFixed(1)} min x 0,08 zł): <strong>{(simFreeMinUsed * 0.08).toFixed(2)} zł</strong>.</li>
                          <li><strong className="text-emerald-400">Wniosek:</strong> Już <strong>1 zakup pakietu 14,99 zł</strong> w pełni finansuje darmowe testy dla aż <strong>{freeUsersFundedBy30Pack} niepłacących użytkowników</strong>!</li>
                        </ul>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-300 text-[11px] leading-relaxed">
                      💡 <strong>Dlaczego ten model jest bezpieczny finansowo?</strong> Ponieważ minuty VoIP w hurcie (Twilio/Plivo/Infobip) kosztują zaledwie 0,05 zł/min, a transkrypcja i analiza AI ok. 0,03 zł/min (łącznie 0,08 zł). Nawet przy bardzo niskiej konwersji wynoszącej zaledwie <strong>1,5% - 2%</strong>, przychody od płacących wielokrotnie przewyższają koszty darmowych 3 minut dla reszty bazy. Dodatkowo model bezterminowy nie generuje ryzyka przeterminowania zobowiązań.
                    </div>

                    {/* Google AdWords Acquisition Model & Economics */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/60 border-2 border-blue-500/40 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white font-black text-sm">
                          <Search className="w-5 h-5 text-blue-400" />
                          <span>Strategia Google AdWords / Ads w Polsce (Koszty, Słowa Kluczowe i Rentowność)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Google Search + App Campaigns
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Aby osiągnąć skalę dziesiątek tysięcy instalacji, TelePakt łączy płatny ruch z Google Ads z wirusowym programem poleceń (K-factor) i SEO. Oto jak wyglądają realne stawki rynkowe w Polsce i dlaczego nasza kampania osiąga wysoki zwrot z nakładów na reklamę (ROAS):
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                          <strong className="text-blue-300 block font-mono text-[11px]">1. Google App Campaigns (UAC)</strong>
                          <p className="text-[11px] text-slate-300 leading-tight">
                            Reklamy instalacji w Google Play, YouTube i sieci AdMob. Średni koszt instalacji w Polsce: <strong>1,20 zł – 2,20 zł (CPI)</strong>. Darmowe 3 minuty bez podawania karty drastycznie podnoszą konwersję w sklepie (&gt;35%).
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                          <strong className="text-cyan-300 block font-mono text-[11px]">2. Google Search (Wysoka Intencja)</strong>
                          <p className="text-[11px] text-slate-300 leading-tight">
                            Frazy problemowe: <em>„jak zablokować telemarketera”</em>, <em>„zastrzeżony numer jak sprawdzić”</em>, <em>„zawiadomienie UKE spam”</em>. CPC: <strong>0,80 – 1,40 zł</strong>. Klienci z tej grupy mają najwyższą konwersję na pakiety płatne (15–25%).
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                          <strong className="text-emerald-300 block font-mono text-[11px]">3. Synergia z Poleceniami (Viral)</strong>
                          <p className="text-[11px] text-slate-300 leading-tight">
                            Każdy pozyskany z AdWords użytkownik zaprasza średnio 0,4–0,8 znajomego, aby zyskać kolejne darmowe minuty. To obniża <strong>efektywny Blended CAC z 36 zł do ok. 18–22 zł</strong> za płacącego klienta.
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Rentowność kampanii AdWords:</strong> Ponieważ sprzedajemy jeden płatny pakiet (14,99 zł), średni przychód na płacącego klienta (AOV) wynosi <strong>14,99 zł</strong>, a z doładowaniami (+25%) ok. <strong>18,70 zł</strong>. Opłacalność kampanii zależy więc głównie od kosztu instalacji (CPI) i konwersji — sprawdź ją w symulatorze powyżej (ROAS i Blended CAC).
                        </div>
                      </div>
                    </div>

                    {/* Referral Economics Deep Dive: How many minutes make sense? */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-2 border-purple-500/40 space-y-4">
                      <div className="flex items-center gap-2 text-white font-black text-sm">
                        <Gift className="w-5 h-5 text-purple-400" />
                        <span>Kalkulacja Programu Poleceń: Ile Minut Dawać, aby Biznes Miał Wysoki Zysk?</span>
                      </div>

                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Wartość rynkowa minuty dla klienta to <strong>0,50 zł</strong> (na bazie pakietu 14,99 zł za 30 min), natomiast realny koszt telekomunikacyjny (Twilio VoIP + transkrypcja Whisper + AI) to zaledwie <strong>0,08 zł / minutę</strong>. Ta ogromna dźwignia pozwala stworzyć program poleceń, który jest dla użytkowników niezwykle atrakcyjny, a dla nas <strong>20–50 razy tańszy niż płatne reklamy</strong> w Google czy Meta!
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">1. Krok: Rejestracja</span>
                          <div className="text-sm font-bold text-white">
                            +2 min (Polecający) <br />
                            +1 min (Zaproszony)
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Koszt dla nas: <strong>0,24 zł za pozyskanie użytkownika</strong> (3 min x 0,08 zł). Zaproszony ma 4 min gratis na start!
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">2. Krok: Zakup Pakietu</span>
                          <div className="text-sm font-bold text-purple-300">
                            +5 minut extra (Polecający)
                          </div>
                          <p className="text-[10px] text-slate-400 leading-tight">
                            Gdy znajomy kupi pakiet 14,99 zł, polecający zyskuje 5 min. Koszt dla nas: <strong>0,40 zł</strong> przy przychodzie 14,99 zł (zaledwie <strong>2,6%</strong> kwoty!).
                          </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Porównanie z CAC Reklam</span>
                          <div className="text-sm font-bold text-emerald-300">
                            CAC Polecenia: 0,64 zł vs Reklama: 25,00 zł
                          </div>
                          <p className="text-[10px] text-emerald-300/80 leading-tight">
                            Zamiast płacić 15–30 zł agencjom marketingowym za instalację, płacimy w minutach <strong>0,64 zł</strong>, zachowując marżę netto powyżej <strong>85%</strong>!
                          </p>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/90 border border-purple-500/20 text-[10px] text-slate-400 flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                        <span>
                          <strong>Wniosek ekonomiczny:</strong> Schemat <strong>2 minuty za instalację + 5 minut za zakup</strong> (łącznie max 7 minut) to idealny punkt równowagi (sweet spot). Daje silny bodziec wirusowy (viral loop), zadowala polecającego (odczuwa bonus wart 3,50 zł), a realny koszt dla TelePakt wynosi zaledwie 0,56 zł, co nie obciąża budżetu firmy.
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

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
                      <span>TelePakt (telepakt.pl)</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-500/20 text-cyan-300 font-mono">NASZA OFERTA</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">0 zł (3 min gratis) / 14,99 zł (30 min) bezterminowo</td>
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
                Gwarancja 100% Zero-Storage: brak przechowywania nagrań na serwerach, zapis wyłącznie w telefonie lub Twojej chmurze
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
