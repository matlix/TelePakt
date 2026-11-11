/**
 * Konfiguracja czasu budowania (zmienne VITE_*). Patrz `.env.example`.
 *
 * VITE_ASSISTANT_NUMBER - numer telefonu bramki telekonferencyjnej TelePakt (Twilio),
 * np. "+48 22 123 45 67". Dopóki nie jest ustawiony, aplikacja pokazuje komunikat
 * "numer pojawi się po uruchomieniu usługi" zamiast wymyślonego numeru.
 */
export const ASSISTANT_NUMBER: string = (import.meta.env.VITE_ASSISTANT_NUMBER ?? '').trim();

/**
 * Funkcje chwilowo wylaczone (decyzja wlasciciela, 2026-11-10). Kod zostaje - wystarczy przestawic flage.
 * forwarding: przekierowanie polaczen do numeru TelePakt (ekran z kodami GSM i przycisk w nakladce).
 * Przy wlaczeniu odblokuj tez FORWARDING_ENABLED w CallOverlayService.kt oraz uprawnienie ANSWER_PHONE_CALLS.
 */
export const FEATURES = {
  forwarding: false,
  /** Nagrywanie całej rozmowy (3-way przez numer TelePakt) i zakładka Nagrania - wyłączone 2026-11-11. */
  recording: false,
} as const;

/** Adres API backendu (Render). */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'https://api.telepakt.pl').trim().replace(/\/$/, '');

/** `true`, gdy skonfigurowano prawdziwy numer asystenta. */
export const HAS_ASSISTANT_NUMBER: boolean = ASSISTANT_NUMBER.length > 0;
