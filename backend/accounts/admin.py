from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'phone_protected', 'subscription_plan', 'created_at')
    list_filter = ('subscription_plan',)
    search_fields = ('name', 'user__email', 'phone_protected')
    list_editable = ('subscription_plan',)
