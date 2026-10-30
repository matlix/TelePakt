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
    recording_url = models.URLField(max_length=500, blank=True, null=True, verbose_name="Tymczasowy URL nagrania Twilio")
    sha256_hash = models.CharField(max_length=64, blank=True, verbose_name="Suma kontrolna dowodu SHA-256")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='initiated')
    downloaded_locally = models.BooleanField(default=False, verbose_name="Zapisano na urządzeniu klienta")
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
        verbose_name = "Wniosek do Prezesa UKE (Art. 445 PKE)"
        verbose_name_plural = "Wnioski do Prezesa UKE (Art. 445 PKE)"


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
    user_email = models.EmailField(verbose_name="E-mail abonenta")
    platform = models.CharField(max_length=30, verbose_name="Platforma (google_play / apple)")
    product_id = models.CharField(max_length=100, verbose_name="ID Produktu")
    purchase_token = models.TextField(verbose_name="Token paragonu zakupu")
    is_verified = models.BooleanField(default=False, verbose_name="Zweryfikowano z serwerem sklepu")
    expires_at = models.DateTimeField(verbose_name="Koniec ważności subskrypcji")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Paragon In-App Purchase"
        verbose_name_plural = "Paragony In-App Purchases"
