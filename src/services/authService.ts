import { UserAccount, AuthProvider } from '../types';
import { auth, db, googleProvider, appleProvider } from '../firebase';
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_AUTH = 'telepakt_auth_user';

type AuthListener = (user: UserAccount | null) => void;

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

class AuthService {
  private currentUser: UserAccount | null = null;
  private listeners: Set<AuthListener> = new Set();

  constructor() {
    this.loadUserFromStorage();
    this.initFirebaseAuthState();
  }

  private loadUserFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
  }

  private initFirebaseAuthState() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          let profileDoc;
          try {
            profileDoc = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
          }

          if (profileDoc && profileDoc.exists()) {
            const data = profileDoc.data() as UserAccount;
            this.saveSession(data);
          } else {
            // Determine provider
            const providerId = firebaseUser.providerData[0]?.providerId || 'email';
            const provider: AuthProvider = providerId.includes('google')
              ? 'google'
              : providerId.includes('apple')
              ? 'apple'
              : 'email';

            const newProfile: UserAccount = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Użytkownik TelePakt'),
              provider,
              photoUrl: firebaseUser.photoURL || undefined,
              subscriptionPlan: 'free',
              createdAt: new Date().toLocaleDateString('pl-PL'),
              isVerified: firebaseUser.emailVerified || true,
              phoneProtected: '+48 '
            };

            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
            }

            this.saveSession(newProfile);
          }
        } catch (error) {
          console.warn('Could not sync user profile from Firestore, using local session:', error);
        }
      } else {
        // Firebase signed out
        if (this.currentUser && this.currentUser.provider !== 'email') {
          this.currentUser = null;
          localStorage.removeItem(STORAGE_KEY_AUTH);
          this.notify();
        }
      }
    });
  }

  public getCurrentUser(): UserAccount | null {
    return this.currentUser;
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

  private saveSession(user: UserAccount) {
    this.currentUser = user;
    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    this.notify();
  }

  // 1. REJESTRACJA PRZEZ EMAIL & HASŁO (Firebase Auth + Firestore)
  public async registerWithEmail(name: string, email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Wprowadź prawidłowy adres e-mail.');
    }

    if (password.length < 6) {
      throw new Error('Hasło musi zawierać co najmniej 6 znaków.');
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = cred.user;

      if (cleanName) {
        await updateFirebaseProfile(user, { displayName: cleanName });
      }

      const newProfile: UserAccount = {
        id: user.uid,
        email: cleanEmail,
        name: cleanName || cleanEmail.split('@')[0],
        provider: 'email',
        subscriptionPlan: 'free',
        createdAt: new Date().toLocaleDateString('pl-PL'),
        isVerified: true,
        phoneProtected: '+48 '
      };

      try {
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      this.saveSession(newProfile);
      return newProfile;
    } catch (error: any) {
      // Map Firebase errors to clean Polish messages
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Konto z tym adresem e-mail już istnieje. Zaloguj się.');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Hasło jest za słabe. Wprowadź co najmniej 6 znaków.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Nieprawidłowy format adresu e-mail.');
      }
      throw new Error(this.friendlyAuthError(error, 'Wystąpił błąd podczas rejestracji.'));
    }
  }

  // 2. LOGOWANIE PRZEZ EMAIL & HASŁO
  public async loginWithEmail(email: string, password: string): Promise<UserAccount> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Podaj adres e-mail.');
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = cred.user;

      const userDocRef = doc(db, 'users', user.uid);
      let profileDoc;
      try {
        profileDoc = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      let account: UserAccount;
      if (profileDoc && profileDoc.exists()) {
        account = profileDoc.data() as UserAccount;
      } else {
        account = {
          id: user.uid,
          email: cleanEmail,
          name: user.displayName || cleanEmail.split('@')[0],
          provider: 'email',
          subscriptionPlan: 'free',
          createdAt: new Date().toLocaleDateString('pl-PL'),
          isVerified: true,
          phoneProtected: '+48 '
        };
        try {
          await setDoc(userDocRef, account);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }

      this.saveSession(account);
      return account;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('Nieprawidłowy e-mail lub hasło. Sprawdź dane lub zarejestruj się.');
      }
      throw new Error(this.friendlyAuthError(error, 'Błąd logowania.'));
    }
  }

  // 3. LOGOWANIE PRZEZ GOOGLE (GMAIL)
  public async loginWithGoogle(fallbackEmail?: string): Promise<UserAccount> {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user = cred.user;

      const userDocRef = doc(db, 'users', user.uid);
      let profileDoc;
      try {
        profileDoc = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      let account: UserAccount;
      if (profileDoc && profileDoc.exists()) {
        account = profileDoc.data() as UserAccount;
      } else {
        account = {
          id: user.uid,
          email: user.email || fallbackEmail || '',
          name: user.displayName || 'Użytkownik Google',
          provider: 'google',
          photoUrl: user.photoURL || undefined,
          subscriptionPlan: 'free',
          createdAt: new Date().toLocaleDateString('pl-PL'),
          isVerified: true,
          phoneProtected: '+48 '
        };
        try {
          await setDoc(userDocRef, account);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }

      this.saveSession(account);
      return account;
    } catch (error: any) {
      // In case popup was closed by user or iframe restrictions apply, provide graceful fallback
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Okno logowania Google zostało zamknięte.');
      } else if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/operation-not-allowed' || error.code === 'auth/operation-not-supported-in-this-environment') {
        throw new Error('Logowanie przez Google nie jest tu dostępne. Zaloguj się adresem e-mail i hasłem.');
      }
      throw new Error(error.message || 'Logowanie przez Google nie powiodło się.');
    }
  }

  // 4. LOGOWANIE PRZEZ APPLE (APPLE ID & PRIVATE RELAY)
  public async loginWithApple(hideEmail: boolean = false): Promise<UserAccount> {
    try {
      const cred = await signInWithPopup(auth, appleProvider);
      const user = cred.user;

      const userDocRef = doc(db, 'users', user.uid);
      let profileDoc;
      try {
        profileDoc = await getDoc(userDocRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }

      let account: UserAccount;
      if (profileDoc && profileDoc.exists()) {
        account = profileDoc.data() as UserAccount;
      } else {
        const finalEmail = user.email || '';
        account = {
          id: user.uid,
          email: finalEmail,
          name: user.displayName || (hideEmail ? 'Użytkownik Apple' : 'Użytkownik Apple ID'),
          provider: 'apple',
          appleRelayEmail: hideEmail,
          subscriptionPlan: 'free',
          createdAt: new Date().toLocaleDateString('pl-PL'),
          isVerified: true,
          phoneProtected: '+48 '
        };
        try {
          await setDoc(userDocRef, account);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        }
      }

      this.saveSession(account);
      return account;
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Okno logowania Apple ID zostało zamknięte.');
      } else if (error.code === 'auth/unauthorized-domain' || error.code === 'auth/operation-not-allowed' || error.code === 'auth/operation-not-supported-in-this-environment') {
        throw new Error('Logowanie przez Apple ID nie jest tu dostępne. Zaloguj się adresem e-mail i hasłem.');
      }
      throw new Error(error.message || 'Logowanie przez Apple ID nie powiodło się.');
    }
  }

  /** Zamienia kody błędów Firebase na zrozumiałe komunikaty (bez ujawniania surowych tekstów technicznych). */
  private friendlyAuthError(error: any, fallback: string): string {
    switch (error?.code) {
      case 'auth/operation-not-allowed':
        return 'Logowanie e-mailem nie zostało jeszcze włączone w usłudze. Skontaktuj się z administratorem.';
      case 'auth/too-many-requests':
        return 'Zbyt wiele prób. Spróbuj ponownie za kilka minut.';
      case 'auth/network-request-failed':
        return 'Brak połączenia z internetem. Sprawdź sieć i spróbuj ponownie.';
      case 'auth/user-disabled':
        return 'To konto zostało zablokowane.';
      default:
        return fallback;
    }
  }
  // 5a. RESET HASŁA (e-mail z linkiem od Firebase)
  public async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Podaj prawidłowy adres e-mail.');
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
    } catch (error: any) {
      // Nie ujawniamy, czy konto istnieje - dla nieznanego adresu zachowujemy się tak samo jak dla znanego.
      if (error.code === 'auth/user-not-found') return;
      if (error.code === 'auth/invalid-email') throw new Error('Nieprawidłowy format adresu e-mail.');
      throw new Error('Nie udało się wysłać wiadomości. Spróbuj ponownie później.');
    }
  }

  // 5b. USUNIĘCIE KONTA (prawo do usunięcia danych, art. 17 RODO)
  public async deleteAccount(): Promise<void> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      throw new Error('Brak aktywnej sesji użytkownika.');
    }
    try {
      await deleteDoc(doc(db, 'users', firebaseUser.uid));
      await deleteUser(firebaseUser);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Ze względów bezpieczeństwa wyloguj się, zaloguj ponownie i spróbuj usunąć konto jeszcze raz.');
      }
      throw new Error(error.message || 'Nie udało się usunąć konta.');
    }
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_AUTH);
    this.notify();
  }
  // 5. WYLOGOWANIE
  public async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout note:', e);
    }
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY_AUTH);
    this.notify();
  }

  // 6. AKTUALIZACJA PROFILU
  public async updateProfile(updates: Partial<UserAccount>): Promise<UserAccount> {
    if (!this.currentUser) {
      throw new Error('Brak aktywnej sesji użytkownika.');
    }

    const updated: UserAccount = {
      ...this.currentUser,
      ...updates
    };

    if (auth.currentUser) {
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), updates as any);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }

    this.saveSession(updated);
    return updated;
  }
}

export const authService = new AuthService();
