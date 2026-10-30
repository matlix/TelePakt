import React, { useState } from 'react';
import { CallLog, CloudProvider } from '../types';
import { CLOUD_PROVIDERS } from '../utils/audioExporter';
import {
  Cloud, Check, X, HardDrive, ShieldCheck, ArrowRight,
  Folder, Lock, Sparkles, ExternalLink, RefreshCw, Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CloudExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: CallLog | null;
  brandName?: string;
  onConfirmSync: (callId: string, provider: CloudProvider, deleteFromServer: boolean) => void;
}

export const CloudExportModal: React.FC<CloudExportModalProps> = ({
  isOpen,
  onClose,
  call,
  brandName = 'TelePakt',
  onConfirmSync,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<CloudProvider>('google-drive');
  const [deleteAfterUpload, setDeleteAfterUpload] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedSuccess, setSyncedSuccess] = useState(false);

  if (!isOpen || !call) return null;

  const activeProviderInfo = CLOUD_PROVIDERS.find(p => p.id === selectedProvider) || CLOUD_PROVIDERS[0];

  const handleStartSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncedSuccess(true);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 }
      });

      onConfirmSync(call.id, selectedProvider, deleteAfterUpload);

      setTimeout(() => {
        setSyncedSuccess(false);
        onClose();
      }, 1400);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/95 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              Eksport do Chmury Osobistej Klienta
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Zapisz nagranie na Twoim dysku w chmurze
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Połączenie z <strong>{call.callerNumber}</strong> ({call.timestamp})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Provider Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Wybierz usługę chmurową:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CLOUD_PROVIDERS.map((provider) => {
                const isSelected = selectedProvider === provider.id;
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setSelectedProvider(provider.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: provider.color }}
                        />
                        {provider.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          Wybrano
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {provider.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination Path Preview */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-300 font-semibold">
              <span className="flex items-center gap-1.5">
                <Folder className="w-4 h-4 text-amber-400" />
                Folder docelowy w {activeProviderInfo.name}:
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Szyfrowany (TLS 1.3)</span>
            </div>
            <div className="font-mono text-[11px] text-indigo-300 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 truncate">
              {activeProviderInfo.folderPath}
            </div>
            <p className="text-[10px] text-slate-400 leading-snug">
              Zostanie zapisany plik audio <code className="text-white">{brandName}_Dowod_{call.callerNumber.replace(/[^0-9]/g, '')}.wav</code> wraz z metryką dowodową UKE/UODO.
            </p>
          </div>

          {/* Zero-Storage Server Checkbox */}
          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteAfterUpload}
                onChange={(e) => setDeleteAfterUpload(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-rose-500 focus:ring-rose-500 h-4 w-4 bg-slate-900"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Usuń to nagranie z serwerów {brandName} natychmiast po wysłaniu do mojej chmury (Zero-Storage)
                </span>
                <span className="text-[11px] text-slate-400 leading-snug block mt-0.5">
                  Gwarantuje, że plik nie pozostanie w chmurze operatora telefonii – będziesz jedynym dysponentem nagrania na własnym koncie chmurowym.
                </span>
              </div>
            </label>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            Anuluj
          </button>

          <button
            type="button"
            disabled={isSyncing || syncedSuccess}
            onClick={handleStartSync}
            className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-lg flex items-center gap-1.5 transition-all ${
              syncedSuccess
                ? 'bg-emerald-600 shadow-emerald-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 active:scale-95'
            }`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Wysyłam do {activeProviderInfo.name}...
              </>
            ) : syncedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                Zsynchronizowano pomyślnie!
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4" />
                Zapisz na moim koncie {activeProviderInfo.name}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
