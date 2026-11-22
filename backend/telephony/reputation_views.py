"""Zgłaszanie numerów jako spam i sprawdzanie ich reputacji (aplikacja Telefon TelePakt, ekran połączenia)."""
import logging
from datetime import timedelta

from django.db import IntegrityError
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import REPORT_THRESHOLD, NumberReport, normalize_number

logger = logging.getLogger(__name__)

MAX_REPORTS_PER_DAY = 100  # ochrona przed zasypywaniem bazy z jednego konta


def _error(message, status=400):
    return Response({'error': message}, status=status)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def number_reputation(request):
    """``?number=...`` -> ``{number, reports, warn}``. ``warn`` = True dopiero od progu różnych zgłaszających.

    Odpowiedź nigdy nie mówi, że numer jest „bezpieczny”: ``warn=False`` oznacza tylko „brak wystarczających zgłoszeń”.
    """
    number = normalize_number(request.query_params.get('number'))
    if not number:
        return _error('Podaj prawidłowy numer telefonu.')
    count = NumberReport.objects.filter(number=number).values('user').distinct().count()
    return Response({'number': number, 'reports': count if count >= REPORT_THRESHOLD else 0, 'warn': count >= REPORT_THRESHOLD})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def report_number(request):
    """Body: ``number`` (wymagane), ``category``. Jedno zgłoszenie na użytkownika i numer (powtórka = 200, bez zmian)."""
    number = normalize_number(request.data.get('number'))
    if not number:
        return _error('Podaj prawidłowy numer telefonu.')
    category = str(request.data.get('category') or 'telemarketing')
    if category not in dict(NumberReport.CATEGORIES):
        return _error('Nieznana kategoria zgłoszenia.')
    since = timezone.now() - timedelta(days=1)
    if NumberReport.objects.filter(user=request.user, created_at__gte=since).count() >= MAX_REPORTS_PER_DAY:
        return _error('Zbyt wiele zgłoszeń dzisiaj. Spróbuj jutro.', status=429)
    try:
        _, created = NumberReport.objects.get_or_create(user=request.user, number=number, defaults={'category': category})
    except IntegrityError:  # równoległe żądanie dodało to samo zgłoszenie
        created = False
    return Response({'status': 'reported' if created else 'already_reported', 'number': number}, status=201 if created else 200)


# Szacunek kosztu pelnego autotestu (jedna rozmowa 3-way ok. 2 min + synteza + nagranie). To NIE jest cennik Telnyx:
# stawki trzeba potwierdzic u dostawcy, dlatego zakladamy ostrozny gorny limit.
ESTIMATED_TEST_COST_USD = 0.50


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def provider_balance(request):
    """Saldo aktywnego dostawcy + czy wystarczy na pelny autotest. Tylko konta testowe i personel."""
    from accounts.services import ensure_profile
    from . import providers
    if not (request.user.is_staff or ensure_profile(request.user).is_tester):
        return _error('Dostępne tylko dla kont testowych.', 403)
    last_error = 'Brak skonfigurowanego dostawcy z danymi dostępowymi.'
    for adapter in providers.ordered_providers():
        if not adapter.has_credentials():
            continue
        try:
            info = adapter.balance()
        except Exception as exc:  # noqa: BLE001 - pokazujemy powod uzytkownikowi (konto testowe)
            logger.warning("Saldo %s: %s", adapter.kind, exc)
            last_error = f"{adapter.kind}: {exc}"
            continue
        spendable = info['available_credit'] if info['available_credit'] is not None else info['balance']
        return Response({
            'provider': adapter.kind, **info,
            'estimated_test_cost_usd': ESTIMATED_TEST_COST_USD,
            'enough_for_full_test': info['currency'].upper() == 'USD' and spendable >= ESTIMATED_TEST_COST_USD * 2,
        })
    return _error(last_error, 503)
