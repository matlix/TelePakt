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
  
  // Apple ID specific options
  const [appleHideEmail, setAppleHideEmail] = useState(true);
  const [showAppleDetails, setShowAppleDetails] = useState(false);

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

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoadingProvider('google');

    try {
      // Simulate realistic Google OAuth with a short natural delay
      await new Promise(r => setTimeout(r, 600));
      const user = await authService.loginWithGoogle();
      handleAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logowanie przez Google nie powiodło się.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    setErrorMsg(null);
    setLoadingProvider('apple');

    try {
      await new Promise(r => setTimeout(r, 600));
      const user = await authService.loginWithApple(appleHideEmail);
      handleAuthSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Logowanie przez Apple ID nie powiodło się.');
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
            
            {/* 1. SOCIAL / SSO LOGIN BUTTONS (GOOGLE & APPLE) */}
            <div className="space-y-2.5">
              
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loadingProvider !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {/* Official Google Logo SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>
                  {loadingProvider === 'google' 
                    ? 'Logowanie przez Google...' 
                    : mode === 'login' 
                    ? 'Kontynuuj z kontem Google (Gmail)' 
                    : 'Zarejestruj się przez Google (Gmail)'}
                </span>
              </button>

              {/* Apple Button */}
              <button
                type="button"
                onClick={() => {
                  if (showAppleDetails) {
                    handleAppleSignIn();
                  } else {
                    setShowAppleDetails(true);
                  }
                }}
                disabled={loadingProvider !== null}
                className="w-full py-2.5 px-4 rounded-xl bg-black hover:bg-slate-950 text-white font-bold text-xs flex items-center justify-center gap-2.5 border border-slate-700 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {/* Apple Logo SVG */}
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.67-7.81-11.96-14.34-6.41-9.78-11.48-20.91-15.19-33.39-3.71-12.48-5.57-24.28-5.57-35.39 0-14.28 3.51-26.04 10.53-35.29 7.02-9.25 15.82-13.98 26.4-14.2 4.8.12 10.15 1.41 16.06 3.87 5.91 2.46 9.69 3.73 11.33 3.81 1.41-.12 5.4-1.46 11.96-4.04 6.56-2.58 12.23-3.79 17.02-3.63 11.98.63 21.6 4.98 28.87 13.04-10.45 6.32-15.6 14.93-15.46 25.82.14 8.78 3.48 16.14 10.02 22.08 6.54 5.94 14.18 9.38 22.92 10.31-2.28 6.96-5.11 14.2-8.49 21.72zM119.22 31.84c0-7.39 2.68-14.36 8.04-20.91 5.36-6.55 11.98-10.53 19.86-11.93.33 1.25.49 2.45.49 3.6 0 7.39-2.73 14.39-8.19 21-5.46 6.61-12.18 10.61-20.16 12.01-.04-1.25-.04-2.5-.04-3.77z"/>
                </svg>
                <span>
                  {loadingProvider === 'apple' 
                    ? 'Logowanie przez Apple ID...' 
                    : mode === 'login' 
                    ? 'Zaloguj się przez Apple' 
                    : 'Zarejestruj się przez Apple'}
                </span>
              </button>

              {/* Apple Private Relay Option Drawer */}
              {showAppleDetails && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-2 animate-in fade-in">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Prywatność Apple Sign-In:</span>
                  </div>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="applePrivacy"
                      checked={appleHideEmail}
                      onChange={() => setAppleHideEmail(true)}
                      className="text-cyan-500"
                    />
                    <span>Ukryj mój e-mail (adres @privaterelay.appleid.com)</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="applePrivacy"
                      checked={!appleHideEmail}
                      onChange={() => setAppleHideEmail(false)}
                      className="text-cyan-500"
                    />
                    <span>Udostępnij mój prawdziwy e-mail</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Kontynuuj logowanie z Apple ID ➔
                  </button>
                </div>
              )}

            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900 px-3 text-[10px] font-mono uppercase text-slate-500 shrink-0">
                lub przez e-mail i hasło
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>

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
                      onClick={() => setErrorMsg('W trybie Zero-Storage hasło jest zapisane w pamięci lokalnej. Wpisz nowe lub zaloguj się przez Google/Apple.')}
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
