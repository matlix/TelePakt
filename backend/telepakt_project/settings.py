"""
Konfiguracja Django dla projektu TelePakt (telepakt.pl).
Zoptymalizowana pod wdrożenie na chmurze Render.com z bazą PostgreSQL.
"""

import os
from pathlib import Path
import dj_database_url
from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')

# Klucz sesji/CSRF. Na Render generowany automatycznie (render.yaml: generateValue).
# Bez zmiennej DJANGO_SECRET_KEY produkcja nie wystartuje; lokalnie (DEBUG) używamy
# jawnie niebezpiecznego klucza deweloperskiego.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = 'django-insecure-local-development-only'
    else:
        raise ImproperlyConfigured(
            "Ustaw zmienną środowiskową DJANGO_SECRET_KEY (lub DJANGO_DEBUG=True lokalnie)."
        )

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get(
        'ALLOWED_HOSTS',
        'telepakt.pl,www.telepakt.pl,api.telepakt.pl,telepakt-api.onrender.com,localhost,127.0.0.1'
    ).split(',')
]

INSTALLED_APPS = [
    # Motyw panelu (Unfold) musi byc przed django.contrib.admin.
    'unfold',
    'unfold.contrib.filters',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'accounts.apps.AccountsConfig',
    'telephony.apps.TelephonyConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
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

DATABASES = {
    'default': dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        conn_health_checks=True,
    )
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

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']  # m.in. Chart.js do statystyk w panelu (bez CDN)
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    # Health check Render może przyjść po HTTP wewnątrz sieci - nie przekierowuj go.
    SECURE_REDIRECT_EXEMPT = [r'^api/telephony/health/$']
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

CORS_ALLOW_ALL_ORIGINS = DEBUG
# Origins aplikacji mobilnej (Capacitor, androidScheme=https) sa STALE i zawsze dozwolone: bez nich
# aplikacja nie polaczy sie z API ("Brak polaczenia z serwerem"), nawet gdy zmienna srodowiskowa
# CORS_ALLOWED_ORIGINS na Render zawiera tylko adresy stron WWW.
APP_ORIGINS = ['https://localhost', 'capacitor://localhost']
CORS_ALLOWED_ORIGINS = list(dict.fromkeys(
    [o.strip() for o in os.environ.get('CORS_ALLOWED_ORIGINS', 'https://telepakt.pl,https://www.telepakt.pl').split(',')
     if o.strip()] + APP_ORIGINS
))

# Django REST Framework: publiczne endpointy są ograniczone throttlingiem.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['accounts.auth.BearerTokenAuthentication'],
    'DEFAULT_THROTTLE_RATES': {
        'auth': os.environ.get('AUTH_THROTTLE_RATE', '30/hour'),
        'password_reset': os.environ.get('RESET_THROTTLE_RATE', '5/hour'),
        'password_reset_confirm': os.environ.get('RESET_CONFIRM_THROTTLE_RATE', '20/hour'),
        'reviews': os.environ.get('REVIEWS_THROTTLE_RATE', '30/hour'),
        'recording': os.environ.get('RECORDING_THROTTLE_RATE', '60/hour'),
    },
}

# E-mail (kody resetu hasla). Bez EMAIL_HOST wiadomosci trafiaja tylko do logow serwera.
EMAIL_BACKEND = (
    'django.core.mail.backends.smtp.EmailBackend' if os.environ.get('EMAIL_HOST')
    else 'django.core.mail.backends.console.EmailBackend'
)
EMAIL_HOST = os.environ.get('EMAIL_HOST', '')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
# Port 465 = SSL od razu (EMAIL_USE_SSL=True); port 587 = STARTTLS (EMAIL_USE_TLS=True).
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False').lower() in ('true', '1', 'yes')
EMAIL_USE_TLS = not EMAIL_USE_SSL and os.environ.get('EMAIL_USE_TLS', 'True').lower() in ('true', '1', 'yes')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'TelePakt <noreply@telepakt.pl>')

# Twilio & Retencja
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
# Numer dostawcy ustawia się w panelu admina (Dostawcy telefonii); zmienna TWILIO_PHONE_NUMBER to tylko zapas przy pierwszym uruchomieniu.
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER', '')
APP_BASE_URL = os.environ.get('APP_BASE_URL', 'https://telepakt.pl')  # strona WWW (statyczna)
# Adres API, pod ktorym dostawcy telefonii wolaja webhooki (NIE strona WWW).
API_PUBLIC_URL = os.environ.get('API_PUBLIC_URL', 'https://api.telepakt.pl')
DEFAULT_RETENTION_DAYS = int(os.environ.get('RETENTION_DAYS', '30'))


# --- Panel administracyjny (django-unfold) -------------------------------------------------
from django.urls import reverse_lazy  # noqa: E402

UNFOLD = {
    "SITE_TITLE": "TelePakt Admin",
    "SITE_HEADER": "TelePakt",
    "SITE_SUBHEADER": "Panel administratora",
    "SITE_SYMBOL": "shield",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "DASHBOARD_CALLBACK": "telepakt_project.dashboard.dashboard_callback",
    "COLORS": {
        "primary": {
            "50": "oklch(97.5% 0.014 215)",
            "100": "oklch(95% 0.03 215)",
            "200": "oklch(90% 0.06 215)",
            "300": "oklch(83% 0.1 215)",
            "400": "oklch(75% 0.125 215)",
            "500": "oklch(67% 0.13 220)",
            "600": "oklch(58% 0.115 225)",
            "700": "oklch(49% 0.1 230)",
            "800": "oklch(41% 0.085 235)",
            "900": "oklch(34% 0.07 240)",
            "950": "oklch(24% 0.05 245)",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Statystyki",
                "separator": False,
                "collapsible": False,
                "items": [
                    {"title": "Połączenia", "icon": "bar_chart", "link": reverse_lazy("admin_stats_calls")},
                    {"title": "Użytkownicy", "icon": "monitoring", "link": reverse_lazy("admin_stats_users")},
                    {"title": "Opinie i zakupy", "icon": "query_stats", "link": reverse_lazy("admin_stats_feedback")},
                ],
            },
            {
                "title": "Telefonia",
                "separator": True,
                "items": [
                    {"title": "Dostawcy telefonii", "icon": "cell_tower", "link": reverse_lazy("admin:telephony_telephonyprovider_changelist")},
                    {"title": "Rejestr połączeń", "icon": "call", "link": reverse_lazy("admin:telephony_calllog_changelist")},
                    {"title": "Formuły prawne", "icon": "gavel", "link": reverse_lazy("admin:telephony_legalscript_changelist")},
                    {"title": "Wnioski do UKE", "icon": "description", "link": reverse_lazy("admin:telephony_ukecomplaint_changelist")},
                ],
            },
            {
                "title": "Konta",
                "separator": True,
                "collapsible": True,
                "items": [
                    {"title": "Profile", "icon": "badge", "link": reverse_lazy("admin:accounts_profile_changelist")},
                    {"title": "Użytkownicy", "icon": "person", "link": reverse_lazy("admin:auth_user_changelist")},
                    {"title": "Grupy", "icon": "group", "link": reverse_lazy("admin:auth_group_changelist")},
                ],
            },
            {
                "title": "Opinie i płatności",
                "separator": True,
                "collapsible": True,
                "items": [
                    {"title": "Opinie klientów", "icon": "reviews", "link": reverse_lazy("admin:telephony_customerreview_changelist")},
                    {"title": "Paragony IAP", "icon": "receipt_long", "link": reverse_lazy("admin:telephony_inapppurchasereceipt_changelist")},
                    {"title": "Poświadczenia API", "icon": "key", "link": reverse_lazy("admin:telephony_integrationcredential_changelist")},
                ],
            },
        ],
    },
}

# --- Logowanie ------------------------------------------------------------------------------
# Domyslnie Django (DEBUG=False) NIE zapisuje tracebackow bledow 500 nigdzie poza mailem do ADMINS,
# wiec w logach Render widac tylko "500", bez przyczyny. Kierujemy je na stderr (logi Render).
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {'plain': {'format': '%(asctime)s %(levelname)s %(name)s: %(message)s'}},
    'handlers': {'console': {'class': 'logging.StreamHandler', 'formatter': 'plain'}},
    'loggers': {
        'django.request': {'handlers': ['console'], 'level': 'ERROR', 'propagate': False},
        'django.security': {'handlers': ['console'], 'level': 'WARNING', 'propagate': False},
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
}
