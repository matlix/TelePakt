import React, { useState } from 'react';
import { LegalScript, AppNameOption } from '../types';
import {
  Sliders, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw,
  Sparkles, Check, X, ShieldAlert, Briefcase, PhoneOff, Phone,
  GripVertical, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ResponseOrderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: AppNameOption;
  scripts: LegalScript[];
  onSaveScriptsOrder: (reorderedScripts: LegalScript[]) => void;
  onResetToDefault: () => void;
}

export const ResponseOrderManagerModal: React.FC<ResponseOrderManagerModalProps> = ({
  isOpen,
  onClose,
  appName,
  scripts,
  onSaveScriptsOrder,
  onResetToDefault,
}) => {
  const [localScripts, setLocalScripts] = useState<LegalScript[]>(scripts);

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localScripts];
    const item = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = item;
    setLocalScripts(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === localScripts.length - 1) return;
    const updated = [...localScripts];
    const item = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = item;
    setLocalScripts(updated);
  };

  const handleToggleVisibility = (scriptId: string) => {
    setLocalScripts(prev =>
      prev.map(s => {
        if (s.id === scriptId) {
          const isCurrentlyEnabled = s.enabled !== false;
          return { ...s, enabled: !isCurrentlyEnabled };
        }
        return s;
      })
    );
  };

  const handleApplyPreset = (presetType: 'spam' | 'b2b' | 'fraud') => {
    let sorted = [...localScripts];
    if (presetType === 'spam') {
      // Prioritize RODO and spam rejections
      sorted.sort((a, b) => {
        const order = ['marketer-full', 'short-rejection', 'recording-notice', 'custom', 'emergency-exit'];
        const indexA = order.indexOf(a.category);
        const indexB = order.indexOf(b.category);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    } else if (presetType === 'b2b') {
      // Prioritize B2B and business
      sorted.sort((a, b) => {
        const order = ['b2b-agreement', 'consumer-complaint', 'recording-notice', 'emergency-exit', 'custom'];
        const indexA = order.indexOf(a.category);
        const indexB = order.indexOf(b.category);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    } else if (presetType === 'fraud') {
      // Prioritize fraud and emergency defense
      sorted.sort((a, b) => {
        const order = ['bank-fraud', 'harassment-stalking', 'debt-collector', 'emergency-exit', 'marketer-full'];
        const indexA = order.indexOf(a.category);
        const indexB = order.indexOf(b.category);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    }
    setLocalScripts(sorted);
  };

  const handleSave = () => {
    onSaveScriptsOrder(localScripts);
    confetti({
      particleCount: 35,
      spread: 50,
      origin: { y: 0.6 }
    });
    onClose();
  };

  const enabledCount = localScripts.filter(s => s.enabled !== false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/95 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              Personalizacja Suwaków na Telefonie
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Ustaw kolejność i widoczność odpowiedzi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Przesuwaj najczęściej używane formuły na górę, a niepotrzebne ukryj, by nie przeszkadzały podczas rozmowy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="font-semibold text-slate-300">Szybkie profile:</span>
            <button
              type="button"
              onClick={() => handleApplyPreset('spam')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600/30 text-indigo-300 border border-slate-800 hover:border-indigo-500 text-[11px] font-medium transition-all"
            >
              🛡️ Anty-Spam & RODO
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('b2b')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600/30 text-emerald-300 border border-slate-800 hover:border-emerald-500 text-[11px] font-medium transition-all"
            >
              💼 Biznes & B2B
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('fraud')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-rose-600/30 text-rose-300 border border-slate-800 hover:border-rose-500 text-[11px] font-medium transition-all"
            >
              🚨 Tarcza Oszustw
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
              Aktywnych na telefonie: {enabledCount}/{localScripts.length}
            </span>
          </div>
        </div>

        {/* List of Scripts with Reorder & Visibility */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {localScripts.map((script, idx) => {
            const isEnabled = script.enabled !== false;
            return (
              <div
                key={script.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isEnabled
                    ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-850 opacity-60'
                }`}
              >
                {/* Position Index & Title */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-slate-700">
                    {idx + 1}
                  </span>

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isEnabled ? 'text-white' : 'text-slate-400 line-through'}`}>
                        {script.title}
                      </span>
                      {script.isUserRecorded && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-semibold border border-emerald-500/30">
                          Twój głos
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span>{script.badge}</span>
                      <span>•</span>
                      {script.autoHangup !== false ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-0.5">
                          <PhoneOff className="w-2.5 h-2.5" /> Auto-rozłącza
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                          <Phone className="w-2.5 h-2.5" /> Na linii
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Controls: Reorder buttons & Visibility toggle */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Up button */}
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveUp(idx)}
                    title="Przesuń wyżej"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Down button */}
                  <button
                    type="button"
                    disabled={idx === localScripts.length - 1}
                    onClick={() => handleMoveDown(idx)}
                    title="Przesuń niżej"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleVisibility(script.id)}
                    title={isEnabled ? 'Kliknij, aby ukryć na telefonie' : 'Kliknij, aby pokazać na telefonie'}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                      isEnabled
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden sm:inline">Widoczny</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Ukryty</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onResetToDefault();
              onClose();
            }}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Przywróć domyślne
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Anuluj
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 active:scale-95"
            >
              <Check className="w-4 h-4" />
              Zastosuj kolejność na telefonie
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
