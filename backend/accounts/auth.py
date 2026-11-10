"""Uwierzytelnianie DRF tokenem Bearer (``Authorization: Bearer <token>``)."""
from datetime import timedelta

from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from .models import AuthToken
from .services import hash_key, is_expired


class BearerTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = request.headers.get('Authorization', '')
        if not header.startswith('Bearer '):
            return None
        try:
            token = AuthToken.objects.select_related('user__profile').get(key_hash=hash_key(header[7:].strip()))
        except AuthToken.DoesNotExist:
            raise AuthenticationFailed('Sesja wygasła. Zaloguj się ponownie.')
        if not token.user.is_active or is_expired(token):
            raise AuthenticationFailed('Sesja wygasła. Zaloguj się ponownie.')
        if token.last_used_at < timezone.now() - timedelta(hours=1):  # nie zapisujemy przy każdym żądaniu
            token.last_used_at = timezone.now()
            token.save(update_fields=['last_used_at'])
        return token.user, token

    def authenticate_header(self, request):
        return 'Bearer'
