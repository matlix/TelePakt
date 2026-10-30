#!/usr/bin/env python
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
