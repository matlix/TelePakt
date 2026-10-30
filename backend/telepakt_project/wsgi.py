"""Konfiguracja WSGI dla projektu TelePakt na serwerze Gunicorn (Render.com)."""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'telepakt_project.settings')

application = get_wsgi_application()
