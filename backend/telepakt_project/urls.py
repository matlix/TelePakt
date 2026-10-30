"""Główna konfiguracja adresów URL dla TelePakt (telepakt.pl)."""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def root_landing_view(request):
    """Informacyjny punkt końcowy API dla domeny telepakt.pl."""
    return JsonResponse({
        "project": "TelePakt.pl",
        "service": "Chmurowy backend ochrony przed spamem telefonicznym i RODO",
        "domain": "telepakt.pl",
        "api_domain": "api.telepakt.pl",
        "status": "online",
        "hosting": "Render.com",
        "legal_act": "Ustawa z dnia 12 lipca 2024 r. Prawo komunikacji elektronicznej (art. 398, 445)",
        "endpoints": {
            "admin": "/admin/",
            "telephony_webhooks": "/api/telephony/",
            "health_check": "/api/telephony/health/"
        }
    })

urlpatterns = [
    path('', root_landing_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/telephony/', include('telephony.urls')),
]
