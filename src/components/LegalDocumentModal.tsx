import React, { useState } from 'react';
import {
  Scale, Shield, FileText, Check, Copy, Download,
  X, BookOpen, AlertCircle, ExternalLink, Cookie
} from 'lucide-react';
import {
  TERMS_OF_SERVICE_TEXT,
  PRIVACY_POLICY_TEXT,
  RODO_CLAUSE_TEXT,
  USER_MANUAL_TEXT,
  COOKIES_POLICY_TEXT
} from '../data/legalDocuments';

export type LegalDocType = 'privacy' | 'terms' | 'rodo' | 'manual' | 'cookies';

interface LegalDocumentModalProps {
  initialDoc: LegalDocType;
  isOpen: boolean;
  onClose: () => void;
}

interface DocMeta {
  id: LegalDocType;
  title: string;
  badge: string;
  icon: React.ReactNode;
  content: string;
  filename: string;
}

export const LegalDocumentModal: React.FC<LegalDocumentModalProps> = ({
  initialDoc,
  isOpen,
  onClose
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);
  const [copied, setCopied] = useState(false);

  // Sync state if initialDoc changes when opened
  React.useEffect(() => {
    setActiveDoc(initialDoc);
  }, [initialDoc]);

  if (!isOpen) return null;

  const docs: Record<LegalDocType, DocMeta> = {
    privacy: {
      id: 'privacy',
      title: 'Polityka Prywatności (Zasada Zero-Storage)',
      badge: 'BEZWZGLĘDNA PRYWATNOŚĆ • PRIVACY BY DESIGN',
      icon: <Shield className="w-4 h-4 text-emerald-400" />,
      content: PRIVACY_POLICY_TEXT,
      filename: 'telepakt-polityka-prywatnosci-zero-storage.txt'
    },
    terms: {
      id: 'terms',
      title: 'Regulamin Świadczenia Usług TelePakt.pl',
      badge: 'ZGODNY Z PKE 2024 (DZ.U. 2024 POZ. 1221)',
      icon: <Scale className="w-4 h-4 text-cyan-400" />,
      content: TERMS_OF_SERVICE_TEXT,
      filename: 'telepakt-regulamin-serwisu.txt'
    },
    rodo: {
      id: 'rodo',
      title: 'Klauzula RODO & Zgłoszenie Naruszenia',
      badge: 'ART. 13/14 ORAZ ART. 21 RODO',
      icon: <FileText className="w-4 h-4 text-indigo-400" />,
      content: RODO_CLAUSE_TEXT,
      filename: 'telepakt-klauzula-rodo-dowod.txt'
    },
    manual: {
      id: 'manual',
      title: 'Oficjalna Instrukcja Obsługi Aplikacji',
      badge: 'PRZEWODNIK PLAY, PLUS, ORANGE, T-MOBILE',
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      content: USER_MANUAL_TEXT,
      filename: 'telepakt-instrukcja-obslugi.txt'
    },
    cookies: {
      id: 'cookies',
      title: 'Polityka Cookies & Pamięci Lokalnej (PKE)',
      badge: 'ART. 399 PKE (DZ.U. 2024 POZ. 1221)',
      icon: <Cookie className="w-4 h-4 text-amber-400" />,
      content: COOKIES_POLICY_TEXT,
      filename: 'telepakt-polityka-cookies-pke.txt'
    }
  };

  const current = docs[activeDoc];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([current.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = current.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
              {current.icon}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                {current.badge}
              </span>
              <h3 className="font-bold text-white text-base sm:text-lg">
                {current.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm cursor-pointer transition-colors"
            aria-label="Zamknij"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Document Tab Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-5 p-2 bg-slate-950/90 border-b border-slate-800 gap-1.5 text-xs font-semibold">
          {[
            { id: 'privacy' as LegalDocType, label: 'Prywatność' },
            { id: 'terms' as LegalDocType, label: 'Regulamin' },
            { id: 'rodo' as LegalDocType, label: 'Klauzula RODO' },
            { id: 'cookies' as LegalDocType, label: 'Cookies (PKE)' },
            { id: 'manual' as LegalDocType, label: 'Instrukcja' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDoc(tab.id)}
              className={`py-2 px-2 rounded-xl transition-all cursor-pointer text-center truncate ${
                activeDoc === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content View */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-300 text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap selection:bg-cyan-500 selection:text-white bg-slate-950/40">
          <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800/80 font-mono text-[11px] sm:text-xs leading-relaxed text-slate-300 shadow-inner">
            {current.content}
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Oficjalny dokument prawny TelePakt.pl • Zgodność z PKE i RODO</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{copied ? 'Skopiowano treść!' : 'Kopiuj'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Pobierz .TXT</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Zamknij
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
