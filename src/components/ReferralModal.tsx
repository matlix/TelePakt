import React, { useState, useEffect } from 'react';
import {
  Gift, Users, Copy, Check, Share2, Sparkles, X,
  Shield, CheckCircle2, ArrowRight, Smartphone, Info, Award
} from 'lucide-react';
import { ReferralService, UserReferralState } from '../services/referralService';
import { UserAccount } from '../types';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onBonusAwarded?: (bonusMinutes: number) => void;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onBonusAwarded,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [redeemStatus, setRedeemStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const userId = currentUser?.id || 'local_user';
  const myCode = ReferralService.getReferralCode(currentUser);
  const [referralState, setReferralState] = useState<UserReferralState>(() =>
    ReferralService.getReferralState(userId)
  );

  useEffect(() => {
    setReferralState(ReferralService.getReferralState(userId));
    // Check if there is a pending ref code captured from URL
    const pending = ReferralService.getPendingReferralCode();
    if (pending && !referralState.referredBy && pending !== myCode) {
      setFriendCodeInput(pending);
    }
  }, [userId, myCode, referralState.referredBy]);

  if (!isOpen) return null;

  const referralLink = `${window.location.origin}?ref=${myCode}`;
  const shareMessage = `Hej! Zainstaluj TelePakt.pl przeciw nękającym telemarketerom z moim kodem ${myCode} i odbierz dodatkową darmową minutę ochrony: ${referralLink}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TelePakt - Prawna Tarcza Anty-Spam',
          text: shareMessage,
          url: referralLink,
        });
      } catch {
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;

    const res = ReferralService.redeemCode(userId, friendCodeInput);
    setRedeemStatus({
      success: res.success,
      message: res.message
    });

    if (res.success) {
      const updated = ReferralService.getReferralState(userId);
      setReferralState(updated);
      if (onBonusAwarded) {
        onBonusAwarded(res.bonusAwarded);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/20">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Program Poleceń TelePakt</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Darmowe Minuty
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Polecaj tarczę znajomym i rozmawiaj bez limitów za darmo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Hero Banner: How it works */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-950 to-indigo-950/60 border border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase font-mono">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Zasada Podwójnej Korzyści (Win-Win)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Nowy Znajomy otrzymuje:</span>
                <div className="text-base font-black text-emerald-400 font-mono">+1 minutę extra</div>
                <p className="text-[11px] text-slate-300 leading-tight">
                  Łącznie <strong>4 minuty gratis</strong> na start zamiast 3 minut!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ty (Polecający) otrzymujesz:</span>
                <div className="text-base font-black text-purple-300 font-mono">+2 do +7 minut</div>
                <p className="text-[11px] text-slate-300 leading-tight">
                  <strong>+2 minuty</strong> za instalację znajomego oraz <strong>+5 minut</strong>, gdy kupi dowolny pakiet!
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Wszystkie zdobyte minuty są <strong>bezterminowe</strong> i nigdy same nie znikają z Twojego salda.</span>
            </div>
          </div>

          {/* Section 1: Your Referral Code */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Twój Osobisty Kod Polecenia:</span>
            </label>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-mono block">Podaj ten kod znajomym:</span>
                <div className="text-2xl font-black text-purple-300 font-mono tracking-wider">
                  {myCode}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Skopiowano!' : 'Kopiuj kod'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-xs font-black text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Udostępnij link</span>
                </button>
              </div>
            </div>

            {/* Direct Link Preview */}
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono flex items-center justify-between gap-2">
              <span className="truncate">{referralLink}</span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-purple-400 hover:text-purple-300 text-xs font-semibold shrink-0 cursor-pointer"
              >
                {copiedLink ? 'Skopiowano!' : 'Kopiuj'}
              </button>
            </div>
          </div>

          {/* Section 2: Redeem a Friend's Code */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <label className="text-xs font-bold text-white block">
              Dostałeś kod od znajomego? Wpisz go tutaj:
            </label>

            {referralState.referredBy ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Aktywowałeś kod znajomego: <strong>{referralState.referredBy}</strong>. Bonusowa minuta jest już w Twoim saldzie!
                </span>
              </div>
            ) : (
              <form onSubmit={handleRedeem} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value)}
                    placeholder="Wpisz np. TELE-A1B2"
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono uppercase"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer transition-colors shrink-0"
                  >
                    Aktywuj (+1 min)
                  </button>
                </div>

                {redeemStatus && (
                  <div
                    className={`text-[11px] p-2 rounded-xl border flex items-center gap-1.5 ${
                      redeemStatus.success
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {redeemStatus.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Info className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{redeemStatus.message}</span>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Section 3: Referral Stats */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Zaproszeni Znajomi:</span>
              <div className="text-xl font-black text-white font-mono">
                {referralState.referrals.length} osób
              </div>
              <p className="text-[10px] text-slate-500">
                Płatnych pakietów: {referralState.referrals.filter(r => r.hasPurchased).length}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Zdobyte Minuty Bonusowe:</span>
              <div className="text-xl font-black text-emerald-400 font-mono">
                +{referralState.bonusMinutes} minut
              </div>
              <p className="text-[10px] text-emerald-400/80 font-medium">
                Wartość rynkowa: {(referralState.bonusMinutes * 0.5).toFixed(2)} zł
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>Naliczanie automatyczne • Minuty bezterminowe</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Zamknij
          </button>
        </div>

      </div>
    </div>
  );
};
