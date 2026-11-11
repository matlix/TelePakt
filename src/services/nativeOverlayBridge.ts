import { Capacitor, registerPlugin } from '@capacitor/core';

export interface OverlayStatus {
  hasOverlayPermission: boolean;
  hasPhoneStatePermission: boolean;
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
        isNative: false,
        platform: 'web'
      };
    }

    try {
      const overlayRes = await TelePaktOverlayNative.checkOverlayPermission();
      const phoneRes = await TelePaktOverlayNative.checkPhoneStatePermission();
      return {
        hasOverlayPermission: !!overlayRes?.granted,
        hasPhoneStatePermission: !!phoneRes?.granted,
        isNative: true,
        platform: Capacitor.getPlatform()
      };
    } catch {
      return {
        hasOverlayPermission: false,
        hasPhoneStatePermission: false,
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
