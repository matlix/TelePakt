import { UserAccount } from '../types';
import { API_URL } from '../config';

/**
 * Konta TelePakt: e-mail + hasło na naszym backendzie (Django, `/api/auth/`).
 * Sesja to token Bearer trzymany w localStorage; serwer przechowuje tylko jego skrót.
 */

const STORAGE_KEY_AUTH = 'telepakt_auth_user';
const STORAGE_KEY_TOKEN = 'telepakt_auth_token';

type AuthListener = (user: UserAccount | null) => void;

interface ServerUser extends Omit<UserAccount, 'createdAt'> {
  createdAt: string; // ISO (YYYY-MM-DD)
}

function toAccount(u: ServerUser): UserAccount {
  const date = new Date(u.createdAt);
  return { ...u, createdAt: isNaN(date.getTime()) ? u.createdAt : date.toLocaleDateString('pl-PL') };
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

class AuthService {
  private currentUser: UserAccount | null = null;
  private token: string | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    try {
      this.token = localStorage.getItem(STORAGE_KEY_TOKEN);
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored && this.token) this.currentUser = JSON.parse(stored);
    } catch {
      this.currentUser = null;
    }
    if (this.token) this.refreshFromServer();
  }

  /** Odświeża profil z serwera; unieważniona sesja (401) wylogowuje. Brak sieci zachowuje sesję lokalną. */
  private async refreshFromServer() {
    try {
      const user = toAccount(await this.request<ServerUser>('GET', '/me/'));
      this.saveSession(user, this.token!);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) this.clearSession();
    }
  }

  private async request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(auth && this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.', 0);
    }
    if (res.status === 204) return undefined as T;
    let data: any = null;
    try {
      data = await res.json();
    } catch { /* odpowiedź bez JSON */ }
    if (!res.ok) {
      const message =
        res.status === 429 ? 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.'
        : data?.error || data?.detail || 'Wystąpił błąd. Spróbuj ponownie.';
      throw new ApiError(message, res.status);
    }
    return data as T;
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
  }

  /** Token sesji (do natywnej nakładki połączeń, która sama woła API). */
  public getToken(): string | null {
    return this.token;
  }

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener(this.currentUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  private saveSession(user: UserAccount, token: string) {
    this.currentUser = user;
    this.token = token;
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
    } catch { /* tryb prywatny - sesja działa do zamknięcia karty */ }
    this.notify();
  }

  private clearSession() {
    this.currentUser = null;
    this.token = null;
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    } catch { /* ignoruj */ }
    this.notify();
  }

  public async registerWithEmail(name: string, email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Wprowadź prawidłowy adres e-mail.');
    const res = await this.request<{ token: string; user: ServerUser }>(
      'POST', '/register/', { email: cleanEmail, name: name.trim(), password }, false);
    const user = toAccount(res.user);
    this.saveSession(user, res.token);
    return user;
  }

  public async loginWithEmail(email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error('Podaj adres e-mail.');
    const res = await this.request<{ token: string; user: ServerUser }>(
      'POST', '/login/', { email: cleanEmail, password }, false);
    const user = toAccount(res.user);
    this.saveSession(user, res.token);
    return user;
  }

  /** Logowanie przez Google / Apple zostało wyłączone - konta są prowadzone wyłącznie u nas. */
  public async loginWithGoogle(_fallbackEmail?: string): Promise<UserAccount> {
    throw new Error('Logowanie przez Google nie jest dostępne. Zaloguj się adresem e-mail i hasłem.');
  }

  public async loginWithApple(_hideEmail: boolean = false): Promise<UserAccount> {
    throw new Error('Logowanie przez Apple ID nie jest dostępne. Zaloguj się adresem e-mail i hasłem.');
  }

  /** Krok 1 resetu hasła: wysyła kod na e-mail (odpowiedź taka sama dla znanego i nieznanego adresu). */
  public async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Podaj prawidłowy adres e-mail.');
    await this.request('POST', '/password-reset/', { email: cleanEmail }, false);
  }

  /** Krok 2 resetu hasła: kod z e-maila + nowe hasło. Wylogowuje wszystkie urządzenia. */
  public async confirmPasswordReset(email: string, code: string, newPassword: string): Promise<void> {
    await this.request('POST', '/password-reset/confirm/', {
      email: email.trim().toLowerCase(), code: code.trim(), newPassword,
    }, false);
  }

  /** Prawo do usunięcia danych (art. 17 RODO): potwierdzenie hasłem, usuwa konto i nagrania. */
  public async deleteAccount(password: string): Promise<void> {
    if (!this.currentUser) throw new Error('Brak aktywnej sesji użytkownika.');
    await this.request('DELETE', '/me/', { password });
    this.clearSession();
  }

  public async logout(): Promise<void> {
    try {
      if (this.token) await this.request('POST', '/logout/');
    } catch { /* wylogowanie lokalne i tak następuje */ }
    this.clearSession();
  }

  /** Zgłasza serwerowi, czy operator telefonu pozwala na rozmowy konferencyjne (3-way) - do wglądu w panelu admina. */
  public async reportCarrier(supported: boolean, carriers: string): Promise<void> {
    if (!this.token) return;
    await this.request('POST', '/carrier-report/', { supported, carriers });
  }

  /** Zmienia imię i/lub chroniony numer. Plan subskrypcji ustawia tylko serwer. */
  public async updateProfile(updates: Partial<UserAccount>): Promise<UserAccount> {
    if (!this.currentUser) throw new Error('Brak aktywnej sesji użytkownika.');
    const payload: Record<string, string> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phoneProtected !== undefined) payload.phoneProtected = updates.phoneProtected;
    const user = toAccount(await this.request<ServerUser>('PATCH', '/me/', payload));
    this.saveSession(user, this.token!);
    return user;
  }
}

export const authService = new AuthService();
