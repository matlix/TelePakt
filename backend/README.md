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
| `TWILIO_ACCOUNT_SID`, `TWILIO_PHONE_NUMBER` | Konfiguracja Twilio. |
| `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS` | Listy rozdzielane przecinkami. |
| `RETENTION_DAYS` | Retencja nagrań (domyślnie 30). |
| `REVIEWS_THROTTLE_RATE` | Limit POST /reviews (domyślnie `30/hour`). |

## Modele (`telephony/models.py`)
`LegalScript` (formuły prawne), `CallLog` (dowód połączenia + SHA-256 + retencja), `UkeComplaint`, `CustomerReview` (moderowane), `IntegrationCredential`, `InAppPurchaseReceipt`.
Migracje w `telephony/migrations/` **muszą być commitowane** – `build.sh` uruchamia `migrate` przy każdym deployu.

## Znane ograniczenia (TODO)
- `verify-purchase` nie weryfikuje jeszcze tokenów w API sklepów (zapis z `is_verified=False`).
- `zero-storage-delete` nie ma uwierzytelnienia i nie kasuje nagrania po stronie Twilio.
- `IntegrationCredential.secret_value` jest przechowywane jawnym tekstem (mimo etykiety „zaszyfrowany”).