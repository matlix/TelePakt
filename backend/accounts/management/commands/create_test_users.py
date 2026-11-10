"""Zakłada konta testowe do ręcznego sprawdzenia aplikacji (``manage.py create_test_users``).

Hasła są losowe i wypisywane raz (lub podajesz własne przez ``--password``). Poza trybem
deweloperskim komenda odmawia działania bez ``--force``, żeby w prawdziwej bazie nie
powstały konta ze znanymi hasłami.
"""
import secrets

from django.conf import settings
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Profile
from accounts.services import normalize_phone


class Command(BaseCommand):
    help = "Tworzy konta testowe (test1@telepakt.test ...) z losowymi hasłami."

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=2)
        parser.add_argument('--password', help="To samo hasło dla wszystkich kont (domyślnie losowe)")
        parser.add_argument('--phone', help="Chroniony numer pierwszego konta, np. 500123456")
        parser.add_argument('--force', action='store_true', help="Zezwól poza DJANGO_DEBUG=True")

    def handle(self, *args, **opts):
        if not settings.DEBUG and not opts['force']:
            raise CommandError("To nie jest środowisko deweloperskie. Użyj --force, jeśli naprawdę tego chcesz.")

        for i in range(1, opts['count'] + 1):
            email = f'test{i}@telepakt.test'
            password = opts['password'] or secrets.token_urlsafe(9)
            user, created = User.objects.get_or_create(username=email, defaults={'email': email})
            user.set_password(password)
            user.save()
            profile, _ = Profile.objects.get_or_create(user=user, defaults={'name': f'Tester {i}'})
            if i == 1 and opts['phone']:
                profile.phone_protected = normalize_phone(opts['phone']) or ''
                profile.save()
            self.stdout.write(f"{'utworzono' if created else 'zaktualizowano'}: {email}  haslo: {password}")
