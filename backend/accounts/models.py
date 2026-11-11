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
