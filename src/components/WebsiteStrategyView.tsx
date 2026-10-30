import React, { useState } from 'react';
import { AppNameOption, CustomerReview } from '../types';
import { INITIAL_CUSTOMER_REVIEWS } from '../data/adminAndReviewsData';
import {
  Globe, Shield, CheckCircle2, AlertTriangle, ExternalLink,
  Smartphone, FileText, Download, Users, Lock, ChevronRight,
  Sparkles, Award, Star, ArrowRight, Eye, Play, Volume2, Scale,
  MessageSquare, Plus, CornerDownRight, ThumbsUp
} from 'lucide-react';

interface WebsiteStrategyViewProps {
  appName: AppNameOption;
  onOpenAnimation?: () => void;
  onOpenLegalHub?: () => void;
  onOpenAdminHub?: () => void;
}

export const WebsiteStrategyView: React.FC<WebsiteStrategyViewProps> = ({
  appName,
  onOpenAnimation,
  onOpenLegalHub,
  onOpenAdminHub,
}) => {
  const [activePreview, setActivePreview] = useState<'landing' | 'portal' | 'reviews' | 'privacy'>('landing');
  const [testSearchNumber, setTestSearchNumber] = useState('+48 22 104 39 88');
  const [searched, setSearched] = useState(false);
  const [websiteReviews, setWebsiteReviews] = useState<CustomerReview[]>(
    INITIAL_CUSTOMER_REVIEWS.filter(r => r.isApproved)
  );
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [authorInput, setAuthorInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [ratingInput, setRatingInput] = useState(5);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Globe className="w-3.5 h-3.5" />
              Strategia WWW, Wymogi Sklepów & Ruch Organiczny
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
              Czy potrzebujesz strony WWW dla aplikacji {appName.name}?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Krótka odpowiedź brzmi: <strong className="text-emerald-400">TAK, strona WWW jest w 100% obowiązkowa</strong> – zarówno z powodów formalnych (Apple & Google nie wpuszczą aplikacji do sklepów bez publicznej Polityki Prywatności RODO), jak i biznesowych (to strona www przynosi 80% użytkowników z wyszukiwarki Google).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
              <button
                onClick={() => setActivePreview('landing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreview === 'landing' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                1. Strona Główna (Landing)
              </button>
              <button
                onClick={() => setActivePreview('reviews')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreview === 'reviews' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2. Opinie Abonentów (4.9/5)
              </button>
              <button
                onClick={() => setActivePreview('portal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreview === 'portal' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                3. Panel Webowy (Dashboard)
              </button>
              <button
                onClick={() => setActivePreview('privacy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreview === 'privacy' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                4. Wymóg Apple/Google (RODO)
              </button>
            </div>

            {onOpenAdminHub && (
              <button
                onClick={onOpenAdminHub}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs border border-cyan-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                Moderuj opinie w Panelu Admina
              </button>
            )}
            </div>
          </div>
        </div>

      {/* 4 Crucial Reasons Why You Need A Website */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center font-bold">
            1
          </div>
          <h4 className="font-bold text-white text-sm">Wymóg Apple & Google Play</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Oba sklepy odrzucają zgłoszenie aplikacji bez publicznego linku URL do <strong>Polityki Prywatności</strong>, <strong>Regulaminu (Terms)</strong> oraz <strong>URL usuwania konta/danych</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
            2
          </div>
          <h4 className="font-bold text-white text-sm">Masowy ruch SEO z Google</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Miliony Polaków wpisują w Google: <em>„kto dzwonił +48 22...”</em>, <em>„jak zablokować fotowoltaikę”</em>, <em>„art 398 PKE wzór skargi”</em>. Darmowa wyszukiwarka numerów na stronie przekierowuje do pobrania aplikacji!
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
            3
          </div>
          <h4 className="font-bold text-white text-sm">Odsłuch nagrań na komputerze</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Gdy użytkownik składa zawiadomienie w ePUAP lub sprawę sądową, wygodniej mu pobrać plik MP3, transkrypcję i pismo na dużym ekranie komputera przez panel webowy.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
            4
          </div>
          <h4 className="font-bold text-white text-sm">Webhooki Twilio i tak działają w sieci</h4>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Twój backend w Pythonie (FastAPI) na Render.com i tak musi posiadać publiczny adres HTTPS do odbierania połączeń Twilio. Wystarczy podpiąć stronę pod tę samą domenę!
          </p>
        </div>
      </div>

      {/* Interactive Live Website Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Browser Mockup Chrome Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <span className="text-xs text-slate-500 font-mono pl-2 hidden sm:inline">Podgląd strony WWW dla Twojej aplikacji:</span>
          </div>

          <div className="flex-1 max-w-md bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
            <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-emerald-400">https://</span>
            <span className="truncate">www.{appName.id}.pl{activePreview === 'portal' ? '/panel' : activePreview === 'privacy' ? '/polityka-prywatnosci' : ''}</span>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            SSL 256-bit • Render.com
          </div>
        </div>

        {/* 1. Landing Page View */}
        {activePreview === 'landing' && (
          <div className="p-6 sm:p-10 space-y-12 bg-slate-950/70">
            
            {/* Hero Section */}
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-3.5 h-3.5" />
                Oficjalna tarcza prawna zgodna z Prawem komunikacji elektronicznej (PKE 2024)
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Koniec niechcianych telefonów. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400">
                  Jedno kliknięcie. Twoje weto. Zgodnie z prawem.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                {appName.name} to pierwsza w Polsce aplikacja, która w trakcie połączenia wpuszcza bota wygłaszającego bezwzględny sprzeciw z art. 398 PKE i art. 21 RODO oraz rejestruje niepodważalny dowód audio dla UKE.
              </p>

              {/* Store Download Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white flex items-center gap-3 cursor-pointer transition-all shadow-lg shadow-black/40">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <div className="text-left text-xs">
                    <span className="text-[10px] text-slate-400 block leading-none">Pobierz w</span>
                    <strong className="text-xs">Google Play (Android)</strong>
                  </div>
                </div>

                <div className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-white flex items-center gap-3 cursor-pointer transition-all shadow-lg shadow-black/40">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <div className="text-left text-xs">
                    <span className="text-[10px] text-slate-400 block leading-none">Pobierz w</span>
                    <strong className="text-xs">App Store (iPhone)</strong>
                  </div>
                </div>

                {onOpenAnimation && (
                  <button
                    onClick={onOpenAnimation}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center gap-2 cursor-pointer transition-all text-xs font-bold shadow-lg shadow-cyan-600/10"
                  >
                    <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                    <span>Zobacz Animację Instruktażową (Wideo)</span>
                  </button>
                )}

                {onOpenLegalHub && (
                  <button
                    onClick={onOpenLegalHub}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 flex items-center gap-2 cursor-pointer transition-all text-xs font-bold"
                  >
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span>Dokumenty RODO & Regulamin</span>
                  </button>
                )}
              </div>
            </div>

            {/* SEO Lead Magnet: Public Spam Number Checker Widget */}
            <div className="max-w-2xl mx-auto p-6 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-xl space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  Narzędzie SEO na Twojej stronie (Ściąga tysiące wizyt dziennie):
                </span>
                <h3 className="text-lg font-bold text-white">
                  Sprawdź, czy numer znajduje się na liście deliktów marketingowych
                </h3>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testSearchNumber}
                  onChange={(e) => {
                    setTestSearchNumber(e.target.value);
                    setSearched(false);
                  }}
                  placeholder="Wpisz numer telefonu, np. +48 22 104 39 88"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={() => setSearched(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  Sprawdź numer
                </button>
              </div>

              {searched && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs space-y-1 animate-in fade-in">
                  <div className="flex items-center justify-between text-rose-400 font-bold">
                    <span>⚠️ Numer {testSearchNumber} zgłoszony 142 razy</span>
                    <span className="text-[10px] bg-rose-500/20 px-2 py-0.5 rounded">Ryzyko: Krytyczne</span>
                  </div>
                  <p className="text-slate-300 text-[11px]">
                    Kategoria: Agresywny telemarketing fotowoltaiczny bez uprzedniej zgody.
                  </p>
                  <p className="text-indigo-400 font-medium text-[11px] pt-1">
                    👉 Zainstaluj {appName.name}, aby jednym ruchem suwaka wysłać prawny sprzeciw do tego call center.
                  </p>
                </div>
              )}
            </div>

            {/* Pricing Matrix on the Website */}
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white">Przejrzysty Cennik na Stronie WWW</h3>
                <p className="text-xs text-slate-400">Jak zarabia aplikacja telefoniczna ze stroną:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Free */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-300 text-sm">Pakiet Darmowy (Free)</div>
                  <div className="text-2xl font-black text-white font-mono">0 zł</div>
                  <p className="text-slate-400 text-[11px]">Podstawowa ochrona i ostrzeżenia o spamie.</p>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] border-t border-slate-800 pt-3">
                    <li>✓ Identyfikacja spamu na ekranie</li>
                    <li>✓ 2 testowe interwencje bota w miesiącu</li>
                    <li>✓ Przeglądanie polskich przepisów PKE</li>
                  </ul>
                </div>

                {/* Senior & Family */}
                <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-3 relative ring-1 ring-indigo-500">
                  <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    Najpopularniejszy
                  </span>
                  <div className="font-bold text-white text-sm">Tarcza Osobista / Senior</div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">19 zł <span className="text-xs font-normal text-slate-400">/ mies.</span></div>
                  <p className="text-slate-300 text-[11px]">Dla Ciebie i Twoich rodziców/dziadków.</p>
                  <ul className="space-y-1.5 text-slate-200 text-[11px] border-t border-slate-800 pt-3">
                    <li>✓ Nielimitowane suwaki sprzeciwu RODO</li>
                    <li>✓ Tarcza na oszusta bankowego (Anti-spoofing)</li>
                    <li>✓ 60 minut bota chmurowego (+48)</li>
                    <li>✓ Generator pism procesowych do UKE i ePUAP</li>
                  </ul>
                </div>

                {/* Pro B2B */}
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="font-bold text-slate-300 text-sm">Biznes B2B & Freelance</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">49 zł <span className="text-xs font-normal text-slate-400">/ mies.</span></div>
                  <p className="text-slate-400 text-[11px]">Dla fachowców, budowlańców i agencji.</p>
                  <ul className="space-y-1.5 text-slate-300 text-[11px] border-t border-slate-800 pt-3">
                    <li>✓ Wiążące notatki ustne z art. 66 K.c.</li>
                    <li>✓ Własne nagrane odpowiedzi firmowe</li>
                    <li>✓ Archiwum dowodowe audio z sumą SHA-256</li>
                    <li>✓ Faktura VAT 23% na firmę</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Reviews Section on Landing Page */}
            <div className="border-t border-slate-800 pt-10 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                    <span className="text-xs font-bold text-white ml-2">4.9 / 5.0 (ponad 1,200 zablokowanych spamerów)</span>
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Opinie Abonentów: Jak TelePakt działa w praktyce
                  </h3>
                  <p className="text-xs text-slate-400">
                    Prawdziwe historie użytkowników, którzy uwolnili się od natrętnego telemarketingu.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Napisz swoją opinię
                  </button>
                  {onOpenAdminHub && (
                    <button
                      onClick={onOpenAdminHub}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs border border-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Moderacja Admina
                    </button>
                  )}
                </div>
              </div>

              {submittedSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dziękujemy! Twoja opinia została przesłana do panelu administratora i pojawi się na stronie po akceptacji.</span>
                </div>
              )}

              {/* Grid of approved reviews */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {websiteReviews.slice(0, 4).map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                        ))}
                        <span className="text-white font-bold text-xs ml-1.5">{rev.authorName}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                        Zweryfikowany abonent
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200">{rev.title}</div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{rev.content}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-500">
                      <span>Zablokowano: <strong className="text-slate-400">{rev.spamTypeBlocked}</strong></span>
                      <span>{rev.deviceType}</span>
                    </div>
                    {rev.adminReply && (
                      <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] space-y-0.5">
                        <span className="font-bold text-cyan-400">Odpowiedź TelePakt:</span>
                        <p className="text-slate-300">{rev.adminReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 2. Reviews Dedicated View */}
        {activePreview === 'reviews' && (
          <div className="p-6 sm:p-8 space-y-6 bg-slate-950/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-cyan-400">telepakt.pl/opinie</span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Wszystkie Zweryfikowane Opinie Abonentów
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Średnia ocen: <strong>4.9 / 5</strong> na podstawie recenzji zadowolonych użytkowników w Polsce.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-cyan-600/20 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Dodaj recenzję
                </button>
                {onOpenAdminHub && (
                  <button
                    onClick={onOpenAdminHub}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Panel Moderacji
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {websiteReviews.map((rev) => (
                <div key={rev.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-600'}`} />
                      ))}
                      <span className="font-bold text-white text-xs ml-2">{rev.authorName}</span>
                    </div>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 font-mono">
                      {rev.deviceType}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white">{rev.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{rev.content}</p>
                  {rev.adminReply && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                      <span className="font-bold text-cyan-400 flex items-center gap-1">
                        <CornerDownRight className="w-3 h-3" /> Oficjalna odpowiedź TelePakt:
                      </span>
                      <p className="text-slate-300 pl-4">{rev.adminReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Web Portal (Dashboard for Desktop Users) */}
        {activePreview === 'portal' && (
          <div className="p-6 sm:p-8 space-y-6 bg-slate-950/70">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400">Panel Webowy Użytkownika (Desktop)</span>
                <h3 className="text-lg font-bold text-white">
                  Twoje Nagrania, Dowody i Zgłoszenia do UKE
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                Zalogowany: jan.kowalski@gmail.com
              </span>
            </div>

            {/* Evidence items in desktop portal */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono text-sm">+48 22 104 39 88</span>
                    <span className="text-[10px] font-bold bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded">Sprzeciw RODO złożony</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Czas trwania: 0:48 s • Plik: <code className="text-indigo-300">nagranie_dowod_20261028.mp3</code> (Suma kontrolna: SHA-256)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    Odsłuchaj na PC
                  </button>
                  <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" />
                    Pobierz paczkę ePUAP
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300">Dlaczego użytkownicy kochają panel webowy?</span>
              <p>
                Wygodne podpisywanie pism Profilem Zaufanym (ePUAP) i dołączanie plików MP3 do formularzy UKE jest 10x szybsze z poziomu przeglądarki na komputerze niż na małym ekranie telefonu.
              </p>
            </div>
          </div>
        )}

        {/* 3. Privacy Policy & RODO View (Apple / Google Store Compliance) */}
        {activePreview === 'privacy' && (
          <div className="p-6 sm:p-8 space-y-4 bg-slate-950/70 font-sans text-xs">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold text-rose-400">Wymóg formalny Google Play & Apple App Store</span>
              <h3 className="text-base font-bold text-white">
                Oficjalna Polityka Prywatności & Ochrony Danych Osobowych (RODO)
              </h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 space-y-3 leading-relaxed max-h-[380px] overflow-y-auto font-mono text-[11px]">
              <p className="font-bold text-white">
                POLITYKA PRYWATNOŚCI APLIKACJI {appName.name.toUpperCase()} (Wersja z dnia 28.10.2026 r.)
              </p>

              <p>
                <strong>1. Administrator Danych:</strong> Administratorem danych osobowych w rozumieniu Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO) jest operator serwisu i aplikacji {appName.name}.
              </p>

              <p>
                <strong>2. Cel i Podstawa Przetwarzania:</strong> Dane w postaci numerów telefonów dzwoniących oraz nagrań audio przetwarzane są wyłącznie na zlecenie użytkownika końcowego w celu realizacji usługi ochrony przed niechcianym marketingiem (art. 6 ust. 1 lit. b RODO) oraz zabezpieczenia materiału dowodowego na potrzeby postępowań przed organami państwowymi (Prezes UKE, Prezes UODO, sądy powszechne - art. 6 ust. 1 lit. f RODO).
              </p>

              <p>
                <strong>3. Nagrania Rozmów i Poufność:</strong> Nagrania audio są szyfrowane kluczem AES-256 w spoczynku i przesyłane wyłącznie protokołem TLS. Użytkownik zachowuje wyłączną kontrolę nad plikami nagrań i ma prawo do ich trwałego usunięcia w dowolnym momencie (prawo do bycia zapomnianym z art. 17 RODO).
              </p>

              <p>
                <strong>4. Procedura usunięcia konta:</strong> Użytkownik może w każdej chwili zażądać natychmiastowego usunięcia swojego konta i wszystkich powiązanych danych za pośrednictwem formularza na stronie WWW lub w ustawieniach aplikacji mobilnej.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Summary recommendation */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border border-emerald-500/20 flex items-start gap-3 text-xs">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-white text-sm">Podsumowanie dla Twojego projektu:</h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Tworząc aplikację {appName.name}, strona WWW i aplikacja mobilna tworzą jeden spójny ekosystem. Twój serwer <strong>Python Django 5</strong> na <strong>Render.com</strong> podpięty pod domenę <strong>telepakt.pl</strong> z Hostinger może serwować zarówno webhooki telefonii Twilio (TwiML), bazę PostgreSQL dla dowodów, jak i stronę lądowania z cennikiem i polityką prywatności!
          </p>
        </div>
      </div>

      {/* Submit Review Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <h3 className="font-bold text-white text-sm">Dodaj opinię o TelePakt</h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!authorInput || !contentInput) return;
                setSubmittedSuccess(true);
                setIsSubmitModalOpen(false);
                setAuthorInput('');
                setContentInput('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Twoje imię / inicjał:</label>
                <input
                  type="text"
                  required
                  placeholder="np. Piotr z Wrocławia"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ocena:</label>
                <select
                  value={ratingInput}
                  onChange={(e) => setRatingInput(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 - Rewelacja)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 - Bardzo dobrze)</option>
                  <option value={3}>⭐⭐⭐ (3/5 - W porządku)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Twoje doświadczenie z TelePakt:</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Napisz jak zadziałała formuła prawna i suwak..."
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer"
                >
                  Opublikuj opinię
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
