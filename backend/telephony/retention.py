"""Retencja i kasowanie nagrań (zasada Zero-Storage).

Nagranie rozmowy leży u operatora (Twilio) pod adresem ``RecordingUrl``. "Usunięcie"
oznacza więc dwie rzeczy: skasowanie nagrania w Twilio (``recordings(sid).delete()``)
oraz wyczyszczenie odnośnika w naszej bazie. Samo wyczyszczenie linku w bazie NIE
usuwa nagrania, dlatego wszystkie ścieżki kasowania przechodzą przez :func:`erase_recording`.
"""
import logging
import threading
import time

from django.conf import settings
from django.utils import timezone

from .models import CallLog

logger = logging.getLogger(__name__)

#: Najczęstsze wywołanie czyszczenia (sekundy). Patrz :func:`maybe_purge_expired`.
PURGE_INTERVAL_SECONDS = 3600

_purge_lock = threading.Lock()
_last_purge_ts = 0.0


def _twilio_client():
    """Zwraca klienta Twilio albo ``None``, gdy brak danych dostępowych."""
    from .providers import twilio_credentials  # dane z panelu admina lub ze zmiennych env

    sid, token = twilio_credentials()
    if not sid or not token:
        return None
    from twilio.rest import Client  # import leniwy: nie wymagamy Twilio w testach

    return Client(sid, token)


def delete_twilio_recording(recording_sid: str) -> bool:
    """Usuwa nagranie z Twilio. ``True`` = usunięte lub już nie istnieje (404)."""
    client = _twilio_client()
    if client is None:
        logger.warning("Brak danych Twilio - nie można usunąć nagrania %s", recording_sid)
        return False
    try:
        client.recordings(recording_sid).delete()
        return True
    except Exception as exc:  # noqa: BLE001 - błędy sieci/API mapujemy na False
        status = getattr(exc, 'status', None)
        if status == 404:
            return True
        logger.error("Nie udało się usunąć nagrania %s w Twilio: %s", recording_sid, exc)
        return False


def _delete_recording(call: CallLog) -> bool:
    """Kasuje nagranie u dostawcy, przez którego przeszło połączenie."""
    if call.provider == 'twilio':
        return delete_twilio_recording(call.recording_sid)
    from .providers import adapter_for

    adapter = adapter_for(call.provider)
    return bool(adapter and adapter.delete_recording(call.recording_sid))


def erase_recording(call: CallLog) -> bool:
    """Kasuje nagranie połączenia u operatora i w bazie. ``False`` = nie udało się (spróbuj później).

    Gdy połączenie nie ma nagrania (brak ``recording_sid``), czyści tylko wpis w bazie.
    """
    if call.recording_sid and not _delete_recording(call):
        return False
    call.recording_url = None
    call.recording_sid = ''
    call.deleted_from_server = True
    call.status = 'deleted'
    call.save(update_fields=['recording_url', 'recording_sid', 'deleted_from_server', 'status'])
    return True


def purge_expired(now=None) -> int:
    """Usuwa nagrania, którym minął termin retencji. Zwraca liczbę usuniętych nagrań.

    Wpis połączenia (numer, data, czas) jest kasowany razem z nagraniem, chyba że jest
    do niego dołączony wniosek do UKE - wtedy zostaje tylko metryka bez nagrania.
    """
    now = now or timezone.now()
    erased = 0
    for call in CallLog.objects.filter(retention_expires_at__lte=now):
        if call.recording_sid or call.recording_url:
            if not erase_recording(call):
                continue  # Twilio niedostępne - spróbujemy przy kolejnym przebiegu
            erased += 1
        if not hasattr(call, 'complaint'):
            call.delete()
    return erased


def maybe_purge_expired() -> None:
    """Uruchamia :func:`purge_expired` najwyżej raz na godzinę, bez crona.

    Render sprawdza ``/health/`` co kilka sekund, więc to wywołanie jest naszym "zegarem".
    Błędy są logowane i nigdy nie psują odpowiedzi health checka.
    """
    global _last_purge_ts
    now_ts = time.monotonic()
    if now_ts - _last_purge_ts < PURGE_INTERVAL_SECONDS:
        return
    if not _purge_lock.acquire(blocking=False):
        return
    try:
        _last_purge_ts = now_ts
        count = purge_expired()
        if count:
            logger.info("Retencja: usunięto %s nagrań po terminie", count)
    except Exception:  # noqa: BLE001
        logger.exception("Retencja: błąd podczas czyszczenia")
    finally:
        _purge_lock.release()
