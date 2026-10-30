"""Trasy URL dla modułu telephony (telepakt.pl)."""
from django.urls import path
from . import views

urlpatterns = [
    path('conference-bridge/', views.twilio_conference_bridge, name='twilio_bridge'),
    path('play-formula/', views.twilio_play_legal_formula, name='twilio_play'),
    path('recording-callback/', views.twilio_recording_callback, name='recording_callback'),
    path('zero-storage-delete/', views.zero_storage_delete, name='zero_storage_delete'),
    path('reviews/', views.reviews_api, name='reviews_api'),
    path('verify-purchase/', views.verify_iap_purchase, name='verify_purchase'),
    path('health/', views.health_check, name='health_check'),
]
