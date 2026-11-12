"""Konta w panelu (django-unfold): użytkownicy z profilem, grupy, profile."""
from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as BaseGroupAdmin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group, User
from unfold.admin import ModelAdmin, StackedInline
from unfold.contrib.filters.admin import RangeDateTimeFilter
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm

from .models import Profile

admin.site.unregister(User)
admin.site.unregister(Group)


class ProfileInline(StackedInline):
    model = Profile
    can_delete = False
    extra = 0


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm
    inlines = [ProfileInline]
    list_display = ('email', 'username', 'is_active', 'is_staff', 'date_joined', 'last_login')
    list_filter = ('is_active', 'is_staff', 'is_superuser', ('date_joined', RangeDateTimeFilter))
    list_filter_submit = True
    search_fields = ('email', 'username', 'profile__name', 'profile__phone_protected')


@admin.register(Group)
class GroupAdmin(BaseGroupAdmin, ModelAdmin):
    pass


@admin.register(Profile)
class ProfileAdmin(ModelAdmin):
    list_display = ('name', 'user', 'phone_protected', 'subscription_plan', 'conference_supported', 'carrier_note', 'created_at')
    list_filter = ('subscription_plan', 'conference_supported', ('created_at', RangeDateTimeFilter))
    list_filter_submit = True
    search_fields = ('name', 'user__email', 'phone_protected')
    list_editable = ('subscription_plan',)
    date_hierarchy = 'created_at'
