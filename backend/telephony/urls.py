"""Trasy URL dla modułu telephony (telepakt.pl)."""
from django.urls import path
from . import views, voice_views

urlpatterns = [
    path('conference-bridge/', views.twilio_conference_bridge, name='twilio_bridge'),
    path('play-formula/', views.twilio_play_legal_formula, name='twilio_play'),
    path('recording-callback/', views.twilio_recording_callback, name='recording_callback'),
    path('recordings/', views.recordings_list, name='recordings_list'),
    path('recordings/<str:call_sid>/audio/', views.recording_audio, name='recording_audio'),
    path('voice-settings/', voice_views.voice_settings, name='voice_settings'),
    path('messages/', voice_views.messages_collection, name='messages_collection'),
    path('messages/<int:pk>/', voice_views.message_detail, name='message_detail'),
    path('messages/<int:pk>/audio/', voice_views.message_audio, name='message_audio'),
    path('messages/<int:pk>/speak/', voice_views.message_speak, name='message_speak'),
    path('announce/<str:token>/', voice_views.announce_twiml, name='announce_twiml'),
    path('announce/<str:token>/audio.wav', voice_views.announce_audio, name='announce_audio'),
    path('start-recording/', views.start_recording, name='start_recording'),
    path('forwarding-info/', views.forwarding_info, name='forwarding_info'),
    path('zero-storage-delete/', views.zero_storage_delete, name='zero_storage_delete'),
    path('reviews/', views.reviews_api, name='reviews_api'),
    path('verify-purchase/', views.verify_iap_purchase, name='verify_purchase'),
    path('health/', views.health_check, name='health_check'),
]
