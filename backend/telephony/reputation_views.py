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
