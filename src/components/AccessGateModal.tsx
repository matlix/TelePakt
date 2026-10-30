import React, { useState, useEffect } from 'react';
import { Shield, Lock, KeyRound, CheckCircle2, ArrowRight, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AccessGateModalProps {
  onAuthenticated: () => void;
}

export const DEFAULT_STAGING_PASSWORD = 'telepakt2025';

export const AccessGateModal: React.FC<AccessGateModalProps> = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Check URL params on mount (?pass=... or ?access=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPass = params.get('pass') || params.get('access') || params.get('password');
    const storedPass = localStorage.getItem('telepakt_staging_pass') || DEFAULT_STAGING_PASSWORD;

    if (urlPass && (urlPass === storedPass || urlPass.toLowerCase() === 'telepakt' || urlPass.toLowerCase() === 'telepakt2025')) {
      handleSuccessUnlock();
    }
  }, []);

  const handleSuccessUnlock = () => {
    setIsSuccess(true);
    localStorage.setItem('telepakt_staging_authenticated', 'true');
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      onAuthenticated();
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPass = localStorage.getItem('telepakt_staging_pass') || DEFAULT_STAGING_PASSWORD;
    const cleanInput = password.trim();

    // Accept either configured password or fallback 'telepakt' / 'telepakt2025'
    if (cleanInput === storedPass || cleanInput.toLowerCase() === 'telepakt' || cleanInput.toLowerCase() === 'telepakt2025') {
      setError(false);
      handleSuccessUnlock();
    } else {
      setError(true);
      setErrorMessage('Nieprawidłowe hasło dostępu. Sprawdź pisownię i spróbuj ponownie.');
    }
  };

  const handleFillDemoPassword = () => {
    setPassword(DEFAULT_STAGING_PASSWORD);
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 sm:p-6 overflow-y-auto">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        
        {/* Shield Icon / Lock Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-600/30 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-bounce" />
          ) : (
            <Lock className="w-8 h-8 text-cyan-400" />
          )}
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Strefa Przedpremierowa (Early Access / Staging)</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            TelePakt.pl
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Serwis znajduje się w trakcie testów przedpremierowych i audytu prawnego PKE/RODO. Dostęp jest ograniczony wyłącznie dla uprawnionych testerów.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Hasło dostępu
              </span>
              <button
                type="button"
                onClick={handleFillDemoPassword}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Uzupełnij hasło ({DEFAULT_STAGING_PASSWORD})
              </button>
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(false);
                }}
                placeholder="Wprowadź hasło..."
                autoFocus
                className={`w-full bg-slate-950 border rounded-xl py-3 pl-4 pr-11 text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                  error
                    ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/40'
                    : 'border-slate-800 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSuccess || !password.trim()}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-indigo-600/30'
            }`}
          >
            {isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Odblokowano pomyślnie...</span>
              </>
            ) : (
              <>
                <span>Odblokuj Dostęp</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Wszelkie prawa zastrzeżone © 2025 TelePakt.pl</span>
        </div>

      </div>
    </div>
  );
};
