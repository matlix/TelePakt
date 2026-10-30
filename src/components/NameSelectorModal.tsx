import React, { useState } from 'react';
import { AppNameOption } from '../types';
import { APP_NAMES } from '../data/appNames';
import { Check, Star, Shield, Smartphone, Globe, Award, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NameSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedName: AppNameOption;
  onSelectName: (name: AppNameOption) => void;
}

export const NameSelectorModal: React.FC<NameSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedName,
  onSelectName,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'legal' | 'direct' | 'polish'>('all');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const filteredNames = APP_NAMES.filter(n => {
    if (activeTab !== 'all' && n.vibe !== activeTab) return false;
    if (searchFilter && !n.name.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  const handleChoose = (name: AppNameOption) => {
    onSelectName(name);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Wybór Nazwy & Identyfikacji Aplikacji
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Jak nazwiemy Twój system ochrony przed telemarketerami?
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Wybrana nazwa natychmiast zaktualizuje logo, nagłówki, generowane pisma prawne i pliki backendu Python w całej aplikacji.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Styl nazwy:</span>
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800">
              {(['all', 'legal', 'direct', 'polish'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab === 'all' ? 'Wszystkie' : tab === 'legal' ? 'Prawnicze' : tab === 'direct' ? 'Bezpośrednie' : 'Polskie'}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Aktywna marka:</span>
            <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {selectedName.name}
            </span>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNames.map(nameOpt => {
              const isSelected = selectedName.id === nameOpt.id;
              return (
                <div
                  key={nameOpt.id}
                  onClick={() => handleChoose(nameOpt)}
                  className={`cursor-pointer rounded-xl p-5 border transition-all text-left relative flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  {/* Top tags */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-indigo-300 border border-indigo-500/20">
                        {nameOpt.badge}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-medium">
                        <Award className="w-3.5 h-3.5" />
                        Wynik: {nameOpt.appStoreRank}/100
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {nameOpt.name}
                      </h3>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <Check className="w-3.5 h-3.5" /> Wybrana
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-indigo-400 italic mb-3">
                      „{nameOpt.tagline}”
                    </p>

                    <p className="text-xs text-slate-300 mb-4 line-clamp-2 leading-relaxed">
                      {nameOpt.description}
                    </p>

                    {/* Pros & Cons */}
                    <div className="space-y-2 mb-4 text-xs">
                      <div className="space-y-1">
                        {nameOpt.pros.map((p, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-slate-300">
                            <span className="text-emerald-400 font-bold shrink-0">✓</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Domains and Button */}
                  <div className="pt-3 border-t border-slate-800/80 mt-auto flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Globe className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-300 font-mono text-[11px]">{nameOpt.domainSuggestions[0]}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChoose(nameOpt);
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white'
                      }`}
                    >
                      {isSelected ? 'Wybrana marka' : 'Wybierz tę nazwę'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Universal Naming recommendation notice */}
          <div className="mt-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Werdykt ekspertów: Która nazwa działa na WSZYSTKIE opcje naraz?
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Gdy aplikacja obsługiwała tylko telemarketerów, nazwa <em>„TarczaRODO”</em> była dobra. Lecz gdy dochodzą: <strong>ochrona przed oszustami bankowymi</strong>, <strong>ustalenia biznesowe B2B</strong>, <strong>reklamacje</strong> oraz <strong>Twoje własne odpowiedzi i nagrania głosu</strong> – nazwa musi być uniwersalna:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
              <div className="p-3 bg-slate-900 rounded-lg border border-indigo-500/30">
                <strong className="text-indigo-400 block mb-0.5">1. Wybór #1 (Uniwersalny & Nowoczesny): VetoCall</strong>
                <span className="text-slate-300">
                  Słowo „Veto” to Twoje ostateczne zdanie – weto dla spamu, weto dla oszusta, weto dla naciągacza, ale też stanowcze oświadczenie Twojej woli w każdej rozmowie.
                </span>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-emerald-500/30">
                <strong className="text-emerald-400 block mb-0.5">2. Wybór #2 (W 100% Polski): Odzew</strong>
                <span className="text-slate-300">
                  Genialne, wieloznaczne polskie słowo. Odzew to riposta na bezczelny telefon, ale też dosłownie <em>„Twój własny nagrany odzew”</em> na kuriera, spotkanie czy klienta.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Możesz zmienić wybraną nazwę w dowolnym momencie w górnym pasku.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
};
