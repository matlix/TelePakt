"""Pomocnicze funkcje kont: numery telefonów, tokeny sesji, serializacja użytkownika."""
import hashlib
import re
import secrets
from datetime import timedelta

from django.utils import timezone

from .models import AuthToken

#: Sesja wygasa po tylu dniach bez użycia.
TOKEN_IDLE_DAYS = 180


def normalize_phone(raw: str) -> str | None:
    """Polski numer -> E.164 (``+48500123456``). Pusty ciąg = brak numeru; ``None`` = niepoprawny."""
    digits = re.sub(r'\D', '', raw or '')
    if not digits:
        return ''
    if digits.startswith('48') and len(digits) == 11:
        digits = digits[2:]
    return f'+48{digits}' if len(digits) == 9 else None


def format_phone(e164: str) -> str:
    """``+48500123456`` -> ``+48 500 123 456`` (tak pokazuje go aplikacja)."""
    if len(e164) == 12 and e164.startswith('+48'):
        return f'+48 {e164[3:6]} {e164[6:9]} {e164[9:]}'
    return e164


def hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def issue_token(user, device: str = '') -> str:
    """Tworzy sesję i zwraca surowy token (jedyny raz, gdy jest widoczny)."""
    raw = secrets.token_urlsafe(32)
    AuthToken.objects.create(user=user, key_hash=hash_key(raw), device=device[:100])
    return raw


def is_expired(token: AuthToken) -> bool:
    return token.last_used_at < timezone.now() - timedelta(days=TOKEN_IDLE_DAYS)


def serialize_user(user) -> dict:
    p = user.profile
    return {
        'id': str(user.pk),
        'email': user.email,
        'name': p.name,
        'provider': 'email',
        'subscriptionPlan': p.subscription_plan,
        'createdAt': p.created_at.date().isoformat(),
        'isVerified': True,
        'phoneProtected': format_phone(p.phone_protected),
    }
