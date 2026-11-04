import React, { useState } from 'react';
import { UserAccount } from '../types';
import { authService } from '../services/authService';
import {
  User, Shield, Lock, Smartphone, LogOut, CheckCircle2,
  Calendar, Mail, X, Check, ArrowRight
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  user: UserAccount;
  onClose: () => void;
  onLogout: () => void;
  onUpdate: (updated: UserAccount) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout,
  onUpdate,
}) => {
  const [phoneNumber, setPhoneNumber] = useState(user.phoneProtected || '+48 500 123 456');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await authService.updateProfile({ phoneProtected: phoneNumber });
      onUpdate(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      console.error('Update phone error:', err);
    }
  };

  const handleSignOut = () => {
    authService.logout();
    onLogout();
    onClose();
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

        {/* User Avatar & Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800/80 pb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 border border-cyan-400/40 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="space-y-0.5 min-w-0">
            <h3 className="font-black text-white text-base truncate">{user.name}</h3>
            <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                user.provider === 'google'
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                  : user.provider === 'apple'
                  ? 'bg-slate-800 text-slate-200 border border-slate-700'
                  : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
              }`}>
                {user.provider === 'google' ? 'Konto Google' : user.provider === 'apple' ? 'Apple ID' : 'E-mail'}
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Zweryfikowany
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Plan Card */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Pakiet Ochrony:</span>
            <span className="font-bold text-cyan-400 font-mono">
              {user.subscriptionPlan === 'b2b' ? 'Biznes B2B' : user.subscriptionPlan === 'shield' ? 'Tarcza Osobista' : 'Pakiet Podstawowy'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Dołączono:</span>
            <span className="text-slate-300 font-mono">{user.createdAt}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Tryb Danych:</span>
            <span className="text-emerald-400 font-semibold">100% Zero-Storage (pamięć lokalna)</span>
          </div>
        </div>

        {/* Protected Phone Configuration */}
        <form onSubmit={handleSavePhone} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Chroniony numer telefonu w TelePakt:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Smartphone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+48 500 123 456"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
            >
              Zapisz
            </button>
          </div>
          {savedSuccess && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Numer telefonu został zaktualizowany!</span>
            </div>
          )}
        </form>

        {/* Security & Sign Out Actions */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bezpieczna sesja</span>
          </span>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-rose-400 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Wyloguj się</span>
          </button>
        </div>

      </div>
    </div>
  );
};
