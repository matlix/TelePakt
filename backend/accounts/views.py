"""Endpointy kont (``/api/auth/``): rejestracja, logowanie, profil, reset hasła, usunięcie konta."""
import hashlib
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from django.db import transaction
from django.utils import timezone
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import PasswordResetCode, Profile
from .services import issue_token, normalize_phone, serialize_user

logger = logging.getLogger(__name__)

RESET_CODE_TTL = timedelta(minutes=15)
RESET_MAX_ATTEMPTS = 5


def _error(message, status=400):
    return Response({'error': message}, status=status)


def _password_error(password, user=None):
    """Zwraca komunikat po polsku, jeśli hasło nie spełnia reguł Django; inaczej ``None``."""
    try:
        validate_password(password, user=user)
    except ValidationError as exc:
        return ' '.join(exc.messages)
    return None


def public_endpoint(scope):
    """Endpoint bez uwierzytelniania (stary token w nagłówku nie blokuje logowania), z throttlingiem."""
    def wrap(func):
        view = api_view(['POST'])(func)
        view.cls.authentication_classes = []
        view.cls.permission_classes = [AllowAny]
        view.cls.throttle_classes = [ScopedRateThrottle]
        view.cls.throttle_scope = scope
        return view
    return wrap


@public_endpoint('auth')
def register(request):
    email = str(request.data.get('email', '')).strip().lower()
    name = str(request.data.get('name', '')).strip()[:128]
    password = str(request.data.get('password', ''))
    try:
        validate_email(email)
    except ValidationError:
        return _error('Nieprawidłowy format adresu e-mail.')
    if User.objects.filter(username=email).exists():
        return _error('Konto z tym adresem e-mail już istnieje. Zaloguj się.', 409)
    problem = _password_error(password, User(username=email, email=email))
    if problem:
        return _error(problem)
    with transaction.atomic():
        user = User.objects.create_user(username=email, email=email, password=password)
        Profile.objects.create(user=user, name=name or email.split('@')[0])
    token = issue_token(user, request.headers.get('User-Agent', ''))
    return Response({'token': token, 'user': serialize_user(user)}, status=201)


@public_endpoint('auth')
def login(request):
    email = str(request.data.get('email', '')).strip().lower()
    user = authenticate(request, username=email, password=str(request.data.get('password', '')))
    if user is None or not hasattr(user, 'profile'):
        return _error('Nieprawidłowy e-mail lub hasło. Sprawdź dane lub zarejestruj się.', 401)
    token = issue_token(user, request.headers.get('User-Agent', ''))
    return Response({'token': token, 'user': serialize_user(user)})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    request.auth.delete()
    return Response({'status': 'ok'})


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def me(request):
    """GET - profil; PATCH - ``name`` i ``phoneProtected`` (plan zmienia tylko serwer); DELETE - usunięcie konta."""
    user = request.user
    if request.method == 'GET':
        return Response(serialize_user(user))
    if request.method == 'DELETE':
        return _delete_account(request)
    profile = user.profile
    if 'name' in request.data:
        name = str(request.data['name']).strip()[:128]
        if not name:
            return _error('Podaj imię i nazwisko lub nazwę firmy.')
        profile.name = name
    if 'phoneProtected' in request.data:
        phone = normalize_phone(str(request.data['phoneProtected']))
        if phone is None:
            return _error('Podaj numer w formacie 9 cyfr, np. 500 123 456.')
        profile.phone_protected = phone
    profile.save()
    return Response(serialize_user(user))


def _delete_account(request):
    """Prawo do usunięcia danych (art. 17 RODO): wymaga hasła; kasuje też nagrania połączeń użytkownika."""
    from telephony.models import CallLog
    from telephony.retention import erase_recording

    user = request.user
    if not user.check_password(str(request.data.get('password', ''))):
        return _error('Nieprawidłowe hasło.', 403)
    phone = user.profile.phone_protected
    if phone:
        for call in CallLog.objects.filter(recipient_number=phone):
            if not erase_recording(call):
                return _error('Nie udało się usunąć nagrań u operatora telefonii. Spróbuj ponownie za chwilę.', 502)
            call.delete()
    user.delete()
    return Response(status=204)


@public_endpoint('password_reset')
def password_reset_request(request):
    """Wysyła kod do zmiany hasła. Odpowiedź jest taka sama, czy konto istnieje, czy nie."""
    email = str(request.data.get('email', '')).strip().lower()
    user = User.objects.filter(username=email, is_active=True).first()
    if user:
        code = f'{secrets.randbelow(10**8):08d}'
        user.reset_codes.all().delete()
        PasswordResetCode.objects.create(
            user=user, code_hash=hashlib.sha256(code.encode()).hexdigest(),
            expires_at=timezone.now() + RESET_CODE_TTL,
        )
        try:
            send_mail(
                'TelePakt - kod do zmiany hasła',
                f'Twój kod do zmiany hasła: {code}\nKod jest ważny 15 minut. Jeśli to nie Ty, zignoruj tę wiadomość.',
                settings.DEFAULT_FROM_EMAIL, [user.email],
            )
        except Exception:  # noqa: BLE001 - brak SMTP nie może ujawniać istnienia konta
            logger.exception("Nie udało się wysłać kodu resetu hasła")
    return Response({'status': 'ok'})


@public_endpoint('password_reset_confirm')
def password_reset_confirm(request):
    email = str(request.data.get('email', '')).strip().lower()
    code = str(request.data.get('code', '')).strip()
    new_password = str(request.data.get('newPassword', ''))

    user = User.objects.filter(username=email, is_active=True).first()
    reset = user.reset_codes.order_by('-id').first() if user else None
    if reset is None or reset.expires_at < timezone.now() or reset.attempts >= RESET_MAX_ATTEMPTS:
        return _error('Nieprawidłowy lub wygasły kod.')
    if not secrets.compare_digest(reset.code_hash, hashlib.sha256(code.encode()).hexdigest()):
        reset.attempts += 1
        reset.save(update_fields=['attempts'])
        return _error('Nieprawidłowy lub wygasły kod.')
    problem = _password_error(new_password, user)
    if problem:
        return _error(problem)
    user.set_password(new_password)
    user.save(update_fields=['password'])
    user.reset_codes.all().delete()
    user.auth_tokens.all().delete()  # zmiana hasła wylogowuje wszystkie urządzenia
    return Response({'status': 'ok'})
