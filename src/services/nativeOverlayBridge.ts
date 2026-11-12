import { Capacitor, registerPlugin } from '@capacitor/core';

export interface OverlayStatus {
  hasOverlayPermission: boolean;
  hasPhoneStatePermission: boolean;
  hasMergeService: boolean;
  isNative: boolean;
  platform: string;
}

export interface TelePaktOverlayPluginInterface {
  checkOverlayPermission(): Promise<{ granted: boolean }>;
  requestOverlayPermission(): Promise<void>;
  showOverlay(options?: { phoneNumber?: string; callerName?: string }): Promise<{ success: boolean }>;
  hideOverlay(): Promise<{ success: boolean }>;
  saveConfig(options: { apiUrl: string; token: string }): Promise<void>;
  checkPhoneStatePermission(): Promise<{ granted: boolean }>;
  requestPhoneStatePermission(): Promise<{ granted: boolean }>;
  getPhoneNumbers(): Promise<{ numbers: SimNumber[]; sims: number }>;
  checkConferenceSupport(): Promise<ConferenceSupport>;
  checkMergeService(): Promise<{ enabled: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  getDialerLabels(): Promise<{ labels: string }>;
}

/** Czy operator pozwala na rozmowy konferencyjne (3-way). `known=false`: brak aktywnej karty SIM, nic nie wiadomo. */
export interface ConferenceSupport {
  anySupported: boolean;
  known: boolean;
  sims: { slot: number; supported: boolean; carrier: string }[];
}

/** Numer własnej karty SIM odczytany z telefonu (slot 1 lub 2 przy dual SIM). */
export interface SimNumber {
  slot: number;
  number: string;
  label: string;
}

const TelePaktOverlayNative = registerPlugin<TelePaktOverlayPluginInterface>('TelePaktOverlay');

export class NativeOverlayBridge {
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  static async checkStatus(): Promise<OverlayStatus> {
    if (!this.isNative()) {
      return {
        hasOverlayPermission: false,
        hasPhoneStatePermission: false,
        hasMergeService: false,
        isNative: false,
        platform: 'web'
      };
    }

    try {
      const overlayRes = await TelePaktOverlayNative.checkOverlayPermission();
      const phoneRes = await TelePaktOverlayNative.checkPhoneStatePermission();
      const mergeRes = await TelePaktOverlayNative.checkMergeService().catch(() => ({ enabled: false }));
      return {
        hasOverlayPermission: !!overlayRes?.granted,
        hasPhoneStatePermission: !!phoneRes?.granted,
        hasMergeService: !!mergeRes?.enabled,
        isNative: true,
        platform: Capacitor.getPlatform()
      };
    } catch {
      return {
        hasOverlayPermission: false,
        hasPhoneStatePermission: false,
        hasMergeService: false,
        isNative: true,
        platform: Capacitor.getPlatform()
      };
    }
  }

  static async requestOverlayPermission(): Promise<void> {
    if (!this.isNative()) {
      return;
    }
    try {
      await TelePaktOverlayNative.requestOverlayPermission();
    } catch (err) {
      console.warn('Failed to open overlay settings:', err);
    }
  }

  static async requestPhonePermission(): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }
    try {
      const res = await TelePaktOverlayNative.requestPhoneStatePermission();
      return !!res?.granted;
    } catch (err) {
      console.warn('Failed to request phone state permission:', err);
      return false;
    }
  }

  /** Przyciski widziane ostatnio w aplikacji Telefon przez usługę scalania (diagnostyka); pusty tekst, gdy brak. */
  static async getDialerLabels(): Promise<string> {
    if (!this.isNative()) return '';
    try {
      return (await TelePaktOverlayNative.getDialerLabels()).labels || '';
    } catch {
      return '';
    }
  }

  /** Otwiera Ustawienia > Ułatwienia dostępu, gdzie użytkownik włącza automatyczne scalanie rozmowy. */
  static async openAccessibilitySettings(): Promise<void> {
    if (!this.isNative()) return;
    try {
      await TelePaktOverlayNative.openAccessibilitySettings();
    } catch (err) {
      console.warn('Failed to open accessibility settings:', err);
    }
  }

  /** Sprawdza w telefonie, czy operator pozwala na rozmowy konferencyjne; null, gdy nie da się tego ustalić. */
  static async checkConferenceSupport(): Promise<ConferenceSupport | null> {
    if (!this.isNative()) return null;
    try {
      return await TelePaktOverlayNative.checkConferenceSupport();
    } catch (err) {
      console.warn('Failed to check conference support:', err);
      return null;
    }
  }

  /** Numery własnych kart SIM; pusta lista = operator nie zapisał numeru na karcie. Rzuca błąd z czytelnym powodem. */
  static async getPhoneNumbers(): Promise<{ numbers: SimNumber[]; sims: number }> {
    if (!this.isNative()) throw new Error('Odczyt numeru działa tylko w aplikacji na telefonie.');
    return TelePaktOverlayNative.getPhoneNumbers();
  }

  /** Przekazuje do natywnej nakładki adres API i token sesji (przycisk "Nagrywaj"); pusty token po wylogowaniu. */
  static async saveConfig(apiUrl: string, token: string): Promise<void> {
    if (!this.isNative()) return;
    try {
      await TelePaktOverlayNative.saveConfig({ apiUrl, token });
    } catch (err) {
      console.warn('Failed to save overlay config:', err);
    }
  }

  static async triggerNativeOverlay(phoneNumber = '+48 799 555 123', callerName = 'Potencjalny SPAM (Fotowoltaika)'): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }
    try {
      const res = await TelePaktOverlayNative.showOverlay({ phoneNumber, callerName });
      return !!res?.success;
    } catch (err) {
      console.warn('Failed to show native overlay:', err);
      return false;
    }
  }

  static async hideNativeOverlay(): Promise<boolean> {
    if (!this.isNative()) {
      return false;
    }
    try {
      const res = await TelePaktOverlayNative.hideOverlay();
      return !!res?.success;
    } catch (err) {
      console.warn('Failed to hide native overlay:', err);
      return false;
    }
  }
}
