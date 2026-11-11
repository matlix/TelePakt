"""Dostawcy telefonii (Twilio, Telnyx) z okresową kontrolą i przełączaniem awaryjnym.

* Dane dostępowe ustawia się w panelu admina (model :class:`TelephonyProvider`); sekret
  jest szyfrowany Fernetem z kluczem wyprowadzonym z ``DJANGO_SECRET_KEY``.
  Twilio ma też zapasowe źródło: zmienne środowiskowe ``TWILIO_*``.
* :func:`ordered_providers` zwraca włączonych dostawców: zdrowi wg priorytetu, potem
  niezdrowi (ostatnia deska ratunku).
* :func:`maybe_run_health_checks` odpala kontrolę w tle (najwyżej co
  ``PROVIDER_CHECK_INTERVAL`` s), wywoływana z endpointu health.

UWAGA: przełączanie dotyczy operacji API (nagrywanie, kasowanie, numer do przekierowania
pokazywany w aplikacji). Przekierowanie operatora GSM na numer dostawcy jest ustawiane
przez użytkownika - przy awarii aplikacja pokaże nowy numer, ale kod trzeba wpisać ponownie.
"""
import base64
import hashlib
import logging
import os
import secrets
import threading
import time
from urllib.parse import urlencode, urlparse

import requests
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.utils import timezone

from .models import TelephonyProvider

logger = logging.getLogger(__name__)

#: Po tylu kolejnych błędach dostawca dostaje status "failing".
FAILURE_THRESHOLD = 2
HTTP_TIMEOUT = 10

_check_lock = threading.Lock()
_last_check_ts = 0.0


# --- szyfrowanie sekretów -------------------------------------------------------------

def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(key)


def encrypt_secret(plain: str) -> str:
    return _fernet().encrypt(plain.encode()).decode() if plain else ''


def decrypt_secret(token: str) -> str:
    if not token:
        return ''
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken:
        logger.error("Nie można odszyfrować sekretu dostawcy (zmieniony DJANGO_SECRET_KEY?)")
        return ''


# --- adaptery -------------------------------------------------------------------------

class ProviderError(Exception):
    """Błąd operacji u dostawcy."""


class BaseProvider:
    kind = ''

    def __init__(self, row: TelephonyProvider):
        self.row = row

    def check(self) -> None:
        """Rzuca wyjątek, gdy dostawca nie działa lub dane są błędne."""
        raise NotImplementedError

    def start_recording(self, call_sid: str, callback_url: str) -> None:
        raise NotImplementedError

    def delete_recording(self, recording_sid: str) -> bool:
        raise NotImplementedError

    def open_recording(self, url: str):
        """Otwiera strumień audio nagrania (``requests.Response`` ze stream=True)."""
        raise NotImplementedError

    def announce(self, call_sid: str, conference_name: str, announce_url: str) -> None:
        """Odtwarza audio spod ``announce_url`` na nodze ``call_sid`` w trwającej konferencji.

        Dźwięk idzie w dół nogi do telefonu użytkownika, a tam trafia do konferencji operatora (3-way) -
        słyszy go więc także rozmówca.
        """
        raise NotImplementedError

    def has_credentials(self) -> bool:
        return bool(self.row.account_sid and decrypt_secret(self.row.secret_encrypted))


class TwilioProvider(BaseProvider):
    kind = 'twilio'

    def has_credentials(self) -> bool:
        return bool(twilio_credentials()[0])

    def _client(self):
        from . import retention  # import leniwy; retention._twilio_client można podmienić w testach
        client = retention._twilio_client()
        if client is None:
            raise ProviderError("Brak danych dostępowych Twilio")
        return client

    def check(self) -> None:
        sid = twilio_credentials()[0]
        self._client().api.accounts(sid).fetch()

    def start_recording(self, call_sid, callback_url):
        self._client().calls(call_sid).recordings.create(
            recording_status_callback=callback_url,
            recording_status_callback_event=['completed'],
            recording_channels='dual',
        )

    def delete_recording(self, recording_sid):
        from .retention import delete_twilio_recording
        return delete_twilio_recording(recording_sid)

    def announce(self, call_sid, conference_name, announce_url):
        client = self._client()
        conferences = client.conferences.list(friendly_name=conference_name, status='in-progress', limit=1)
        if not conferences:
            raise ProviderError("Nie znaleziono trwającej konferencji - czy rozmowy zostały scalone?")
        client.conferences(conferences[0].sid).participants(call_sid).update(
            announce_url=announce_url, announce_method='POST')

    def open_recording(self, url):
        sid, token = twilio_credentials()
        if not (sid and token):
            raise ProviderError("Brak danych dostępowych Twilio")
        _require_host(url, 'twilio.com')
        media = url if url.endswith(('.mp3', '.wav')) else url + '.mp3'
        resp = requests.get(media, auth=(sid, token), stream=True, timeout=HTTP_TIMEOUT)  # Basic tylko do twilio.com
        if resp.status_code != 200:
            resp.close()
            raise ProviderError(f"Twilio HTTP {resp.status_code}")
        return resp


class TelnyxProvider(BaseProvider):
    """Telnyx TeXML - API zgodne z Twilio (te same webhooki TwiML, REST pod /v2/texml)."""
    kind = 'telnyx'
    BASE = 'https://api.telnyx.com/v2/texml/Accounts'

    def _request(self, method, path, **kw):
        key = decrypt_secret(self.row.secret_encrypted)
        if not (self.row.account_sid and key):
            raise ProviderError("Brak danych dostępowych Telnyx")
        resp = requests.request(
            method, f"{self.BASE}/{self.row.account_sid}/{path}",
            headers={'Authorization': f'Bearer {key}'}, timeout=HTTP_TIMEOUT, **kw,
        )
        return resp

    @staticmethod
    def _detail(resp) -> str:
        """Komunikat bledu z odpowiedzi Telnyx (bez sekretow) - zeby panel pokazywal PRZYCZYNE, nie tylko kod."""
        try:
            errors = resp.json().get('errors') or []
            return '; '.join(str(e.get('detail') or e.get('title') or '') for e in errors)[:200]
        except Exception:  # noqa: BLE001 - odpowiedz bez JSON
            return (resp.text or '')[:120]

    def check(self):
        # Sciezka wg dokumentacji Telnyx: GET /texml/Accounts/{account_sid}/Calls (bez .json).
        resp = self._request('GET', 'Calls', params={'PageSize': 1})
        if resp.status_code != 200:
            hint = ''
            if resp.status_code == 404:
                hint = " (Account ID prawdopodobnie nie należy do konta tego klucza API - sprawdź oba)"
            elif resp.status_code in (401, 403):
                hint = " (klucz API jest błędny, wygasł albo nie ma uprawnień)"
            detail = self._detail(resp)
            logger.warning("Telnyx check: HTTP %s %s", resp.status_code, detail)
            raise ProviderError(f"Telnyx HTTP {resp.status_code}{': ' + detail if detail else ''}{hint}")

    def start_recording(self, call_sid, callback_url):
        resp = self._request('POST', f'Calls/{call_sid}/Recordings.json', data={
            'RecordingChannels': 'dual',
            'RecordingStatusCallback': callback_url,
            'RecordingStatusCallbackEvent': 'completed',
            'PlayBeep': 'false',  # domyślnie Telnyx odtwarza sygnał - rozmówca nie może go słyszeć
        })
        if resp.status_code not in (200, 201):
            raise ProviderError(f"Telnyx HTTP {resp.status_code}")

    def open_recording(self, url):
        key = decrypt_secret(self.row.secret_encrypted)
        if not key:
            raise ProviderError("Brak danych dostępowych Telnyx")
        # Telnyx zwraca RecordingUrl jak Twilio; token Bearer wysyłamy tylko do telnyx.com.
        host = urlparse(url).hostname or ''
        headers = {'Authorization': f'Bearer {key}'} if host.endswith('telnyx.com') else {}
        candidates = [url] if url.endswith(('.mp3', '.wav')) else [url + '.mp3', url]
        last = None
        for candidate in candidates:
            resp = requests.get(candidate, headers=headers, stream=True, timeout=HTTP_TIMEOUT)
            if resp.status_code == 200:
                return resp
            last = resp.status_code
            resp.close()
        raise ProviderError(f"Telnyx HTTP {last}")

    def announce(self, call_sid, conference_name, announce_url):
        found = self._request('GET', 'Conferences', params={'FriendlyName': conference_name, 'Status': 'in-progress'})
        if found.status_code != 200:
            raise ProviderError(f"Telnyx HTTP {found.status_code}: {self._detail(found)}")
        conferences = found.json().get('conferences') or []
        if not conferences:
            raise ProviderError("Nie znaleziono trwającej konferencji - czy rozmowy zostały scalone?")
        resp = self._request('POST', f"Conferences/{conferences[0]['sid']}/Participants/{call_sid}",
                             data={'AnnounceUrl': announce_url, 'AnnounceMethod': 'POST'})
        if resp.status_code not in (200, 201):
            raise ProviderError(f"Telnyx HTTP {resp.status_code}: {self._detail(resp)}")

    def delete_recording(self, recording_sid):
        try:
            resp = self._request('DELETE', f'Recordings/{recording_sid}.json')
        except (ProviderError, requests.RequestException) as exc:
            logger.error("Telnyx: nie udało się usunąć nagrania %s: %s", recording_sid, exc)
            return False
        return resp.status_code in (200, 204, 404)


def _require_host(url: str, domain: str) -> None:
    """Dane dostępowe wysyłamy wyłącznie do hosta dostawcy (https), nigdy pod obcy adres."""
    parsed = urlparse(url)
    if parsed.scheme != 'https' or not (parsed.hostname or '').endswith(domain):
        raise ProviderError("Nieprawidłowy adres nagrania")


def open_recording(call):
    """Strumień audio nagrania połączenia od dostawcy, przez którego przeszło."""
    adapter = adapter_for(call.provider)
    if adapter is None or not adapter.has_credentials():
        raise ProviderError("Telefonia nie jest skonfigurowana")
    return adapter.open_recording(call.recording_url)


ADAPTERS = {'twilio': TwilioProvider, 'telnyx': TelnyxProvider}


# --- dane Twilio: baza admina, a gdy pusta - zmienne środowiskowe -----------------------

def twilio_credentials():
    """Zwraca ``(account_sid, auth_token)`` Twilio; panel admina ma pierwszeństwo przed env."""
    row = TelephonyProvider.objects.filter(kind='twilio').first()
    if row and row.account_sid and row.secret_encrypted:
        return row.account_sid, decrypt_secret(row.secret_encrypted)
    return settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN


def ensure_default_providers() -> None:
    """Zakłada brakujące wiersze dostawców (Twilio włączony, jeśli są zmienne env)."""
    for priority, kind in ((10, 'twilio'), (20, 'telnyx')):
        defaults = {'priority': priority, 'webhook_token': secrets.token_urlsafe(24)}
        if kind == 'twilio':
            defaults['is_enabled'] = bool(settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN)
            defaults['phone_number'] = os.environ.get('TWILIO_PHONE_NUMBER', '')
        TelephonyProvider.objects.get_or_create(kind=kind, defaults=defaults)


def adapter_for(kind: str) -> BaseProvider | None:
    ensure_default_providers()
    row = TelephonyProvider.objects.filter(kind=kind).first()
    return ADAPTERS[kind](row) if row and kind in ADAPTERS else None


def ordered_providers() -> list[BaseProvider]:
    """Włączeni dostawcy z danymi: zdrowi wg priorytetu, na końcu niezdrowi."""
    ensure_default_providers()
    rows = TelephonyProvider.objects.filter(is_enabled=True)
    adapters = [ADAPTERS[r.kind](r) for r in rows if r.kind in ADAPTERS]
    adapters = [a for a in adapters if a.has_credentials()]
    adapters.sort(key=lambda a: (a.row.status == 'failing', a.row.priority))
    return adapters


def active_provider() -> BaseProvider | None:
    ordered = ordered_providers()
    return ordered[0] if ordered else None


def webhook_token_valid(kind: str, token: str) -> bool:
    row = TelephonyProvider.objects.filter(kind=kind).first()
    return bool(row and row.webhook_token and token and secrets.compare_digest(row.webhook_token, token))


# --- kontrola stanu ------------------------------------------------------------------

def run_check(row: TelephonyProvider) -> bool:
    """Sprawdza jednego dostawcę i zapisuje wynik. ``True`` = działa."""
    adapter = ADAPTERS[row.kind](row)
    row.last_checked_at = timezone.now()
    try:
        if not adapter.has_credentials():
            raise ProviderError("Brak danych dostępowych")
        adapter.check()
    except Exception as exc:  # noqa: BLE001 - każdy błąd = dostawca niesprawny
        row.consecutive_failures += 1
        row.last_error = str(exc)[:300]
        if row.consecutive_failures >= FAILURE_THRESHOLD:
            if row.status != 'failing':
                logger.error("Dostawca %s przełączony w stan awarii: %s", row.kind, exc)
            row.status = 'failing'
        ok = False
    else:
        if row.status == 'failing':
            logger.info("Dostawca %s znów działa", row.kind)
        row.consecutive_failures = 0
        row.status = 'ok'
        row.last_error = ''
        row.last_ok_at = row.last_checked_at
        ok = True
    row.save(update_fields=['consecutive_failures', 'status', 'last_error', 'last_ok_at', 'last_checked_at'])
    return ok


def run_health_checks() -> dict:
    ensure_default_providers()
    return {r.kind: run_check(r) for r in TelephonyProvider.objects.filter(is_enabled=True)}


def maybe_run_health_checks() -> None:
    """Uruchamia kontrolę w osobnym wątku, najwyżej co ``PROVIDER_CHECK_INTERVAL`` sekund."""
    global _last_check_ts
    interval = int(os.environ.get('PROVIDER_CHECK_INTERVAL', '300'))
    now_ts = time.monotonic()
    if _last_check_ts and now_ts - _last_check_ts < interval:
        return
    if not _check_lock.acquire(blocking=False):
        return
    _last_check_ts = now_ts

    def _work():
        try:
            run_health_checks()
        except Exception:  # noqa: BLE001
            logger.exception("Kontrola dostawców telefonii nie powiodła się")
        finally:
            _check_lock.release()

    threading.Thread(target=_work, daemon=True).start()


# --- numer do przekierowania GSM -------------------------------------------------------

def forwarding_codes(number: str) -> dict:
    """Standardowe kody GSM do ustawienia przekierowania warunkowego."""
    return {
        'when_busy': f'**67*{number}#',
        'when_unanswered': f'**61*{number}**20#',
        'when_unreachable': f'**62*{number}#',
        'cancel_all': '##002#',
    }


def callback_query(provider_kind: str) -> str:
    """Parametry zapytania dopisywane do adresów webhooków danego dostawcy."""
    if provider_kind == 'twilio':
        return ''
    row = TelephonyProvider.objects.filter(kind=provider_kind).first()
    return '?' + urlencode({'provider': provider_kind, 'token': row.webhook_token if row else ''})
