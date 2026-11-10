#!/usr/bin/env bash
# Zakończ natychmiast w przypadku błędu
set -o errexit

echo "==> 1. Przechodzenie do katalogu backend..."
cd "$(dirname "$0")"

echo "==> 2. Instalacja zależności Python z requirements.txt..."
pip install -r requirements.txt

echo "==> 2b. Kontrola wersji Python/Django..."
python - <<'PYCHECK'
import sys, django
print(f"Python {sys.version.split()[0]}, Django {django.get_version()}")
# Django < 5.2.8 nie dziala na Pythonie 3.14: copy(Context) rzuca AttributeError i KAZDA strona panelu daje 500.
if sys.version_info >= (3, 14) and django.VERSION < (5, 2, 8):
    sys.exit("BLAD: Python %s wymaga Django >= 5.2.8 (jest %s). Ustaw PYTHON_VERSION=3.12.8 w Render albo podnies Django." % (sys.version.split()[0], django.get_version()))
PYCHECK

echo "==> 3. Zbieranie plików statycznych (WhiteNoise)..."
python manage.py collectstatic --noinput

echo "==> 4. Wykonywanie migracji bazy danych PostgreSQL..."
python manage.py migrate

echo "==> 5. Konto administratora (tylko gdy ustawiono DJANGO_SUPERUSER_USERNAME i DJANGO_SUPERUSER_PASSWORD)..."
if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  python manage.py createsuperuser --noinput || echo "(administrator już istnieje - pomijam)"
fi

echo "==> Wdrożenie TelePakt API na Render.com zakończone sukcesem!"
