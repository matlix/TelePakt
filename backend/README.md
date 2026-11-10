# TelePakt - backend (Django 5 + DRF)

Aplikacja `telephony` obsługuje webhooki Twilio, rejestr dowodowy połączeń, opinie i paragony IAP.
Szczegółowy opis endpointów: docstring modułu `telephony/views.py`.

## Uruchomienie lokalne
```bash
python -m venv .venv && .venv\Scripts\activate      # Windows
pip install -r requirements.txt
set DJANGO_DEBUG=True                                # lokalnie; w produkcji wymagany DJANGO_SECRET_KEY
python manage.py migrate && python manage.py runserver
python manage.py test
```

## Zmienne środowiskowe
| Zmienna | Opis |
|---|---|
| `DJANGO_SECRET_KEY` | **Wymagana w produkcji** (Render generuje ją z `render.yaml`). Bez niej aplikacja nie wystartuje. |
| `DJANGO_DEBUG` | `True` tylko lokalnie. Wyłącza weryfikację podpisu Twilio. |
| `DATABASE_URL` | PostgreSQL (Render); domyślnie SQLite. |
| `TWILIO_AUTH_TOKEN` | Weryfikuje podpis `X-Twilio-Signature` webhooków – bez niego w produkcji zwracają 403. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | Opcjonalny zapas - dane dostawców telefonii ustawia się w panelu admina (Dostawcy telefonii). |
| `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` | Listy rozdzielane przecinkami. |
| `RETENTION_DAYS` | Retencja nagrań (domyślnie 30). |
| `REVIEWS_THROTTLE_RATE` | Limit POST /reviews (domyślnie `30/hour`). |

## Modele (`telephony/models.py`)
`LegalScript` (formuły prawne), `CallLog` (metryka połączenia, odnośnik i SID nagrania, termin retencji), `UkeComplaint`, `CustomerReview` (moderowane), `IntegrationCredential`, `InAppPurchaseReceipt`.
Migracje w `telephony/migrations/` **muszą być commitowane** – `build.sh` uruchamia `migrate` przy każdym deployu.

## Nagrania i retencja (Zero-Storage)
Nagranie leży u Twilio (`RecordingUrl`/`RecordingSid` zapisywane w `recording-callback`). Kasowanie ma dwie ścieżki, obie przez `telephony/retention.py::erase_recording`:
- `POST /zero-storage-delete/` - po pobraniu nagrania przez klienta; kasuje nagranie w Twilio (`recordings(sid).delete()`) i w bazie. Gdy Twilio nie odpowiada, zwraca 502 i **nie** oznacza nagrania jako usuniętego.
- Retencja (`RETENTION_DAYS`, domyślnie 30) - `purge_expired()` kasuje nagrania po terminie. Uruchamia się samo, najwyżej raz na godzinę, z endpointu `/health/` (Render woła go co kilka sekund), więc nie jest potrzebny cron.

UWAGA: wcześniej API zwracało `sha256_hash` liczony z tekstu `callSid-url-czas`, a nie z pliku audio - nie dowodziło to niczego o nagraniu, więc pole usunięto (migracja `0002`).

## Znane ograniczenia (TODO)
- `verify-purchase` nie weryfikuje jeszcze tokenów w API sklepów (zapis z `is_verified=False`).
- `zero-storage-delete` nie ma jeszcze uwierzytelnienia (wystarczy znać `call_sid`).
- `IntegrationCredential.secret_value` jest przechowywane jawnym tekstem (mimo etykiety „zaszyfrowany”).