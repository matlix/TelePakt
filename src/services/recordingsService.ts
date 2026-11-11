import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { API_URL } from '../config';
import { authService } from './authService';

/** Nagranie połączenia zalogowanego użytkownika (lista z serwera). */
export interface RecordingItem {
  call_sid: string;
  timestamp: string;
  duration_seconds: number;
  caller_number: string;
  own_call: boolean;
  ready: boolean;
}

export interface RecordingsList {
  recordings: RecordingItem[];
  needs_phone: boolean;
}

/** Błąd z czytelnym komunikatem z serwera (nie ogólne "coś poszło nie tak"). */
async function failure(res: Response, fallback: string): Promise<Error> {
  try {
    const data = await res.json();
    return new Error(data?.error || data?.detail || `${fallback} (HTTP ${res.status})`);
  } catch {
    return new Error(`${fallback} (HTTP ${res.status})`);
  }
}

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const token = authService.getToken();
  if (!token) throw new Error('Zaloguj się ponownie.');
  try {
    return await fetch(`${API_URL}/api/telephony${path}`, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
  } catch {
    throw new Error('Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.');
  }
}

export const recordingsService = {
  async list(): Promise<RecordingsList> {
    const res = await call('/recordings/');
    if (!res.ok) throw await failure(res, 'Nie udało się pobrać listy nagrań');
    return res.json();
  },

  /** Pobiera nagranie jako adres blob do odtwarzacza (serwer przepuszcza plik od dostawcy, nie zapisuje go). */
  async audioUrl(callSid: string): Promise<string> {
    const res = await call(`/recordings/${encodeURIComponent(callSid)}/audio/`);
    if (!res.ok) throw await failure(res, 'Nie udało się pobrać nagrania');
    return URL.createObjectURL(await res.blob());
  },

  async audioBlob(callSid: string): Promise<Blob> {
    const res = await call(`/recordings/${encodeURIComponent(callSid)}/audio/`);
    if (!res.ok) throw await failure(res, 'Nie udało się pobrać nagrania');
    return res.blob();
  },

  /**
   * Zapisuje nagranie poza TelePakt: na Androidzie otwiera systemowe menu "Udostępnij", w którym wybierasz
   * Dysk Google, Dropbox, OneDrive, e-mail itp.; w przeglądarce pobiera plik. Nie wymaga kont w chmurach po
   * naszej stronie - plik trafia tam, dokąd go wyślesz.
   */
  async share(callSid: string): Promise<void> {
    const blob = await this.audioBlob(callSid);
    const name = `telepakt-nagranie-${callSid.slice(-6)}.${blob.type.includes('wav') ? 'wav' : 'mp3'}`;
    if (Capacitor.isNativePlatform()) {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Nie udało się przygotować pliku do udostępnienia.'));
        reader.readAsDataURL(blob);
      });
      const file = await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: Directory.Cache });
      await Share.share({ title: 'Nagranie rozmowy z TelePakt', files: [file.uri] });
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  },

  /** Zero-Storage: usuwa nagranie u dostawcy i w naszej bazie. */
  async remove(callSid: string): Promise<void> {
    const res = await call('/zero-storage-delete/', { method: 'POST', body: JSON.stringify({ call_sid: callSid }) });
    if (!res.ok) throw await failure(res, 'Nie udało się usunąć nagrania');
  },
};
