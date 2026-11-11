"""Panel administracyjny TelePakt (django-unfold): telefonia, opinie, płatności."""
import secrets

from django import forms
from django.conf import settings
from django.contrib import admin, messages
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import RangeDateTimeFilter
from unfold.decorators import display
from unfold.widgets import UnfoldAdminPasswordToggleWidget

from . import providers
from .models import (
    CallLog, CustomerReview, InAppPurchaseReceipt, IntegrationCredential, LegalScript,
    TelephonyProvider, UkeComplaint,
)


@admin.register(LegalScript)
class LegalScriptAdmin(ModelAdmin):
    list_display = ('title', 'category', 'auto_hangup', 'is_active', 'display_order')
    list_editable = ('auto_hangup', 'is_active', 'display_order')
    search_fields = ('title', 'text_content', 'legal_act')
    list_filter = ('category', 'auto_hangup', 'is_active')


@admin.register(CallLog)
class CallLogAdmin(ModelAdmin):
    list_display = ('caller_number', 'recipient_number', 'timestamp', 'duration_seconds', 'show_status',
                    'provider', 'recording_started', 'deleted_from_server')
    search_fields = ('caller_number', 'recipient_number', 'call_sid')
    list_filter_submit = True
    list_filter = (('timestamp', RangeDateTimeFilter), 'status', 'provider', 'recording_started',
                   'downloaded_locally', 'deleted_from_server')
    readonly_fields = ('call_sid', 'recording_sid', 'timestamp')
    date_hierarchy = 'timestamp'
    ordering = ('-timestamp',)

    @display(description="Status", label={
        'initiated': 'info', 'formula_played': 'warning', 'recorded': 'success',
        'downloaded': 'success', 'deleted': 'danger',
    })
    def show_status(self, obj):
        return obj.status, obj.get_status_display()


@admin.register(UkeComplaint)
class UkeComplaintAdmin(ModelAdmin):
    list_display = ('case_reference_number', 'applicant_name', 'call_log', 'submitted_to_epuap', 'created_at')
    search_fields = ('case_reference_number', 'applicant_name', 'applicant_email')
    list_filter = ('submitted_to_epuap', ('created_at', RangeDateTimeFilter))
    list_filter_submit = True


@admin.register(CustomerReview)
class CustomerReviewAdmin(ModelAdmin):
    list_display = ('author_name', 'rating', 'title', 'is_approved', 'is_featured', 'device_type', 'created_at')
    list_filter = ('is_approved', 'is_featured', 'rating', 'device_type', ('created_at', RangeDateTimeFilter))
    list_filter_submit = True
    search_fields = ('author_name', 'title', 'content')
    actions = ['approve_reviews', 'feature_reviews', 'unapprove_reviews']

    @admin.action(description="Zatwierdź wybrane opinie do publikacji na telepakt.pl")
    def approve_reviews(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Wyróżnij wybrane opinie na stronie głównej")
    def feature_reviews(self, request, queryset):
        queryset.update(is_featured=True, is_approved=True)

    @admin.action(description="Cofnij publikację (ukryj przed użytkownikami)")
    def unapprove_reviews(self, request, queryset):
        queryset.update(is_approved=False, is_featured=False)


@admin.register(IntegrationCredential)
class IntegrationCredentialAdmin(ModelAdmin):
    list_display = ('name', 'category', 'key', 'is_active', 'last_tested_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'key')
    readonly_fields = ('last_tested_at',)


@admin.register(InAppPurchaseReceipt)
class InAppPurchaseReceiptAdmin(ModelAdmin):
    list_display = ('user_email', 'platform', 'product_id', 'is_verified', 'expires_at', 'created_at')
    list_filter = ('platform', 'is_verified', ('created_at', RangeDateTimeFilter))
    list_filter_submit = True
    search_fields = ('user_email', 'product_id', 'purchase_token')


class TelephonyProviderForm(forms.ModelForm):
    secret = forms.CharField(
        label="Auth Token / API Key", required=False,
        widget=UnfoldAdminPasswordToggleWidget(render_value=False),
        help_text="Zostaw puste, aby nie zmieniać zapisanego sekretu. Przechowywany szyfrowany.",
    )

    class Meta:
        model = TelephonyProvider
        fields = ('kind', 'is_enabled', 'priority', 'account_sid', 'secret', 'phone_number')


@admin.register(TelephonyProvider)
class TelephonyProviderAdmin(ModelAdmin):
    form = TelephonyProviderForm
    list_display = ('kind', 'is_enabled', 'priority', 'show_status', 'has_secret', 'phone_number',
                    'last_checked_at', 'last_error')
    list_editable = ('is_enabled', 'priority')
    readonly_fields = ('status', 'consecutive_failures', 'last_checked_at', 'last_ok_at', 'last_error', 'webhook_urls')
    actions = ['check_now', 'check_tts', 'rotate_webhook_token']

    @display(description="Stan", label={'ok': 'success', 'failing': 'danger', 'unknown': 'warning'})
    def show_status(self, obj):
        return obj.status, obj.get_status_display()

    @display(boolean=True, description="Sekret zapisany")
    def has_secret(self, obj):
        return bool(obj.secret_encrypted)

    @display(description="Adresy webhooków do wpisania u dostawcy")
    def webhook_urls(self, obj):
        base = settings.API_PUBLIC_URL.rstrip('/')
        q = providers.callback_query(obj.kind) if obj and obj.pk else ''
        return (f"Voice (incoming call): {base}/api/telephony/conference-bridge/{q}  |  "
                f"Recording callback: {base}/api/telephony/recording-callback/{q}")

    def get_fields(self, request, obj=None):
        fields = list(super().get_fields(request, obj))
        extra = ('webhook_urls', 'status', 'consecutive_failures', 'last_checked_at', 'last_ok_at', 'last_error')
        return fields + [f for f in extra if f not in fields]

    def save_model(self, request, obj, form, change):
        if not obj.webhook_token:
            obj.webhook_token = secrets.token_urlsafe(24)
        if form.cleaned_data.get('secret'):
            obj.secret_encrypted = providers.encrypt_secret(form.cleaned_data['secret'])
            obj.status, obj.consecutive_failures = 'unknown', 0
        super().save_model(request, obj, form, change)

    def changelist_view(self, request, extra_context=None):
        providers.ensure_default_providers()  # Twilio i Telnyx widoczni od pierwszego wejścia
        return super().changelist_view(request, extra_context)

    @admin.action(description="Sprawdź teraz połączenie z wybranymi dostawcami")
    def check_now(self, request, queryset):
        for row in queryset:
            ok = providers.run_check(row)
            self.message_user(request, f"{row}: {'działa' if ok else 'BŁĄD - ' + row.last_error}",
                              messages.SUCCESS if ok else messages.ERROR)

    @admin.action(description="Wygeneruj nowy token webhooka (stary przestaje działać)")
    def rotate_webhook_token(self, request, queryset):
        for row in queryset:
            row.webhook_token = secrets.token_urlsafe(24)
            row.save(update_fields=['webhook_token'])
        self.message_user(
            request,
            "Nowy token wygenerowany. Skopiuj zaktualizowane adresy webhooków do panelu dostawcy "
            "(Telnyx: pole Voice URL aplikacji TeXML) - stare adresy są już nieważne.",
            messages.WARNING,
        )

    @admin.action(description="Sprawdź syntezę mowy (głos AI) - pełny wynik próby")
    def check_tts(self, request, queryset):
        for row in queryset.filter(kind='telnyx'):
            try:
                audio, content_type = providers.TelnyxProvider(row).synthesize('Test głosu. Jeden, dwa, trzy.', 'Polly.Ola-Neural', 100)
            except Exception as exc:  # noqa: BLE001 - pokazujemy pełny powód, żeby dało się go naprawić
                self.message_user(request, f"Synteza mowy Telnyx - BŁĄD: {exc}", messages.ERROR)
            else:
                self.message_user(request, f"Synteza mowy Telnyx działa: {len(audio) // 1024} KB {content_type}.", messages.SUCCESS)
        if not queryset.filter(kind='telnyx').exists():
            self.message_user(request, "Zaznacz wiersz Telnyx - synteza mowy (podgląd głosu) używa jego klucza.", messages.WARNING)
