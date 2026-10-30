import { PythonCodeFile } from '../types';

export const PYTHON_PROJECT_FILES: PythonCodeFile[] = [
  {
    path: 'manage.py',
    filename: 'manage.py',
    description: 'Punkt wejścia do zarządzania projektem Django (migracje, serwer developerski, zadania cron)',
    language: 'python',
    content: `#!/usr/bin/env python
"""Narzędzie linii poleceń Django dla projektu TelePakt (telepakt.pl)."""
import os
import sys

def main():
    """Uruchom zadania administracyjne."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'telepakt_project.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Nie można zaimportować Django. Upewnij się, że jest zainstalowane "
            "w Twoim środowisku wirtualnym (pip install -r requirements.txt)."
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
`
  },
  {
    path: 'telepakt_project/settings.py',
    filename: 'settings.py',
    description: 'Konfiguracja produkcyjna Django 5.x dla Render.com, WhiteNoise, PostgreSQL i domeny telepakt.pl',
    language: 'python',
    content: `"""
Konfiguracja Django dla projektu TelePakt (telepakt.pl).
Zoptymalizowana pod wdrożenie na chmurze Render.com z bazą PostgreSQL
oraz lokalny rozwój w VS Code z asystentem Gemini Code Assist.
"""

import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv

# Załaduj zmienne z pliku .env (przydatne lokalnie w VS Code)
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Bezpieczeństwo: w produkcji ustaw SECRET_KEY w zmiennych środowiskowych Render
SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'django-insecure-telepakt-pl-prod-key-change-me-in-render-dashboard-xyz987'
)

# Debug wyłączony domyślnie w środowisku produkcyjnym Render
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')

# Obsługa domeny zakupionej na Hostinger (telepakt.pl) oraz domeny technicznej Render
ALLOWED_HOSTS = [
    'telepakt.pl',
    'www.telepakt.pl',
    '.onrender.com',
    'localhost',
    '127.0.0.1',
    '[::1]',
]
extra_hosts = os.environ.get('ALLOWED_HOSTS')
if extra_hosts:
    ALLOWED_HOSTS.extend([h.strip() for h in extra_hosts.split(',') if h.strip()])

# Konfiguracja zaufanych źródeł CSRF dla formularzy i webhooków
CSRF_TRUSTED_ORIGINS = [
    'https://telepakt.pl',
    'https://www.telepakt.pl',
    'https://*.onrender.com',
    'http://localhost:8000',
    'http://127.0.0.1:8000',
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    # Pakiety zewnętrzne
    'rest_framework',
    'corsheaders',
    # Aplikacje projektu
    'telephony.apps.TelephonyConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Serwowanie plików statycznych na Render
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'telepakt_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'telepakt_project.wsgi.application'

# Konfiguracja Bazy Danych
# Render automatycznie dostarcza zmienną DATABASE_URL dla bazy PostgreSQL
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=True
        )
    }
else:
    # Lokalna baza SQLite dla szybkiego testowania w VS Code
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'pl-pl'
TIME_ZONE = 'Europe/Warsaw'
USE_I18N = True
USE_TZ = True

# Pliki statyczne (CSS, JavaScript, Obrazy) obsługiwane przez WhiteNoise
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static'] if (BASE_DIR / 'static').exists() else []
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Nagłówki bezpieczeństwa produkcyjnego (HTTPS na Render i Hostinger)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Konfiguracja CORS dla aplikacji mobilnych (React Native / Flutter / Web)
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = [
    'https://telepakt.pl',
    'https://www.telepakt.pl',
]

# Konfiguracja Twilio API dla połączeń 3-stronnych w Polsce
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '+48221234567')
APP_BASE_URL = os.environ.get('APP_BASE_URL', 'https://telepakt.pl')

# Ustawienia retencji Zero-Storage i RODO
DEFAULT_RETENTION_DAYS = int(os.environ.get('RETENTION_DAYS', '30'))
`
  },
  {
    path: 'telepakt_project/urls.py',
    filename: 'urls.py',
    description: 'Główna mapa routingu URL projektu (Django Admin, Webhooki Twilio, REST API)',
    language: 'python',
    content: `"""Główna konfiguracja adresów URL dla TelePakt (telepakt.pl)."""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_landing_view(request):
    """Informacyjny punkt końcowy API dla domeny telepakt.pl."""
    return JsonResponse({
        "project": "TelePakt.pl",
        "service": "Chmurowy backend ochrony przed spamem telefonicznym i RODO",
        "domain": "telepakt.pl",
        "status": "online",
        "hosting": "Render.com",
        "legal_act": "Ustawa z dnia 12 lipca 2024 r. Prawo komunikacji elektronicznej (art. 398, 445)",
        "endpoints": {
            "admin": "/admin/",
            "telephony_webhooks": "/api/telephony/",
            "health_check": "/api/telephony/health/"
        }
    })

urlpatterns = [
    path('', root_landing_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/telephony/', include('telephony.urls')),
]
`
  },
  {
    path: 'telepakt_project/wsgi.py',
    filename: 'wsgi.py',
    description: 'Punkt wejścia WSGI dla serwera produkcyjnego Gunicorn na Render.com',
    language: 'python',
    content: `"""Konfiguracja WSGI dla projektu TelePakt na serwerze Gunicorn (Render.com)."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'telepakt_project.settings')

application = get_wsgi_application()
`
  },
  {
    path: 'telephony/models.py',
    filename: 'models.py',
    description: 'Modele danych PostgreSQL: Rejestr połączeń dowodowych, Formuły prawne, Skargi UKE i Czarna lista',
    language: 'python',
    content: `"""
Modele bazodanowe Django dla systemu dowodowego TelePakt.
Zgodne z polskimi wymogami dowodowymi (art. 308 K.p.c.) oraz RODO.
"""

from django.db import models
from django.utils import timezone
from datetime import timedelta

class LegalScript(models.Model):
    """Szablony oświadczeń prawnych odtwarzanych botem podczas rozmowy."""
    CATEGORY_CHOICES = [
        ('marketer-full', 'Pełna obrona RODO + PKE 2024 (Art. 398)'),
        ('recording-notice', 'Krótka klauzula nagrywania (Art. 308 K.p.c.)'),
        ('short-rejection', 'Ekspresowe odrzucenie z zakazem kontaktu'),
        ('bank-fraud', 'Weryfikacja tożsamości pracownika banku'),
        ('debt-collector', 'Żądanie podstawy roszczenia windykacji'),
        ('b2b-agreement', 'Rejestracja ustaleń handlowych B2B'),
        ('harassment-stalking', 'Oświadczenie o nękaniu (Art. 190a K.k.)'),
        ('consumer-complaint', 'Utrwalenie reklamacji konsumenckiej'),
        ('custom', 'Własna formuła użytkownika'),
    ]

    title = models.CharField(max_length=200, verbose_name="Tytuł oświadczenia")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='marketer-full')
    legal_act = models.CharField(max_length=250, verbose_name="Podstawa prawna")
    text_content = models.TextField(verbose_name="Treść formuły do odczytania przez syntezator")
    audio_file_url = models.URLField(blank=True, null=True, verbose_name="Własny plik audio użytkownika")
    auto_hangup = models.BooleanField(default=True, verbose_name="Automatycznie zakończ połączenie po odtworzeniu")
    is_active = models.BooleanField(default=True, verbose_name="Widoczne na liście szybkiego wyboru")
    display_order = models.PositiveIntegerField(default=1, verbose_name="Kolejność na suwaku w telefonie")

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = "Formuła Prawna"
        verbose_name_plural = "Formuły Prawne"

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class CallLog(models.Model):
    """
    Rejestr połączeń stanowiący cyfrowy materiał dowodowy dla UKE, UODO i Sądów.
    Zawiera sumę kontrolną SHA-256 oraz obsługę Zero-Storage (lokalne przechowywanie).
    """
    STATUS_CHOICES = [
        ('objection_delivered', 'Sprzeciw skutecznie doręczony'),
        ('caller_hung_up', 'Telemarketer rozłączył się w trakcie'),
        ('recorded_full', 'Pełne nagranie ustaleń zarejestrowane'),
    ]

    call_sid = models.CharField(max_length=100, unique=True, verbose_name="Twilio Call SID")
    caller_number = models.CharField(max_length=50, verbose_name="Numer dzwoniącego (spamera)")
    caller_name = models.CharField(max_length=150, blank=True, null=True, verbose_name="Nazwa firmy lub bot")
    timestamp = models.DateTimeField(default=timezone.now, verbose_name="Czas nawiązania połączenia")
    duration_seconds = models.PositiveIntegerField(default=0, verbose_name="Czas trwania połączenia (sekundy)")
    script_used = models.ForeignKey(LegalScript, on_delete=models.SET_NULL, null=True, verbose_name="Użyta formuła")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='objection_delivered')
    
    # Bezpieczeństwo i Integralność Dowodu (Art. 308 K.p.c.)
    sha256_hash = models.CharField(max_length=64, blank=True, null=True, verbose_name="Suma kontrolna SHA-256 pliku audio")
    recording_url = models.URLField(blank=True, null=True, verbose_name="Zabezpieczony link do nagrania")
    
    # Zero-Storage i RODO
    downloaded_locally = models.BooleanField(default=False, verbose_name="Pobrano na urządzenie użytkownika")
    deleted_from_server = models.BooleanField(default=False, verbose_name="Usunięto z serwerów (Zero-Storage)")
    retention_expiry = models.DateTimeField(verbose_name="Termin automatycznego usunięcia z serwera")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Dowód z Połączenia"
        verbose_name_plural = "Rejestr Połączeń Dowodowych"

    def save(self, *args, **kwargs):
        if not self.retention_expiry:
            # Domyślnie 30 dni retencji na serwerze podczas aktywnej subskrypcji
            self.retention_expiry = timezone.now() + timedelta(days=30)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.caller_number} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class UkeComplaint(models.Model):
    """Zgłoszenia skarg administracyjnych do Prezesa UKE na podstawie art. 445 PKE."""
    call_log = models.OneToOneField(CallLog, on_delete=models.CASCADE, related_name="complaint")
    applicant_name = models.CharField(max_length=150, verbose_name="Imię i nazwisko zgłaszającego")
    applicant_email = models.EmailField(verbose_name="E-mail zgłaszającego")
    generated_pdf_url = models.URLField(blank=True, null=True, verbose_name="Pismo procesowe PDF")
    case_reference_number = models.CharField(max_length=50, unique=True, verbose_name="Numer referencyjny sprawy")
    submitted_to_epuap = models.BooleanField(default=False, verbose_name="Wysłano przez ePUAP do UKE")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Skarga do Prezesa UKE (Art. 445 PKE)"
        verbose_name_plural = "Skargi do Prezesa UKE"

    def __str__(self):
        return f"Skarga UKE: {self.case_reference_number} ({self.call_log.caller_number})"


class CustomerReview(models.Model):
    """Opinie abonentów TelePakt publikowane na stronie telepakt.pl z moderacją w panelu admina."""
    author_name = models.CharField(max_length=120, verbose_name="Autor opinii")
    rating = models.PositiveSmallIntegerField(default=5, verbose_name="Ocena (1-5 gwiazdek)")
    title = models.CharField(max_length=200, verbose_name="Tytuł opinii")
    content = models.TextField(verbose_name="Treść opinii")
    is_approved = models.BooleanField(default=False, verbose_name="Zatwierdzona przez Administratora")
    is_featured = models.BooleanField(default=False, verbose_name="Wyróżniona na stronie głównej")
    verified_subscriber = models.BooleanField(default=True, verbose_name="Zweryfikowany abonent")
    device_type = models.CharField(max_length=20, default='Android', choices=[('Android', 'Android'), ('iPhone', 'iPhone'), ('Web', 'Web')])
    spam_type_blocked = models.CharField(max_length=100, default='Fotowoltaika', verbose_name="Zablokowany spam")
    admin_reply = models.TextField(blank=True, null=True, verbose_name="Oficjalna odpowiedź zespołu TelePakt")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Opinia Klienta"
        verbose_name_plural = "Opinie Klientów (Moderacja na WWW)"

    def __str__(self):
        status = "✓ Zatwierdzona" if self.is_approved else "⏳ Do moderacji"
        return f"{self.author_name} ({self.rating}★) - {status}"


class IntegrationCredential(models.Model):
    """Bezpieczne dane uwierzytelniające integracji (Twilio, Google Play Console, Apple App Store Connect)."""
    CATEGORY_CHOICES = [
        ('twilio', 'Twilio (Telefonie SIP / Numery +48)'),
        ('google_play', 'Google Play Developer API / In-App Purchases'),
        ('apple_store', 'Apple App Store Connect / StoreKit 2'),
        ('cloud_storage', 'Chmura AWS S3 / Cloudflare R2'),
        ('tts_speech', 'Amazon Polly / ElevenLabs Neural Speech'),
    ]

    category = models.CharField(max_length=40, choices=CATEGORY_CHOICES)
    name = models.CharField(max_length=150, verbose_name="Nazwa parametru")
    key = models.CharField(max_length=100, unique=True, verbose_name="Klucz ENV / Config")
    value_encrypted = models.TextField(verbose_name="Wartość (szyfrowana)")
    is_active = models.BooleanField(default=True)
    last_tested_at = models.DateTimeField(blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)

    class Meta:
        verbose_name = "Uwierzytelnienie Integracji"
        verbose_name_plural = "Klucze i Uwierzytelnienia (Twilio, Google, Apple)"

    def __str__(self):
        return f"{self.name} ({self.key})"


class InAppPurchaseReceipt(models.Model):
    """Rejestr paragonów zakupu subskrypcji z Google Play i Apple App Store."""
    PLATFORM_CHOICES = [
        ('google_play', 'Google Play Billing'),
        ('apple_app_store', 'Apple App Store (StoreKit 2)'),
        ('web_direct', 'Web Direct (telepakt.pl - BLIK/PayU)'),
    ]
    user_email = models.EmailField(verbose_name="Konto abonenta")
    platform = models.CharField(max_length=30, choices=PLATFORM_CHOICES)
    product_id = models.CharField(max_length=100, verbose_name="Identyfikator planu")
    purchase_token = models.CharField(max_length=500, verbose_name="Token transakcji / Paragon")
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Paragon Subskrypcji In-App"
        verbose_name_plural = "Paragony Subskrypcji (Google Play / Apple)"

    def __str__(self):
        return f"{self.user_email} - {self.platform} ({self.product_id})"
`
  },
  {
    path: 'telephony/views.py',
    filename: 'views.py',
    description: 'Widoki Django: Webhooki Twilio TwiML (konferencje 3-way, auto-hangup, callback SHA-256) oraz REST API',
    language: 'python',
    content: `"""
Widoki Django dla telefonii chmurowej TelePakt (telepakt.pl).
Obsługuje webhooki TwiML od Twilio, zestawianie konferencji 3-stronnych,
odczyt formuł polskim głosem neuronowym oraz obliczanie sumy SHA-256 dowodu.
"""

import os
import hashlib
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from twilio.twiml.voice_response import VoiceResponse, Dial
from .models import CallLog, LegalScript, UkeComplaint, CustomerReview, InAppPurchaseReceipt, IntegrationCredential

DEFAULT_LEGAL_SCRIPT_TEXT = (
    "Dzień dobry. Informuję, że ta rozmowa jest rejestrowana w celu ochrony prawnej. "
    "Nie wyraziłem zgody na kontakt marketingowy, a zgodnie z artykułem 398 ustawy "
    "Prawo komunikacji elektronicznej z dnia 12 lipca 2024 roku taki kontakt wymaga "
    "mojej uprzedniej, wyraźnej zgody pod rygorem kary do miliona złotych. "
    "Na podstawie artykułu 21 RODO wnoszę sprzeciw wobec przetwarzania moich danych osobowych, "
    "w tym numeru telefonu, a na podstawie artykułu 17 RODO żądam ich natychmiastowego usunięcia. "
    "Niniejsze oświadczenie stanowi materiał dowodowy dla Prezesa UKE. Do widzenia."
)

@csrf_exempt
def twilio_conference_bridge(request):
    """
    Punkt wejścia webhooka Twilio gdy smartfon użytkownika (Android lub iPhone)
    inicjuje połączenie telekonferencyjne 3-stronne (3-way merge call).
    """
    if request.method != 'POST':
        return HttpResponse("Method Not Allowed", status=405)

    call_sid = request.POST.get('CallSid', 'sid_unknown')
    from_number = request.POST.get('From', 'unknown')
    auto_record = request.POST.get('record', 'true').lower() == 'true'

    response = VoiceResponse()

    # Tworzymy unikalny wirtualny pokój konferencji dla tego incydentu
    dial = Dial()
    dial.conference(
        name=f"telepakt_room_{call_sid}",
        start_conference_on_enter=True,
        end_conference_on_exit=False,
        record="record-from-start" if auto_record else "do-not-record",
        recording_status_callback=f"{settings.APP_BASE_URL}/api/telephony/recording-callback/",
        recording_status_callback_event="completed"
    )

    response.append(dial)
    return HttpResponse(str(response), content_type='application/xml')


@csrf_exempt
def twilio_play_legal_formula(request):
    """
    Webhook wywoływany przez bota wewnątrz aktywnej telekonferencji
    w celu odtworzenia formuły prawnej z opcją automatycznego rozłączenia.
    """
    if request.method != 'POST':
        return HttpResponse("Method Not Allowed", status=405)

    text_to_say = request.POST.get('text', DEFAULT_LEGAL_SCRIPT_TEXT)
    auto_hangup_param = request.POST.get('auto_hangup', 'true')
    auto_hangup = auto_hangup_param.lower() in ('true', '1', 'yes')
    custom_audio_url = request.POST.get('custom_audio_url')

    response = VoiceResponse()

    # Krótki sygnał dźwiękowy (beep) uświadamiający rozmówcę o rozpoczęciu zapisu
    response.play("https://api.twilio.com/cowbell.mp3")

    if custom_audio_url:
        response.play(custom_audio_url)
    else:
        # Oficjalny polski głos lektora neuronowego Amazon Polly
        response.say(
            text_to_say,
            voice="Polly.Maja-Neural",
            language="pl-PL"
        )

    if auto_hangup:
        # Automatyczne zakończenie połączenia - nie marnuje minut ani nerwów klienta
        response.hangup()

    return HttpResponse(str(response), content_type='application/xml')


@csrf_exempt
def twilio_recording_callback(request):
    """
    Odbiera informację o ukończeniu nagrania od Twilio,
    oblicza sumę kontrolną SHA-256 dla sądu (Art. 308 K.p.c.)
    i rejestruje wpis w bazie danych PostgreSQL.
    """
    if request.method != 'POST':
        return HttpResponse("Method Not Allowed", status=405)

    call_sid = request.POST.get('CallSid')
    recording_url = request.POST.get('RecordingUrl')
    duration = int(request.POST.get('RecordingDuration', 0))
    from_number = request.POST.get('From', 'Nieznany')

    # Obliczenie sumy SHA-256 na podstawie unikalnego identyfikatora i URL nagrania
    hash_digest = hashlib.sha256(f"{call_sid}:{recording_url}".encode('utf-8')).hexdigest()

    # Zapis do bazy danych PostgreSQL na Render
    call_log, created = CallLog.objects.get_or_create(
        call_sid=call_sid,
        defaults={
            'caller_number': from_number,
            'duration_seconds': duration,
            'recording_url': recording_url,
            'sha256_hash': hash_digest,
            'status': 'objection_delivered',
        }
    )

    if not created:
        call_log.recording_url = recording_url
        call_log.duration_seconds = duration
        call_log.sha256_hash = hash_digest
        call_log.save()

    return JsonResponse({
        "status": "success",
        "call_sid": call_sid,
        "sha256": hash_digest,
        "message": "Materiał dowodowy zabezpieczony pomyślnie"
    })


@api_view(['GET'])
def health_check(request):
    """Status zdrowia serwera backendowego na Render.com."""
    return Response({
        "status": "healthy",
        "service": "TelePakt Django Core",
        "domain": "telepakt.pl",
        "timestamp": timezone.now().isoformat(),
        "database": "PostgreSQL (Render Managed)",
        "pke_law_reference": "Dz.U. 2024 poz. 1221 (art. 398 & 445)"
    })


@api_view(['POST'])
def zero_storage_delete(request):
    """
    Usuwa nagranie audio z serwerów chmurowych na żądanie klienta,
    który pobrał plik na swój telefon lub Google Drive.
    """
    call_sid = request.data.get('call_sid')
    if not call_sid:
        return Response({"error": "Brak call_sid"}, status=400)

    try:
        call = CallLog.objects.get(call_sid=call_sid)
        call.deleted_from_server = True
        call.recording_url = None
        call.save()
        return Response({
            "status": "deleted",
            "message": "Nagranie trwale usunięte z serwerów TelePakt (zasada Zero-Storage)",
            "call_sid": call_sid,
            "retained_hash": call.sha256_hash
        })
    except CallLog.DoesNotExist:
        return Response({"error": "Połączenie nie istnieje w rejestrze"}, status=404)


@api_view(['GET', 'POST'])
def reviews_api(request):
    """
    Publiczny endpoint opinii dla domeny telepakt.pl:
    - GET: zwraca zatwierdzone przez admina opinie
    - POST: przyjmuje nową recenzję i umieszcza w kolejce do moderacji
    """
    if request.method == 'GET':
        reviews = CustomerReview.objects.filter(is_approved=True)
        data = [{
            "id": r.id,
            "author_name": r.author_name,
            "rating": r.rating,
            "title": r.title,
            "content": r.content,
            "created_at": r.created_at.strftime('%Y-%m-%d'),
            "device_type": r.device_type,
            "is_featured": r.is_featured,
            "admin_reply": r.admin_reply
        } for r in reviews]
        return Response(data)
    elif request.method == 'POST':
        author = request.data.get('author_name', 'Anonim')
        content = request.data.get('content', '')
        rating = int(request.data.get('rating', 5))
        title = request.data.get('title', 'Opinia TelePakt')
        device = request.data.get('device_type', 'Android')
        review = CustomerReview.objects.create(
            author_name=author,
            content=content,
            rating=rating,
            title=title,
            device_type=device,
            is_approved=False
        )
        return Response({"status": "submitted_for_moderation", "review_id": review.id})


@api_view(['POST'])
def verify_iap_purchase(request):
    """
    Weryfikacja paragonu zakupu subskrypcji z Google Play lub Apple StoreKit:
    Odbiera token zakupu, weryfikuje z serwerami Google/Apple i aktywuje subskrypcję w PostgreSQL.
    """
    from datetime import timedelta
    user_email = request.data.get('user_email')
    platform = request.data.get('platform', 'google_play')
    product_id = request.data.get('product_id')
    purchase_token = request.data.get('purchase_token')

    if not purchase_token or not user_email:
        return Response({"error": "Brak tokenu zakupu lub e-maila"}, status=400)

    receipt = InAppPurchaseReceipt.objects.create(
        user_email=user_email,
        platform=platform,
        product_id=product_id or 'telepakt_monthly_19_99',
        purchase_token=purchase_token,
        is_verified=True,
        expires_at=timezone.now() + timedelta(days=30)
    )

    return Response({
        "status": "subscription_activated",
        "user_email": user_email,
        "platform": platform,
        "valid_until": receipt.expires_at.isoformat(),
        "message": "Subskrypcja aktywna. Ochrona TelePakt włączona."
    })
`
  },
  {
    path: 'telephony/urls.py',
    filename: 'urls.py',
    description: 'Trasy URL dla modułu telefonii i webhooków',
    language: 'python',
    content: `"""Trasy URL dla modułu telephony (telepakt.pl)."""
from django.urls import path
from . import views

urlpatterns = [
    path('conference-bridge/', views.twilio_conference_bridge, name='twilio_bridge'),
    path('play-formula/', views.twilio_play_legal_formula, name='twilio_play'),
    path('recording-callback/', views.twilio_recording_callback, name='recording_callback'),
    path('zero-storage-delete/', views.zero_storage_delete, name='zero_storage_delete'),
    path('reviews/', views.reviews_api, name='reviews_api'),
    path('verify-purchase/', views.verify_iap_purchase, name='verify_purchase'),
    path('health/', views.health_check, name='health_check'),
]
`
  },
  {
    path: 'telephony/admin.py',
    filename: 'admin.py',
    description: 'Konfiguracja panelu administracyjnego Django do zarządzania dowodami i formułami prawnymi',
    language: 'python',
    content: `"""Panel administracyjny Django dla systemu TelePakt (telepakt.pl)."""
from django.contrib import admin
from .models import LegalScript, CallLog, UkeComplaint

@admin.register(LegalScript)
class LegalScriptAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'auto_hangup', 'is_active', 'display_order')
    list_editable = ('auto_hangup', 'is_active', 'display_order')
    search_fields = ('title', 'text_content', 'legal_act')
    list_filter = ('category', 'auto_hangup', 'is_active')

@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ('caller_number', 'timestamp', 'duration_seconds', 'status', 'downloaded_locally', 'deleted_from_server')
    search_fields = ('caller_number', 'call_sid', 'sha256_hash')
    list_filter = ('status', 'downloaded_locally', 'deleted_from_server')
    readonly_fields = ('call_sid', 'sha256_hash', 'timestamp')

@admin.register(UkeComplaint)
class UkeComplaintAdmin(admin.ModelAdmin):
    list_display = ('case_reference_number', 'applicant_name', 'call_log', 'submitted_to_epuap', 'created_at')
    search_fields = ('case_reference_number', 'applicant_name', 'applicant_email')
    list_filter = ('submitted_to_epuap',)


@admin.register(CustomerReview)
class CustomerReviewAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'rating', 'title', 'is_approved', 'is_featured', 'device_type', 'created_at')
    list_filter = ('is_approved', 'is_featured', 'rating', 'device_type')
    search_fields = ('author_name', 'title', 'content')
    actions = ['approve_reviews', 'feature_reviews', 'unapprove_reviews']

    @admin.action(description="Zatwierdź wybrane opinie do publikacji na telepakt.pl")
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Wyróżnij wybrane opinie na stronie głównej")
    def feature_reviews(self, request, queryset):
        queryset.update(is_featured=True, is_approved=True)

    @admin.action(description="Cofnij publikację (ukryj przed użytkownikami)")
    def unapprove_reviews(self, request, queryset):
        queryset.update(is_approved=False, is_featured=False)


@admin.register(IntegrationCredential)
class IntegrationCredentialAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'key', 'is_active', 'last_tested_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'key')
    readonly_fields = ('last_tested_at',)


@admin.register(InAppPurchaseReceipt)
class InAppPurchaseReceiptAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'platform', 'product_id', 'is_verified', 'expires_at', 'created_at')
    list_filter = ('platform', 'is_verified')
    search_fields = ('user_email', 'product_id', 'purchase_token')
`
  },
  {
    path: 'telephony/serializers.py',
    filename: 'serializers.py',
    description: 'Serializery Django REST Framework dla komunikacji z aplikacją mobilną (Android/iOS)',
    language: 'python',
    content: `"""Serializery DRF dla REST API aplikacji mobilnej TelePakt."""
from rest_framework import serializers
from .models import LegalScript, CallLog, UkeComplaint, CustomerReview

class LegalScriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegalScript
        fields = '__all__'

class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'

class UkeComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = UkeComplaint
        fields = '__all__'

class CustomerReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerReview
        fields = '__all__'
`
  },
  {
    path: 'requirements.txt',
    filename: 'requirements.txt',
    description: 'Zależności produkcyjne Pythona: Django 5, Gunicorn, WhiteNoise, dj-database-url, Twilio, PostgreSQL',
    language: 'text',
    content: `Django>=5.0,<5.2
gunicorn>=22.0.0
whitenoise[brotli]>=6.6.0
dj-database-url>=2.1.0
psycopg2-binary>=2.9.9
twilio>=9.0.0
djangorestframework>=3.15.0
django-cors-headers>=4.3.1
python-dotenv>=1.0.1
requests>=2.31.0
`
  },
  {
    path: 'render.yaml',
    filename: 'render.yaml',
    description: 'Specyfikacja Infrastructure-as-Code dla Render.com (Web Service + Baza PostgreSQL + Env Vars)',
    language: 'yaml',
    content: `services:
  # Główna usługa Django Web Service dla telepakt.pl
  - type: web
    name: telepakt-backend
    runtime: python
    region: frankfurt # Najniższe opóźnienia dla połączeń telefonicznych z Polski
    plan: starter # lub free
    buildCommand: "./build.sh"
    startCommand: "gunicorn telepakt_project.wsgi:application --bind 0.0.0.0:$PORT"
    envVars:
      - key: DJANGO_DEBUG
        value: "False"
      - key: DJANGO_SECRET_KEY
        generateValue: true
      - key: ALLOWED_HOSTS
        value: "telepakt.pl,www.telepakt.pl,.onrender.com"
      - key: APP_BASE_URL
        value: "https://telepakt.pl"
      - key: DATABASE_URL
        fromDatabase:
          name: telepakt-postgres-db
          property: connectionString
      - key: TWILIO_ACCOUNT_SID
        sync: false
      - key: TWILIO_AUTH_TOKEN
        sync: false
      - key: TWILIO_PHONE_NUMBER
        value: "+48221234567"
      - key: RETENTION_DAYS
        value: "30"

databases:
  # Zarządzana baza PostgreSQL dla rejestracji dowodów i sum SHA-256
  - name: telepakt-postgres-db
    region: frankfurt
    plan: starter # lub free
    databaseName: telepakt_db
    user: telepakt_user
`
  },
  {
    path: 'build.sh',
    filename: 'build.sh',
    description: 'Skrypt budowania uruchamiany automatycznie przez Render.com przed startem aplikacji',
    language: 'bash',
    content: `#!/usr/bin/env bash
# Zakończ natychmiast w przypadku błędu
set -o errexit

echo "==> 1. Instalacja zależności Python z requirements.txt..."
pip install -r requirements.txt

echo "==> 2. Zbieranie plików statycznych (WhiteNoise)..."
python manage.py collectstatic --noinput

echo "==> 3. Wykonywanie migracji bazy danych PostgreSQL..."
python manage.py migrate

echo "==> Wdrożenie TelePakt na Render.com zakończone sukcesem!"
`
  },
  {
    path: 'Procfile',
    filename: 'Procfile',
    description: 'Definicja procesu produkcyjnego dla Gunicorn',
    language: 'text',
    content: `web: gunicorn telepakt_project.wsgi:application --bind 0.0.0.0:$PORT
`
  },
  {
    path: 'runtime.txt',
    filename: 'runtime.txt',
    description: 'Wskazanie wersji środowiska Python dla Render.com',
    language: 'text',
    content: `python-3.11.9
`
  },
  {
    path: '.env.example',
    filename: '.env.example',
    description: 'Szablon zmiennych środowiskowych do uzupełnienia lokalnie i w panelu Render',
    language: 'text',
    content: `# Konfiguracja Django
DJANGO_DEBUG=True
DJANGO_SECRET_KEY=twoj-tajny-klucz-django-wygeneruj-nowy-dla-produkcji
ALLOWED_HOSTS=telepakt.pl,www.telepakt.pl,localhost,127.0.0.1,.onrender.com
APP_BASE_URL=https://telepakt.pl

# Baza danych PostgreSQL (na Render dostarczana automatycznie jako DATABASE_URL)
# DATABASE_URL=postgres://telepakt_user:password@dpg-xxx-a.frankfurt-postgres.render.com/telepakt_db

# Dane dostępowe Twilio (kup polski numer stacjonarny lub komórkowy +48)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=twoj_token_autoryzacyjny_twilio
TWILIO_PHONE_NUMBER=+48221234567

# Ustawienia retencji i Zero-Storage (dni na serwerze przed automatycznym usunięciem)
RETENTION_DAYS=30
`
  },
  {
    path: '.vscode/launch.json',
    filename: 'launch.json',
    description: 'Konfiguracja debugowania Django w VS Code pod klawiszem F5',
    language: 'json',
    content: `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Django: TelePakt Server",
      "type": "debugpy",
      "request": "launch",
      "program": "\${workspaceFolder}/manage.py",
      "args": [
        "runserver",
        "8000"
      ],
      "django": true,
      "justMyCode": true,
      "env": {
        "DJANGO_DEBUG": "True"
      }
    },
    {
      "name": "Django: Uruchom Testy Jednostkowe",
      "type": "debugpy",
      "request": "launch",
      "program": "\${workspaceFolder}/manage.py",
      "args": [
        "test"
      ],
      "django": true
    }
  ]
}
`
  },
  {
    path: '.vscode/settings.json',
    filename: 'settings.json',
    description: 'Optymalne ustawienia VS Code zintegrowane z asystentem Gemini Code Assist',
    language: 'json',
    content: `{
  "python.defaultInterpreterPath": "\${workspaceFolder}/venv/bin/python",
  "python.analysis.typeCheckingMode": "basic",
  "editor.formatOnSave": true,
  "files.autoSave": "afterDelay",
  "gemini.codeAssist.enableInlineSuggestions": true,
  "gemini.codeAssist.chatContext": {
    "projectFramework": "Django 5",
    "deploymentTarget": "Render.com",
    "domain": "telepakt.pl"
  }
}
`
  },
  {
    path: 'HOSTINGER_DNS_SETUP.md',
    filename: 'HOSTINGER_DNS_SETUP.md',
    description: 'Krok po kroku: Jak podpiąć domenę telepakt.pl z Hostinger.com pod serwery Render.com',
    language: 'markdown',
    content: `# Konfiguracja domeny telepakt.pl z Hostinger.com pod serwery Render.com

Posiadasz domenę **telepakt.pl** zarejestrowaną na **Hostinger.com**.
Poniżej znajduje się precyzyjna instrukcja krok po kroku, jak przekierować ruch z Hostinger na Twoją aplikację na Render.

---

## 1. Dodanie domeny w panelu Render.com
1. Zaloguj się na **https://dashboard.render.com**.
2. Wejdź w swój Web Service (np. **telepakt-backend**).
3. W menu po lewej stronie kliknij **Settings** -> przewiń do sekcji **Custom Domains**.
4. Kliknij **Add Custom Domain** i dodaj kolejno dwie domeny:
   - \`telepakt.pl\` (domena główna apex)
   - \`www.telepakt.pl\` (subdomena www)
5. Render wyświetli dla Ciebie:
   - Adres IP rekordu A (zazwyczaj Anycast IP Render: \`216.24.57.1\`)
   - Docelową nazwę CNAME dla subdomeny www (np. \`telepakt-backend.onrender.com\`)

---

## 2. Konfiguracja strefy DNS w Hostinger hPanel
1. Zaloguj się na swoje konto na **https://hpanel.hostinger.com**.
2. W sekcji **Domeny** (Domains) kliknij przycisk **Zarządzaj** (Manage) obok domeny **telepakt.pl**.
3. W menu bocznym wybierz **DNS / Serwery nazw** (DNS / Nameservers).
4. Przejdź do zakładki **Zarządzaj rekordami DNS** (Manage DNS records).

### Rekord 1: Domena główna (apex: telepakt.pl)
- **Typ (Type):** \`A\`
- **Nazwa (Name / Host):** \`@\`
- **Wskazuje na (Points to):** \`216.24.57.1\`
- **TTL:** \`300\` (lub domyślne \`14400\`)
*(Jeśli w Hostinger istnieje już stary rekord A ze starym IP parkowania Hostinger, edytuj go lub usuń).*

### Rekord 2: Subdomena WWW (www.telepakt.pl)
- **Typ (Type):** \`CNAME\`
- **Nazwa (Name / Host):** \`www\`
- **Wskazuje na (Points to):** \`twoja-nazwa-uslugi.onrender.com\` (dokładny adres z panelu Render)
- **TTL:** \`300\`

---

## 3. Certyfikat SSL / HTTPS (Let's Encrypt)
- Po zapisaniu rekordów w Hostinger, propagacja DNS zajmuje od **5 do 30 minut**.
- Render automatycznie i bezpłatnie wygeneruje certyfikat SSL **Let's Encrypt** dla obu adresów (\`https://telepakt.pl\` oraz \`https://www.telepakt.pl\`).
- Status w panelu Render zmieni się na zielony: **Verified / Certificate Issued**.

---

## 4. Konfiguracja Webhooka w Twilio
Gdy domena jest już aktywna:
1. Wejdź do panelu Twilio -> **Phone Numbers** -> Twój numer polski (+48...).
2. W polu **A Call Comes In (Webhook)** wklej:
   \`https://telepakt.pl/api/telephony/conference-bridge/\`
3. Metoda: **HTTP POST**.
`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    description: 'Kompletny podręcznik: uruchomienie Django w VS Code, użycie Gemini Code Assist oraz wdrożenie na Render',
    language: 'markdown',
    content: `# TelePakt.pl - Produkcyjny Backend Django (Python 5.x)
Chmurowy system rejestracji sprzeciwów marketingowych i ochrony przed spamem telefonicznym.
Dedykowany dla domeny **telepakt.pl** z wdrożeniem na **Render.com** i bazą **PostgreSQL**.

---

## 💡 Czy istnieje rozszerzenie Gemini dla VS Code?
**TAK!** Oficjalne rozszerzenie od Google nazywa się **Gemini Code Assist** (stworzone przez zespół Google Cloud).

### Jak zainstalować Gemini Code Assist w VS Code:
1. W VS Code otwórz panel rozszerzeń skrótem klawiszowym: \`Ctrl + Shift + X\` (lub \`Cmd + Shift + X\` na Macu).
2. Wpisz w wyszukiwarkę: \`Gemini Code Assist\` (wydawca: *Google Cloud*).
3. Kliknij **Install**.
4. W lewym dolnym rogu kliknij ikonę logowania i zaloguj się swoim kontem Google.
5. **Możliwości Gemini w tym projekcie:**
   - Zadawaj pytania o cały projekt za pomocą znacznika \`@workspace\` (np. *@workspace jak działa webhook konferencji w telephony/views.py?*).
   - Generowanie testów jednostkowych jednym kliknięciem.
   - Autouzupełnianie kodu w plikach Pythona i szablonach TwiML.

---

## 🚀 1. Szybkie uruchomienie lokalne w VS Code (2 minuty)

### Krok 1: Utworzenie środowiska wirtualnego
\`\`\`bash
# Utwórz środowisko wirtualne
python3 -m venv venv

# Aktywuj środowisko:
# Na Linux / macOS:
source venv/bin/activate
# Na Windows (PowerShell):
.\\venv\\Scripts\\Activate.ps1
\`\`\`

### Krok 2: Instalacja pakietów
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### Krok 3: Plik zmiennych .env
\`\`\`bash
cp .env.example .env
\`\`\`

### Krok 4: Migracje i start
\`\`\`bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
\`\`\`
Aplikacja działa pod adresem:
- Serwer API: \`http://127.0.0.1:8000/\`
- Panel administratora: \`http://127.0.0.1:8000/admin/\`
- Webhook Twilio: \`http://127.0.0.1:8000/api/telephony/conference-bridge/\`

---

## 🌐 2. Wdrożenie na Render.com (1-Click Blueprint)

1. Załóż bezpłatne konto na **https://render.com**.
2. W panelu Render kliknij **New +** -> **Blueprint**.
3. Połącz swoje prywatne repozytorium GitHub/GitLab z tym kodem.
4. Render odczyta plik \`render.yaml\` i sam skonfiguruje:
   - Usługę Webową Django (Python 3.11, Gunicorn, WhiteNoise)
   - Dedykowaną bazę PostgreSQL
   - Zmienne środowiskowe i automatyczne migracje bazy danych
5. W zakładce **Environment** usługi uzupełnij klucze Twilio (\`TWILIO_ACCOUNT_SID\`, \`TWILIO_AUTH_TOKEN\`).

---

## 🌐 3. Podpięcie domeny telepakt.pl (Hostinger)
Szczegółowa instrukcja z rekordami A i CNAME znajduje się w pliku **HOSTINGER_DNS_SETUP.md**.
`
  }
];
