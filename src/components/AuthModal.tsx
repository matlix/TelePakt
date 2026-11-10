import React, { useState } from 'react';
import { UserAccount, AuthProvider } from '../types';
import { authService } from '../services/authService';
import {
  Shield, Lock, Mail, User, Eye, EyeOff, ArrowRight,
  CheckCircle2, AlertCircle, X, Sparkles, Smartphone, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  

  // States
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<UserAccount | null>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoadingProvider('email');

    try {
      let user: UserAccount;
      if (mode === 'register') {
        if (!termsAccepted) {
          throw new Error('Zaakceptuj Regulamin i Politykę Prywatności, aby założyć konto.');
        }
        user = await authService.registerWithEmail(name, email, password);
      } else {
        user = await authService.loginWithEmail(email, password);
      }

      handleAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Wystąpił błąd autoryzacji.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAuthSuccess = (user: UserAccount) => {
    setSuccessUser(user);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      onSuccess(user);
      onClose();
      setSuccessUser(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Zamknij"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-600/30 to-purple-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto shadow-lg shadow-cyan-500/10">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'login' ? 'Zaloguj się do TelePakt' : 'Załóż Konto TelePakt'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {mode === 'login' 
              ? 'Dostęp do Twojej tarczy anty-spam, rejestru dowodowego UKE i zapisanych formuł.' 
              : 'Bezpłatna ochrona połączeń w architekturze 100% Zero-Storage.'}
          </p>
        </div>

        {/* Mode Selector Tabs (Login vs Register) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Logowanie
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Rejestracja
          </button>
        </div>

        {/* Success Confirmation Animation */}
        {successUser ? (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-white text-base">
              {mode === 'login' ? 'Zalogowano pomyślnie!' : 'Konto utworzone pomyślnie!'}
            </h4>
            <p className="text-xs text-slate-300">
              Witaj, <strong>{successUser.name}</strong> ({successUser.email}). Twoja tarcza anty-spam jest aktywna.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3.5">
              
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Twoje Imię i Nazwisko / Nick:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="np. Jan Kowalski"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adres E-mail:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="twoj-email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Hasło:
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setErrorMsg('Aby zmienić hasło, użyj opcji „Nie pamiętam hasła” na ekranie logowania w aplikacji TelePakt.')}
                      className="text-[10px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Nie pamiętasz hasła?
                    </button>
                  )}
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Wpisz hasło (min. 6 znaków)..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-400 leading-relaxed">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-950"
                    />
                    <span>
                      Akceptuję Regulamin oraz potwierdzam zapoznanie się z Polityką Prywatności Zero-Storage (art. 398 i 399 PKE oraz art. 21 RODO).
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingProvider !== null}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{mode === 'login' ? 'Zaloguj się' : 'Utwórz bezpłatne konto'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </form>

          </div>
        )}

        {/* Footer info about Zero-Storage privacy */}
        <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gwarancja Zero-Storage • Twoje dane są chronione</span>
        </div>

      </div>
    </div>
  );
};
