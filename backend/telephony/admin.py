"""Panel administracyjny Django dla systemu TelePakt (telepakt.pl)."""
from django.contrib import admin
from .models import LegalScript, CallLog, UkeComplaint, CustomerReview, IntegrationCredential, InAppPurchaseReceipt

@admin.register(LegalScript)
class LegalScriptAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'auto_hangup', 'is_active', 'display_order')
    list_editable = ('auto_hangup', 'is_active', 'display_order')
    search_fields = ('title', 'text_content', 'legal_act')
    list_filter = ('category', 'auto_hangup', 'is_active')

@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ('caller_number', 'timestamp', 'duration_seconds', 'status', 'downloaded_locally', 'deleted_from_server')
    search_fields = ('caller_number', 'call_sid', 'sha256_hash')
    list_filter = ('status', 'downloaded_locally', 'deleted_from_server')
    readonly_fields = ('call_sid', 'sha256_hash', 'timestamp')

@admin.register(UkeComplaint)
class UkeComplaintAdmin(admin.ModelAdmin):
    list_display = ('case_reference_number', 'applicant_name', 'call_log', 'submitted_to_epuap', 'created_at')
    search_fields = ('case_reference_number', 'applicant_name', 'applicant_email')
    list_filter = ('submitted_to_epuap',)

@admin.register(CustomerReview)
class CustomerReviewAdmin(admin.ModelAdmin):
    list_display = ('author_name', 'rating', 'title', 'is_approved', 'is_featured', 'device_type', 'created_at')
    list_filter = ('is_approved', 'is_featured', 'rating', 'device_type')
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
class IntegrationCredentialAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'key', 'is_active', 'last_tested_at')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'key')
    readonly_fields = ('last_tested_at',)

@admin.register(InAppPurchaseReceipt)
class InAppPurchaseReceiptAdmin(admin.ModelAdmin):
    list_display = ('user_email', 'platform', 'product_id', 'is_verified', 'expires_at', 'created_at')
    list_filter = ('platform', 'is_verified')
    search_fields = ('user_email', 'product_id', 'purchase_token')
