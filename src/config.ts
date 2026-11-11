/**
 * Konfiguracja czasu budowania (zmienne VITE_*). Patrz `.env.example`.
 *
 * VITE_ASSISTANT_NUMBER - numer telefonu bramki telekonferencyjnej TelePakt (Twilio),
 * np. "+48 22 123 45 67". Dopóki nie jest ustawiony, aplikacja pokazuje komunikat
 * "numer pojawi się po uruchomieniu usługi" zamiast wymyślonego numeru.
 */
export const ASSISTANT_NUMBER: string = (import.meta.env.VITE_ASSISTANT_NUMBER ?? '').trim();

/** Przelaczniki funkcji aplikacji. */
export const FEATURES = {
  /** Zakładka Nagrania (rozmowy 3-way nagrywane przez TelePakt). */
  recording: true,
} as const;

/** Adres API backendu (Render). */
export const API_URL: string = (import.meta.env.VITE_API_URL ?? 'https://api.telepakt.pl').trim().replace(/\/$/, '');

/** `true`, gdy skonfigurowano prawdziwy numer asystenta. */
export const HAS_ASSISTANT_NUMBER: boolean = ASSISTANT_NUMBER.length > 0;
