"""Komunikaty głosowe: ustawienia głosu, lista i edycja komunikatów, własne nagranie, odtworzenie w rozmowie.

Endpointy dla zalogowanego użytkownika leżą pod ``/api/telephony/`` (voice-settings, messages/...).
Dwa adresy publiczne (``announce/<token>/``) pobiera dostawca telefonii; chroni je niezgadywalny token.
"""
import logging
import secrets
from datetime import timedelta

from django.http import HttpResponse
from django.urls import reverse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from twilio.twiml.voice_response import VoiceResponse

from accounts.services import ensure_profile

from . import providers, voice
from .models import CallLog, VoiceMessage

logger = logging.getLogger(__name__)

#: Etykieta rozmowy własnej (3-way) w rejestrze - patrz views.OWN_CALL_LABEL.
OWN_CALL_LABEL = 'Rozmowa własna (3-way)'
#: Rozmowa starsza niż to nie jest już traktowana jako trwająca.
ACTIVE_CALL_MAX_AGE = timedelta(hours=3)


def _error(message, status=400):
    return Response({'error': message}, status=status)


def _serialize(m: VoiceMessage) -> dict:
    return {
        'id': m.pk,
        'title': m.title,
        'situation': m.situation,
        'situation_label': dict(voice.SITUATIONS).get(m.situation, m.situation),
        'text': m.text,
        'source': 'recorded' if m.has_audio else 'tts',
        'has_audio': m.has_audio,
        'audio_seconds': m.audio_seconds,
        'is_active': m.is_active,
        'position': m.position,
    }


def _seed_defaults(user) -> None:
    """Przy pierwszym wejściu tworzy komunikaty domyślne (można je edytować i usuwać)."""
    if VoiceMessage.objects.filter(owner=user).exists():
        return
    VoiceMessage.objects.bulk_create([
        VoiceMessage(owner=user, title=title, situation=situation, text=text, position=i,
                     public_token=secrets.token_hex(20))
        for i, (title, situation, text) in enumerate(voice.DEFAULT_MESSAGES)
    ])


def _own_message(user, pk):
    return VoiceMessage.objects.filter(owner=user, pk=pk).first()


# --------------------------------------------------------------------------- ustawienia głosu

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def voice_settings(request):
    profile = ensure_profile(request.user)
    if request.method == 'PATCH':
        if 'voice' in request.data:
            choice = str(request.data['voice'])
            if choice not in dict(voice.VOICES):
                return _error('Nieznany głos.')
            profile.tts_voice = choice
        if 'rate' in request.data:
            try:
                rate = int(request.data['rate'])
            except (TypeError, ValueError):
                return _error('Tempo musi być liczbą.')
            if not voice.RATE_MIN <= rate <= voice.RATE_MAX:
                return _error(f'Tempo musi mieścić się w zakresie {voice.RATE_MIN}-{voice.RATE_MAX}%.')
            profile.tts_rate = rate
        profile.save(update_fields=['tts_voice', 'tts_rate'])
    return Response({
        'voice': profile.tts_voice,
        'rate': profile.tts_rate,
        'voices': [{'id': vid, 'label': label} for vid, label in voice.VOICES],
        'rate_min': voice.RATE_MIN,
        'rate_max': voice.RATE_MAX,
        'situations': [{'id': sid, 'label': label} for sid, label in voice.SITUATIONS],
    })


# --------------------------------------------------------------------------- komunikaty

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def messages_collection(request):
    user = request.user
    if request.method == 'GET':
        _seed_defaults(user)
        return Response({'messages': [_serialize(m) for m in VoiceMessage.objects.filter(owner=user)]})

    title = str(request.data.get('title', '')).strip()
    text = str(request.data.get('text', '')).strip()
    situation = str(request.data.get('situation') or 'custom')
    if not title or len(title) > voice.MAX_TITLE:
        return _error(f'Podaj tytuł (maksymalnie {voice.MAX_TITLE} znaków).')
    if not text or len(text) > voice.MAX_TEXT:
        return _error(f'Podaj treść komunikatu (maksymalnie {voice.MAX_TEXT} znaków).')
    if situation not in voice.SITUATION_KEYS:
        return _error('Nieznana sytuacja.')
    if VoiceMessage.objects.filter(owner=user).count() >= voice.MAX_MESSAGES:
        return _error(f'Możesz mieć maksymalnie {voice.MAX_MESSAGES} komunikatów.')
    position = VoiceMessage.objects.filter(owner=user).count()
    message = VoiceMessage.objects.create(owner=user, title=title, text=text, situation=situation,
                                          position=position, public_token=secrets.token_hex(20))
    return Response(_serialize(message), status=201)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def message_detail(request, pk):
    message = _own_message(request.user, pk)
    if message is None:
        return _error('Nie znaleziono komunikatu.', 404)
    if request.method == 'DELETE':
        message.delete()
        return Response(status=204)

    data = request.data
    if 'title' in data:
        title = str(data['title']).strip()
        if not title or len(title) > voice.MAX_TITLE:
            return _error(f'Podaj tytuł (maksymalnie {voice.MAX_TITLE} znaków).')
        message.title = title
    if 'text' in data:
        text = str(data['text']).strip()
        if not text or len(text) > voice.MAX_TEXT:
            return _error(f'Podaj treść komunikatu (maksymalnie {voice.MAX_TEXT} znaków).')
        message.text = text
    if 'situation' in data:
        if str(data['situation']) not in voice.SITUATION_KEYS:
            return _error('Nieznana sytuacja.')
        message.situation = str(data['situation'])
    if 'is_active' in data:
        message.is_active = bool(data['is_active'])
    if 'position' in data:
        try:
            message.position = max(0, int(data['position']))
        except (TypeError, ValueError):
            return _error('Nieprawidłowa pozycja.')
    message.save()
    return Response(_serialize(message))


# --------------------------------------------------------------------------- własne nagranie

@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def message_audio(request, pk):
    """GET - odsłuch własnego nagrania; POST - zapis (surowy WAV w body); DELETE - powrót do głosu syntezatora."""
    message = _own_message(request.user, pk)
    if message is None:
        return _error('Nie znaleziono komunikatu.', 404)

    if request.method == 'GET':
        if not message.has_audio:
            return _error('Ten komunikat nie ma własnego nagrania.', 404)
        return HttpResponse(bytes(message.audio), content_type='audio/wav')

    if request.method == 'DELETE':
        message.audio, message.audio_seconds = None, 0
        message.save(update_fields=['audio', 'audio_seconds'])
        return Response(_serialize(message))

    data = request.body
    try:
        info = voice.parse_wav(data)
    except ValueError as exc:
        return _error(str(exc))
    message.audio, message.audio_seconds = data, info['seconds']
    message.save(update_fields=['audio', 'audio_seconds'])
    return Response(_serialize(message))


# --------------------------------------------------------------------------- odtworzenie w rozmowie

def _active_own_call(user):
    phone = ensure_profile(user).phone_protected
    if not phone:
        return None
    return CallLog.objects.filter(
        recipient_number=phone, caller_number=OWN_CALL_LABEL, status='initiated', deleted_from_server=False,
        timestamp__gte=timezone.now() - ACTIVE_CALL_MAX_AGE,
    ).order_by('-timestamp').first()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def message_speak(request, pk):
    """Odtwarza komunikat w trwającej rozmowie nagrywanej przez TelePakt (po scaleniu 3-way)."""
    message = _own_message(request.user, pk)
    if message is None:
        return _error('Nie znaleziono komunikatu.', 404)
    call = _active_own_call(request.user)
    if call is None:
        return _error('Brak trwającej rozmowy nagrywanej przez TelePakt. Najpierw stuknij „Nagrywaj całą rozmowę” '
                      'i scal rozmowy - wtedy komunikat usłyszy rozmówca.', 409)
    adapter = providers.adapter_for(call.provider)
    if adapter is None or not adapter.has_credentials():
        return _error('Telefonia nie jest skonfigurowana.', 503)
    url = request.build_absolute_uri(reverse('announce_twiml', args=[message.public_token]))
    try:
        adapter.announce(call.call_sid, f'telepakt_bridge_{call.call_sid}', url)
    except Exception as exc:  # noqa: BLE001 - błąd dostawcy -> czytelny komunikat + log z identyfikatorami
        logger.exception("Nie udało się odtworzyć komunikatu %s w rozmowie %s (%s): %s",
                         message.pk, call.call_sid, call.provider, exc)
        return _error(f'Nie udało się odtworzyć komunikatu: {exc}', 502)
    return Response({'status': 'playing', 'title': message.title})


message_speak.cls.throttle_scope = 'speak'


# --------------------------------------------------------------------------- adresy dla dostawcy (publiczne)

@csrf_exempt
def announce_twiml(request, token):
    """TwiML pobierany przez dostawcę, gdy ma odtworzyć komunikat (AnnounceUrl)."""
    message = VoiceMessage.objects.filter(public_token=token).first()
    if message is None:
        return HttpResponse(status=404)
    response = VoiceResponse()
    if message.has_audio:
        response.play(request.build_absolute_uri(reverse('announce_audio', args=[token])))
    else:
        profile = ensure_profile(message.owner)
        say = response.say(voice=profile.tts_voice, language='pl-PL')
        say.prosody(message.text, rate=f'{profile.tts_rate}%')
    return HttpResponse(str(response), content_type='application/xml')


@csrf_exempt
def announce_audio(request, token):
    message = VoiceMessage.objects.filter(public_token=token).first()
    if message is None or not message.has_audio:
        return HttpResponse(status=404)
    response = HttpResponse(bytes(message.audio), content_type='audio/wav')
    response['Cache-Control'] = 'no-store'
    return response
