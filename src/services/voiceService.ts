import { API_URL } from '../config';
import { authService } from './authService';

export interface VoiceOption { id: string; label: string }
export interface SituationOption { id: string; label: string }

export interface VoiceSettings {
  voice: string;
  rate: number;
  voices: VoiceOption[];
  rate_min: number;
  rate_max: number;
  situations: SituationOption[];
}

export interface VoiceMessage {
  id: number;
  title: string;
  situation: string;
  situation_label: string;
  text: string;
  source: 'tts' | 'recorded';
  has_audio: boolean;
  audio_seconds: number;
  is_active: boolean;
  position: number;
}

async function failure(res: Response, fallback: string): Promise<Error> {
  try {
    const data = await res.json();
    return new Error(data?.error || data?.detail || `${fallback} (HTTP ${res.status})`);
  } catch {
    return new Error(`${fallback} (HTTP ${res.status})`);
  }
}

async function call(path: string, init: RequestInit = {}, json = true): Promise<Response> {
  const token = authService.getToken();
  if (!token) throw new Error('Zaloguj się ponownie.');
  try {
    return await fetch(`${API_URL}/api/telephony${path}`, {
      ...init,
      headers: { ...(json ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}), Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error('Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.');
  }
}

export const voiceService = {
  async getSettings(): Promise<VoiceSettings> {
    const res = await call('/voice-settings/');
    if (!res.ok) throw await failure(res, 'Nie udało się pobrać ustawień głosu');
    return res.json();
  },

  async saveSettings(voice: string, rate: number): Promise<VoiceSettings> {
    const res = await call('/voice-settings/', { method: 'PATCH', body: JSON.stringify({ voice, rate }) });
    if (!res.ok) throw await failure(res, 'Nie udało się zapisać ustawień głosu');
    return res.json();
  },

  async list(): Promise<VoiceMessage[]> {
    const res = await call('/messages/');
    if (!res.ok) throw await failure(res, 'Nie udało się pobrać komunikatów');
    return (await res.json()).messages;
  },

  async create(input: { title: string; text: string; situation: string }): Promise<VoiceMessage> {
    const res = await call('/messages/', { method: 'POST', body: JSON.stringify(input) });
    if (!res.ok) throw await failure(res, 'Nie udało się dodać komunikatu');
    return res.json();
  },

  async update(id: number, changes: Partial<Pick<VoiceMessage, 'title' | 'text' | 'situation' | 'is_active'>>): Promise<VoiceMessage> {
    const res = await call(`/messages/${id}/`, { method: 'PATCH', body: JSON.stringify(changes) });
    if (!res.ok) throw await failure(res, 'Nie udało się zapisać komunikatu');
    return res.json();
  },

  async remove(id: number): Promise<void> {
    const res = await call(`/messages/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw await failure(res, 'Nie udało się usunąć komunikatu');
  },

  /** Wysyła własne nagranie (WAV mono 16-bit) jako treść komunikatu. */
  async uploadAudio(id: number, wav: Blob): Promise<VoiceMessage> {
    const res = await call(`/messages/${id}/audio/`, { method: 'POST', body: wav, headers: { 'Content-Type': 'audio/wav' } }, false);
    if (!res.ok) throw await failure(res, 'Nie udało się zapisać nagrania');
    return res.json();
  },

  async removeAudio(id: number): Promise<VoiceMessage> {
    const res = await call(`/messages/${id}/audio/`, { method: 'DELETE' });
    if (!res.ok) throw await failure(res, 'Nie udało się usunąć nagrania');
    return res.json();
  },

  /** Podgląd: wybrany głos AI czyta komunikat (także z jeszcze niezapisanym głosem, tempem i treścią). */
  async previewUrl(id: number, options: { voice: string; rate: number; text: string }): Promise<string> {
    const res = await call(`/messages/${id}/preview/`, { method: 'POST', body: JSON.stringify(options) });
    if (!res.ok) throw await failure(res, 'Nie udało się wygenerować podglądu');
    return URL.createObjectURL(await res.blob());
  },

  async audioUrl(id: number): Promise<string> {
    const res = await call(`/messages/${id}/audio/`);
    if (!res.ok) throw await failure(res, 'Nie udało się pobrać nagrania');
    return URL.createObjectURL(await res.blob());
  },
};
