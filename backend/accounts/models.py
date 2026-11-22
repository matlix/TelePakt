"""Konta użytkowników TelePakt (zastępują Firebase Auth + Firestore).

Logowanie: e-mail + hasło (``django.contrib.auth.User``, ``username`` = e-mail małymi literami).
Sesja aplikacji: token Bearer; w bazie trzymamy tylko jego skrót SHA-256, więc wyciek bazy
nie ujawnia działających sesji.
"""
from django.conf import settings
from django.db import models
from django.utils import timezone


class Profile(models.Model):
    PLAN_CHOICES = [('free', 'Free'), ('shield', 'Tarcza'), ('b2b', 'B2B')]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=128, verbose_name="Imię i nazwisko / firma")
    phone_protected = models.CharField(max_length=16, blank=True, verbose_name="Chroniony numer (E.164)")
    # Plan płatny ustawia wyłącznie serwer (admin / weryfikacja zakupu w sklepie), nigdy klient.
    subscription_plan = models.CharField(max_length=10, choices=PLAN_CHOICES, default='free')
    tts_voice = models.CharField(max_length=40, default='Polly.Ola-Neural', verbose_name="Głos komunikatów")
    tts_rate = models.PositiveSmallIntegerField(default=110, verbose_name="Tempo komunikatów (%)")
    created_at = models.DateTimeField(default=timezone.now)
    # Wynik sprawdzenia w aplikacji, czy operator użytkownika pozwala na rozmowy konferencyjne (3-way). None = nie
    # sprawdzano. False = operator nie wspiera - usługa nie zadziała i klientowi należy się przeprosiny i zwrot.
    conference_supported = models.BooleanField(null=True, blank=True, verbose_name="Operator wspiera 3-way")
    carrier_note = models.CharField(max_length=120, blank=True, verbose_name="Operator (z aplikacji)")
    carrier_checked_at = models.DateTimeField(null=True, blank=True, verbose_name="Sprawdzono")
    # Przedplacone srodki na funkcje TelePakt przez dostawce telefonii (sekundy rozmow 3-way). Egzekwowane tylko przy
    # TELEPAKT_REQUIRE_CREDIT=1; przy 0 srodkow aplikacja dziala jak zwykly telefon. Doladowuje admin (docelowo sklep).
    credit_seconds = models.PositiveIntegerField(default=0, verbose_name="Środki (sekundy rozmów)")
    # Konto testowe: aplikacja wysyla na serwer dziennik uzycia i bledow (autotest), do diagnozy.
    is_tester = models.BooleanField(default=False, verbose_name="Konto testowe (dziennik klienta)")

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profile"

    def __str__(self):
        return f"{self.name} <{self.user.email}>"


class AuthToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='auth_tokens')
    key_hash = models.CharField(max_length=64, unique=True)
    device = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    last_used_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Token sesji"
        verbose_name_plural = "Tokeny sesji"


class PasswordResetCode(models.Model):
    """Jednorazowy kod z e-maila do zmiany hasła (skrót, ważny 15 min, max 5 prób)."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reset_codes')
    code_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)


class ClientLog(models.Model):
    """Wpis dziennika z aplikacji konta testowego (ekran, uzycie, blad) - do diagnozy usterek bez dostepu do telefonu."""
    LEVELS = [('info', 'info'), ('warn', 'warn'), ('error', 'error')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_logs')
    level = models.CharField(max_length=5, choices=LEVELS, default='info')
    source = models.CharField(max_length=40, blank=True, verbose_name="Źródło (np. autotest, js, native)")
    screen = models.CharField(max_length=60, blank=True)
    message = models.CharField(max_length=500)
    details = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now, db_index=True)

    class Meta:
        verbose_name = "Dziennik klienta"
        verbose_name_plural = "Dziennik klienta"
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.level}] {self.message[:60]}"
