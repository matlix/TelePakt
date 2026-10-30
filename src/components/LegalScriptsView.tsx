import React, { useState } from 'react';
import { LegalScript } from '../types';
import { LEGAL_SCRIPTS } from '../data/legalScripts';
import { PolishVoiceSynthesizer } from '../utils/speech';
import {
  Scale, ShieldAlert, BookOpen, AlertCircle, CheckCircle2,
  Copy, Check, Volume2, ExternalLink, HelpCircle, FileCheck,
  PhoneOff, Phone
} from 'lucide-react';

export const LegalScriptsView: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<LegalScript>(LEGAL_SCRIPTS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <Scale className="w-3.5 h-3.5" />
              Aktualny stan prawny: Prawo komunikacji elektronicznej (PKE) 2024 / 2025
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Podstawy Prawne i Skrypty Zgodne z Prawem Polskim
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Od 10 listopada 2024 roku weszła w życie ustawa <strong>Prawo komunikacji elektronicznej (PKE)</strong>, która zastąpiła dotychczasowe Prawo telekomunikacyjne. Art. 398 wprowadza bezwzględny model <em>opt-in</em> dla telemarketingu – dzwonienie bez uprzedniej zgody to delikt administracyjny zagrożony karą do 1 miliona złotych.
            </p>
          </div>
        </div>
      </div>

      {/* Script Explorer Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Scripts List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dostępne formuły prawne ({LEGAL_SCRIPTS.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              ⚡ Rozłącza vs 📞 Na linii
            </span>
          </div>

          <div className="space-y-3">
            {LEGAL_SCRIPTS.map((script) => {
              const isSelected = selectedScript.id === script.id;
              return (
                <div
                  key={script.id}
                  onClick={() => setSelectedScript(script)}
                  className={`cursor-pointer rounded-xl p-4 border transition-all text-left ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-white text-sm">
                      {script.title}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {script.autoHangup !== false ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center gap-0.5">
                          <PhoneOff className="w-2.5 h-2.5" /> Rozłącza
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" /> Na linii
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {script.shortDesc}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    <span className="text-emerald-400 font-medium truncate max-w-[200px]">{script.legalAct}</span>
                    <span>{script.durationEst}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Script Detail View */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-indigo-400">
                    {selectedScript.badge}
                  </span>
                  <span>•</span>
                  {selectedScript.autoHangup !== false ? (
                    <span className="text-xs font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                      <PhoneOff className="w-3 h-3" />
                      Automatycznie rozłącza (Auto-Hangup)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Pozostaje na linii (rozmowa trwa dalej)
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white">
                  {selectedScript.title}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyText(selectedScript.text, selectedScript.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {copiedId === selectedScript.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === selectedScript.id ? 'Skopiowano!' : 'Kopiuj formułę'}
                </button>

                <button
                  onClick={() => PolishVoiceSynthesizer.speak(selectedScript.text)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Odsłuchaj
                </button>
              </div>
            </div>

            {/* Script Text Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm leading-relaxed font-sans shadow-inner">
              <p className="italic">
                „{selectedScript.text}”
              </p>
            </div>

            {/* Legal Breakdown Cards */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                Dlaczego to sformułowanie jest w 100% legalne i skuteczne?
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {selectedScript.legalBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1">
                    <div className="flex items-center justify-between text-indigo-300 font-bold">
                      <span>{item.article}</span>
                      <span className="text-rose-400 font-mono text-[11px]">{item.penalty}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Polish Legal FAQ Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-400" />
          Kluczowe fakty prawne o nagrywaniu i telemarketingu w Polsce
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Nagrywanie własnej rozmowy
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Art. 267 Kodeksu karnego penalizuje wyłącznie podsłuch cudzych rozmów przez osoby trzecie. Jeżeli jesteś stroną połączenia, nagranie go nie stanowi przestępstwa i jest w pełni legalne na użytek osobisty i dowodowy.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-blue-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Dowód w sądzie i przed UKE
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Sądy i urzędy (Prezes UKE, Prezes UODO) rutynowo dopuszczają nagrania rozmów telefonicznych jako dowód w sprawach o naruszenie dóbr osobistych, delikt telekomunikacyjny oraz naruszenie RODO (art. 308 K.p.c.).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" />
              Brak groźby bezprawnej
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Poinformowanie konsultanta o zamiarze złożenia skargi do UODO lub UKE nie jest groźbą bezprawną, lecz zapowiedzią skorzystania z przysługujących praw podmiotowych określonych w przepisach prawa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
