#!/usr/bin/env bash
# Zakończ natychmiast w przypadku błędu
set -o errexit

echo "==> 1. Przechodzenie do katalogu backend..."
cd "$(dirname "$0")"

echo "==> 2. Instalacja zależności Python z requirements.txt..."
pip install -r requirements.txt

echo "==> 3. Zbieranie plików statycznych (WhiteNoise)..."
python manage.py collectstatic --noinput

echo "==> 4. Wykonywanie migracji bazy danych PostgreSQL..."
python manage.py migrate

echo "==> 5. Konto administratora (tylko gdy ustawiono DJANGO_SUPERUSER_USERNAME i DJANGO_SUPERUSER_PASSWORD)..."
if [ -n "${DJANGO_SUPERUSER_USERNAME:-}" ] && [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
  python manage.py createsuperuser --noinput || echo "(administrator już istnieje - pomijam)"
fi

echo "==> Wdrożenie TelePakt API na Render.com zakończone sukcesem!"
