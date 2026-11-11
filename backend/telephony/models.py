"""Modele danych PostgreSQL dla TelePakt (telepakt.pl)."""
import uuid
import hashlib
from django.db import models
from django.utils import timezone

class LegalScript(models.Model):
    CATEGORY_CHOICES = [
        ('pke', 'Ustawa PKE (art. 398 - Kara do 1 mln zł)'),
        ('rodo', 'Sprzeciw RODO (art. 21) i żądanie usunięcia'),
        ('kradziez_tozsamosci', 'Podszywanie pod bank / instytucję'),
        ('b2b', 'Zakaz spamu dla jednoosobowych działalności'),
        ('windykacja', 'Naruszenie miru domowego przez windykację'),
    ]

    title = models.CharField(max_length=200, verbose_name="Tytuł scenariusza")
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, verbose_name="Kategoria prawna")
    text_content = models.TextField(verbose_name="Treść formuły prawnej")
    legal_act = models.CharField(max_length=255, verbose_name="Podstawa prawna")
    auto_hangup = models.BooleanField(default=True, verbose_name="Automatyczne rozłączenie po wygłoszeniu")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Kolejność wyświetlania")
    is_active = models.BooleanField(default=True, verbose_name="Aktywny w aplikacji klienta")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'id']
        verbose_name = "Formuła Prawna"
        verbose_name_plural = "Formuły Prawne"

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class CallLog(models.Model):
    STATUS_CHOICES = [
        ('initiated', 'Rozpoczęte (3-way merge)'),
        ('formula_played', 'Odtworzono formułę prawną'),
        ('recorded', 'Zarejestrowano ścieżkę dźwiękową'),
        ('downloaded', 'Pobrano przez klienta (Lokalnie/Cloud)'),
        ('deleted', 'Trwale usunięto z serwerów (Zero-Storage)'),
    ]

    call_sid = models.CharField(max_length=64, unique=True, verbose_name="Twilio Call SID")
    caller_number = models.CharField(max_length=32, verbose_name="Numer dzwoniącego spamera")
    recipient_number = models.CharField(max_length=32, verbose_name="Numer chroniony klienta")
    timestamp = models.DateTimeField(default=timezone.now, verbose_name="Czas połączenia")
    duration_seconds = models.PositiveIntegerField(default=0, verbose_name="Czas trwania (sekundy)")
    recording_url = models.URLField(max_length=500, blank=True, null=True, verbose_name="Tymczasowy URL nagrania Twilio (kasowany po pobraniu)")
    recording_sid = models.CharField(max_length=64, blank=True, verbose_name="Twilio Recording SID (do skasowania nagrania)")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='initiated')
    provider = models.CharField(max_length=20, default='twilio', verbose_name="Dostawca telefonii")
    recording_started = models.BooleanField(default=False, verbose_name="Nagrywanie włączone (przyciskiem lub od początku)")
    downloaded_locally =models.BooleanField(default=False, verbose_name="Zapisano na urządzeniu klienta")
    deleted_from_server = models.BooleanField(default=False, verbose_name="Usunięto z serwerów (Zero-Storage)")
    retention_expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Termin autokasowania")

    class Meta:
        verbose_name = "Rejestr Połączenia Dowodowego"
        verbose_name_plural = "Rejestry Połączeń Dowodowych"

    def __str__(self):
        return f"{self.caller_number} -> {self.recipient_number} ({self.timestamp.strftime('%Y-%m-%d %H:%M')})"


class UkeComplaint(models.Model):
    case_reference_number = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    call_log = models.OneToOneField(CallLog, on_delete=models.CASCADE, related_name='complaint')
    applicant_name = models.CharField(max_length=150, verbose_name="Zgłaszający")
    applicant_email = models.EmailField(verbose_name="E-mail zgłaszającego")
    violator_company_name = models.CharField(max_length=255, blank=True, verbose_name="Zidentyfikowana firma")
    submitted_to_epuap = models.BooleanField(default=False, verbose_name="Wysłano przez ePUAP")
    pdf_document = models.FileField(upload_to='complaints/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Wniosek do Prezesa UKE"
        verbose_name_plural = "Wnioski do Prezesa UKE"


class CustomerReview(models.Model):
    DEVICE_CHOICES = [
        ('Android', 'Android (Samsung, Xiaomi, Pixel)'),
        ('iOS', 'iPhone (Apple iOS)'),
        ('Web', 'Przeglądarka WWW (telepakt.pl)')
    ]

    author_name = models.CharField(max_length=100, verbose_name="Imię lub Nick")
    rating = models.IntegerField(default=5, verbose_name="Ocena (1-5 gwiazdek)")
    title = models.CharField(max_length=150, verbose_name="Tytuł recenzji")
    content = models.TextField(verbose_name="Treść opinii")
    device_type = models.CharField(max_length=20, choices=DEVICE_CHOICES, default='Android')
    is_approved = models.BooleanField(default=False, verbose_name="Zatwierdzona do publikacji na WWW")
    is_featured = models.BooleanField(default=False, verbose_name="Wyróżniona na stronie głównej")
    admin_reply = models.TextField(blank=True, null=True, verbose_name="Odpowiedź administratora")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Opinia Klienta"
        verbose_name_plural = "Opinie Klientów"

    def __str__(self):
        return f"{self.author_name} ({self.rating}★): {self.title}"


class IntegrationCredential(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nazwa integracji")
    category = models.CharField(max_length=50, verbose_name="Kategoria")
    key = models.CharField(max_length=255, verbose_name="Klucz/Identyfikator")
    secret_value = models.TextField(verbose_name="Tajny klucz (zaszyfrowany)")
    is_active = models.BooleanField(default=True, verbose_name="Aktywna")
    last_tested_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Poświadczenie API / Integracja"
        verbose_name_plural = "Poświadczenia API / Integracje"


class InAppPurchaseReceipt(models.Model):
    PLATFORM_CHOICES = [
        ('google_play', 'Google Play Store'),
        ('apple_storekit', 'Apple App Store'),
        ('samsung_galaxy', 'Samsung Galaxy Store'),
        ('huawei_appgallery', 'Huawei AppGallery'),
    ]

    user_email = models.EmailField(verbose_name="E-mail abonenta")
    platform = models.CharField(max_length=30, choices=PLATFORM_CHOICES, default='google_play', verbose_name="Platforma Marketplace")
    product_id = models.CharField(max_length=100, verbose_name="ID Produktu")
    purchase_token = models.TextField(verbose_name="Token paragonu zakupu")
    is_verified = models.BooleanField(default=False, verbose_name="Zweryfikowano z serwerem sklepu")
    expires_at = models.DateTimeField(verbose_name="Koniec ważności subskrypcji")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Paragon In-App Purchase"
        verbose_name_plural = "Paragony In-App Purchases"


class TelephonyProvider(models.Model):
    """Dostawca telefonii (Twilio, Telnyx...) z danymi dostępowymi ustawianymi w panelu admina.

    Wybór dostawcy: włączeni (``is_enabled``) wg ``priority``; zdrowi przed niezdrowymi.
    Stan (``status``) aktualizuje okresowe sprawdzanie - patrz :mod:`telephony.providers`.
    """
    KIND_CHOICES = [('twilio', 'Twilio'), ('telnyx', 'Telnyx (TeXML)')]
    STATUS_CHOICES = [('unknown', 'Nie sprawdzono'), ('ok', 'Działa'), ('failing', 'Awaria')]

    kind = models.CharField(max_length=20, choices=KIND_CHOICES, unique=True)
    is_enabled = models.BooleanField(default=False, verbose_name="Włączony")
    priority = models.PositiveIntegerField(default=10, verbose_name="Priorytet (mniejszy = ważniejszy)")
    account_sid = models.CharField(max_length=128, blank=True, verbose_name="Account SID / ID konta")
    secret_encrypted = models.TextField(blank=True, editable=False)
    phone_number = models.CharField(max_length=32, blank=True, verbose_name="Numer TelePakt u tego dostawcy (E.164)")
    webhook_token = models.CharField(max_length=64, blank=True, editable=False)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='unknown')
    consecutive_failures = models.PositiveIntegerField(default=0)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    last_ok_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=300, blank=True)

    class Meta:
        ordering = ['priority', 'id']
        verbose_name = "Dostawca telefonii"
        verbose_name_plural = "Dostawcy telefonii"

    def __str__(self):
        return self.get_kind_display()


class VoiceMessage(models.Model):
    """Komunikat użytkownika odtwarzany rozmówcy (głos syntezatora albo własne nagranie WAV)."""
    owner = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='voice_messages')
    title = models.CharField(max_length=80, verbose_name="Tytuł")
    situation = models.CharField(max_length=30, default='custom', verbose_name="Sytuacja")
    text = models.TextField(max_length=1000, verbose_name="Treść (czytana głosem syntezatora)")
    audio = models.BinaryField(null=True, blank=True, editable=False)  # własne nagranie WAV (do 2 MB)
    audio_seconds = models.FloatField(default=0)
    # Niezgadywalny token w adresie, który pobiera dostawca telefonii (bez logowania).
    public_token = models.CharField(max_length=40, unique=True, editable=False)
    position = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True, verbose_name="Pokazuj w nakładce")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position', 'id']
        verbose_name = "Komunikat głosowy"
        verbose_name_plural = "Komunikaty głosowe"

    @property
    def has_audio(self) -> bool:
        return bool(self.audio)

    def __str__(self):
        return f"{self.title} ({self.owner})"


class ArmedMessage(models.Model):
    """Komunikat "uzbrojony" suwakiem przed odrzuceniem rozmowy: odtworzy go TelePakt po przekierowaniu.

    Jeden na użytkownika (kolejne uzbrojenie nadpisuje poprzednie); ważny krótko - patrz
    ``voice_views.ARM_TTL``. Po użyciu jest kasowany.
    """
    owner = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='armed_message')
    message = models.ForeignKey(VoiceMessage, on_delete=models.CASCADE, related_name='+')
    armed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Uzbrojony komunikat"
        verbose_name_plural = "Uzbrojone komunikaty"
