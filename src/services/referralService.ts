import { UserAccount } from '../types';
import { authService } from './authService';

export interface ReferralRecord {
  friendId: string;
  friendName: string;
  joinedAt: string;
  hasPurchased: boolean;
  minutesAwarded: number;
}

export interface UserReferralState {
  code: string;
  referredBy?: string;
  bonusMinutes: number;
  referrals: ReferralRecord[];
}

const STORAGE_KEY_REFERRALS = 'telepakt_referrals_data';
const PENDING_REF_STORAGE = 'telepakt_pending_ref_code';

export class ReferralService {
  /**
   * Generates or retrieves the unique referral code for a user
   */
  static getReferralCode(user?: UserAccount | null): string {
    if (!user) return 'TELE-GUEST';
    
    // Check if code is already stored
    const data = this.getReferralState(user.id);
    if (data.code && data.code !== 'TELE-GUEST') {
      return data.code;
    }

    // Deterministic friendly code: TELE + 4 uppercase alphanumeric from ID or email
    const cleanId = (user.id || user.email || 'USER').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const hashPart = cleanId.slice(0, 4).padEnd(4, 'X');
    const newCode = `TELE-${hashPart}`;

    this.saveReferralState(user.id, {
      ...data,
      code: newCode
    });

    return newCode;
  }

  static getReferralState(userId: string): UserReferralState {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY_REFERRALS) || '{}');
      if (all[userId]) {
        return all[userId];
      }
    } catch {}

    return {
      code: `TELE-${userId.slice(0, 4).toUpperCase()}`,
      bonusMinutes: 0,
      referrals: []
    };
  }

  static saveReferralState(userId: string, state: UserReferralState): void {
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY_REFERRALS) || '{}');
      all[userId] = state;
      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(all));
    } catch (err) {
      console.warn('Failed to save referral state to localStorage:', err);
    }
  }

  /**
   * Reads URL ?ref=... parameter and stores for next sign-up/onboarding
   */
  static captureUrlReferralCode(): string | null {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref') || urlParams.get('kod');
    if (ref && ref.trim()) {
      const clean = ref.trim().toUpperCase();
      try {
        localStorage.setItem(PENDING_REF_STORAGE, clean);
      } catch {}
      return clean;
    }
    return null;
  }

  static getPendingReferralCode(): string | null {
    try {
      return localStorage.getItem(PENDING_REF_STORAGE);
    } catch {
      return null;
    }
  }

  static clearPendingReferralCode(): void {
    try {
      localStorage.removeItem(PENDING_REF_STORAGE);
    } catch {}
  }

  /**
   * Redeems a referral code entered by the current user.
   * Awards:
   *  - +1 bonus minute to current user (the invitee)
   *  - +2 bonus minutes to the inviter
   */
  static redeemCode(currentUserId: string, codeToRedeem: string): {
    success: boolean;
    message: string;
    bonusAwarded: number;
  } {
    const cleanCode = codeToRedeem.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Wprowadź kod polecenia.', bonusAwarded: 0 };
    }

    const myState = this.getReferralState(currentUserId);

    // Prevent self-referral
    if (myState.code === cleanCode) {
      return { success: false, message: 'Nie możesz użyć własnego kodu polecenia.', bonusAwarded: 0 };
    }

    // Prevent multiple code redemptions
    if (myState.referredBy) {
      return {
        success: false,
        message: `Już wcześniej aktywowano kod polecenia (${myState.referredBy}). Każdy abonent może wykorzystać kod powitalny tylko jeden raz.`,
        bonusAwarded: 0
      };
    }

    // Award +1 minute to the invitee (new user)
    myState.referredBy = cleanCode;
    myState.bonusMinutes += 1;
    this.saveReferralState(currentUserId, myState);

    // Also credit +2 minutes to the inviter
    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY_REFERRALS) || '{}');
      let inviterFound = false;

      for (const [uid, userRecord] of Object.entries(all) as [string, UserReferralState][]) {
        if (userRecord.code === cleanCode) {
          userRecord.bonusMinutes += 2;
          userRecord.referrals.push({
            friendId: currentUserId,
            friendName: 'Nowy Abonent',
            joinedAt: new Date().toISOString(),
            hasPurchased: false,
            minutesAwarded: 2
          });
          all[uid] = userRecord;
          inviterFound = true;
          break;
        }
      }

      if (!inviterFound) {
        // If inviter wasn't cached yet, create a stub record so their minutes wait for them
        all[`stub_${cleanCode}`] = {
          code: cleanCode,
          bonusMinutes: 2,
          referrals: [{
            friendId: currentUserId,
            friendName: 'Nowy Abonent',
            joinedAt: new Date().toISOString(),
            hasPurchased: false,
            minutesAwarded: 2
          }]
        };
      }

      localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(all));
    } catch (err) {
      console.warn('Error crediting inviter:', err);
    }

    this.clearPendingReferralCode();

    return {
      success: true,
      message: 'Kod polecenia poprawny! Otrzymujesz +1 dodatkową minutę bezterminowej ochrony.',
      bonusAwarded: 1
    };
  }

  /**
   * Called when a user buys a package (14,99 zł or 149,99 zł).
   * Awards an extra +5 minutes to the person who invited this user!
   */
  static onUserPurchasedPackage(currentUserId: string): { bonusAwardedToInviter: boolean } {
    const myState = this.getReferralState(currentUserId);
    if (!myState.referredBy) {
      return { bonusAwardedToInviter: false };
    }

    const inviterCode = myState.referredBy;

    try {
      const all = JSON.parse(localStorage.getItem(STORAGE_KEY_REFERRALS) || '{}');
      for (const [uid, userRecord] of Object.entries(all) as [string, UserReferralState][]) {
        if (userRecord.code === inviterCode) {
          userRecord.bonusMinutes += 5;
          const ref = userRecord.referrals.find(r => r.friendId === currentUserId);
          if (ref) {
            ref.hasPurchased = true;
            ref.minutesAwarded += 5;
          }
          all[uid] = userRecord;
          localStorage.setItem(STORAGE_KEY_REFERRALS, JSON.stringify(all));
          return { bonusAwardedToInviter: true };
        }
      }
    } catch {}

    return { bonusAwardedToInviter: false };
  }
}
