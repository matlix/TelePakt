import React, { useState } from 'react';
import { UseCaseDefinition, LegalScript, AppNameOption } from '../types';
import { EXPANDED_USE_CASES } from '../data/useCases';
import { LEGAL_SCRIPTS } from '../data/legalScripts';
import { PolishVoiceSynthesizer } from '../utils/speech';
import {
  ShieldAlert, Scale, Briefcase, UserX, Receipt, PhoneOff,
  Sparkles, CheckCircle2, ArrowRight, Play, Volume2, Coins,
  Users, Lightbulb, Zap, TrendingUp
} from 'lucide-react';

interface UseCasesExplorerProps {
  appName: AppNameOption;
  onSelectUseCaseToTest: (script: LegalScript) => void;
}

export const UseCasesExplorer: React.FC<UseCasesExplorerProps> = ({
  appName,
  onSelectUseCaseToTest,
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(EXPANDED_USE_CASES[0].id);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const activeCase = EXPANDED_USE_CASES.find(c => c.id === selectedCaseId) || EXPANDED_USE_CASES[0];
  const matchingScript = LEGAL_SCRIPTS.find(s => s.category === activeCase.category) || LEGAL_SCRIPTS[0];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'Scale': return <Scale className="w-5 h-5 text-amber-400" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'UserX': return <UserX className="w-5 h-5 text-pink-400" />;
      case 'Receipt': return <Receipt className="w-5 h-5 text-emerald-400" />;
      case 'PhoneOff': return <PhoneOff className="w-5 h-5 text-purple-400" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handlePlayVoice = () => {
    if (isPlayingAudio) {
      PolishVoiceSynthesizer.stop();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      PolishVoiceSynthesizer.speak(matchingScript.text, {
        onStart: () => setIsPlayingAudio(true),
        onEnd: () => setIsPlayingAudio(false),
        onError: () => setIsPlayingAudio(false)
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lightbulb className="w-3.5 h-3.5" />
            Więcej niż antyspam: Wielomilionowe rynki docelowe dla aplikacji {appName.name}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight sm:text-3xl">
            Inne Potężne Zastosowania Technologii „In-Call Cloud Bot”
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Blokowanie telemarketerów to zaledwie <strong>wierzchołek góry lodowej</strong>. Ta sama technologia wstrzykiwania formuł audio i tworzenia dowodów prawnych rozwiązuje gigantyczne codzienne problemy w biznesie, bezpieczeństwie seniorów, windykacji i prawie konsumenckim.
          </p>
        </div>
      </div>

      {/* Grid of Use Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Selector List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Wybierz scenariusz życiowy / biznesowy:
            </span>
            <span className="text-[11px] text-indigo-400 font-mono font-semibold">
              {EXPANDED_USE_CASES.length} gotowych modułów
            </span>
          </div>

          <div className="space-y-2.5">
            {EXPANDED_USE_CASES.map((uc) => {
              const isSelected = uc.id === selectedCaseId;
              return (
                <div
                  key={uc.id}
                  onClick={() => {
                    setSelectedCaseId(uc.id);
                    PolishVoiceSynthesizer.stop();
                    setIsPlayingAudio(false);
                  }}
                  className={`cursor-pointer rounded-2xl p-4 border transition-all text-left relative group ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                      {getIcon(uc.iconName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                          {uc.title}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          uc.revenuePotential === 'viral'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : uc.revenuePotential === 'very_high'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}>
                          {uc.revenuePotential === 'viral' ? 'Viral UX' : uc.revenuePotential === 'very_high' ? 'Rynek B2B / Finanse' : 'Ochrona Prawna'}
                        </span>
                      </div>

                      <p className="text-xs text-indigo-400 italic mb-1.5 line-clamp-1">
                        „{uc.tagline}”
                      </p>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {uc.problem}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Deep Dive Case Details & Direct Test Launcher */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
            
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                    {getIcon(activeCase.iconName)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {activeCase.title}
                    </h3>
                    <p className="text-xs text-indigo-400 font-medium">
                      Dla kogo: {activeCase.targetUser}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handlePlayVoice}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                  {isPlayingAudio ? 'Zatrzymaj' : 'Odsłuchaj skrypt'}
                </button>

                <button
                  onClick={() => onSelectUseCaseToTest(matchingScript)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Przetestuj w symulatorze
                </button>
              </div>
            </div>

            {/* Problem & Solution Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/20 space-y-1.5">
                <span className="font-bold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  Bolesny problem na rynku:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {activeCase.problem}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-1.5">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Rozwiązanie w aplikacji:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {activeCase.solution}
                </p>
              </div>
            </div>

            {/* Script In-Call Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-indigo-400" />
                  Formuła audio wypowiadana przez bota do słuchawki:
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {matchingScript.durationEst}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs leading-relaxed font-sans shadow-inner">
                <p className="italic">
                  „{matchingScript.text}”
                </p>
              </div>
            </div>

            {/* Real World Scenario Story */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs space-y-1">
              <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Scenariusz z życia wzięty:
              </span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {activeCase.realWorldScenario}
              </p>
            </div>

            {/* Key Benefits */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider block">
                Główne korzyści dla użytkownika i monetyzacji:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeCase.keyBenefits.map((benefit, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-[11px] flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legal Basis Footer */}
            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between font-mono">
              <span>Podstawa prawna: <strong className="text-slate-200">{activeCase.legalBasis}</strong></span>
            </div>

          </div>
        </div>

      </div>

      {/* Business Model & Monetization Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Jak te zastosowania zmieniają wycenę i model biznesowy aplikacji?
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-indigo-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" />
              1. Zwykły antyspam: ~0 zł / darmowy
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pasywne aplikacje z prostą czarną listą konkurują darmową bazą numerów i mają trudność z pobieraniem opłat w Polsce.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" />
              2. Pakiet Senior & Bezpieczeństwo Bankowe: 19–29 zł / mies.
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Rodziny chętnie płacą abonament za ochronę rodziców i dziadków przed wyłudzeniem oszczędności życia (spoofing, BLIK, AnyDesk).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4" />
              3. Pakiet B2B / Freelancer (Umowy ustne): 49–99 zł / mies.
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Dla fachowców, budowlańców i programistów jedno nagranie dodatkowej wyceny ratuje tysiące złotych. To produkt o zerowym churnie!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
