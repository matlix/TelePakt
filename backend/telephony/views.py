"""Widoki i webhooki Twilio dla aplikacji TelePakt (telepakt.pl).

Endpointy (prefiks ``/api/telephony/``):

========================  ========  ====================================================
Ścieżka                   Metoda    Opis
========================  ========  ====================================================
conference-bridge/        POST      Webhook Twilio: mostek 3-stronny z nagrywaniem
play-formula/             POST      Webhook Twilio: odtwarza formułę prawną (TTS)
recording-callback/       POST      Webhook Twilio: zapis odnośnika i identyfikatora nagrania
zero-storage-delete/      POST      Kasuje nagranie u operatora (Twilio) i w bazie po pobraniu przez klienta
reviews/                  GET/POST  Opinie klientów (POST trafia do moderacji)
verify-purchase/          POST      Rejestruje paragon IAP (weryfikacja sklepu = TODO)
health/                   GET       Health check dla Render.com
========================  ========  ====================================================

Bezpieczeństwo:
    * Webhooki Twilio są ``csrf_exempt``, dlatego każde żądanie jest weryfikowane
      podpisem ``X-Twilio-Signature`` (patrz :func:`twilio_webhook`).
    * Endpointy publiczne (``reviews``) są ograniczone throttlingiem DRF
      (``REST_FRAMEWORK`` w ``settings.py``).
"""
import logging
from datetime import timedelta
from functools import wraps

from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import Dial, VoiceResponse

from .models import CallLog, CustomerReview, InAppPurchaseReceipt, LegalScript
from . import providers
from .retention import erase_recording, maybe_purge_expired

logger = logging.getLogger(__name__)

#: Formuła używana, gdy w bazie nie ma aktywnego skryptu prawnego.
DEFAULT_LEGAL_FORMULA = (
    "Żądam natychmiastowego usunięcia mojego numeru na podstawie art. 398 PKE."
)

#: Głos i tempo TwiML <Say> (Amazon Polly, neuronowy polski głos).
TTS_VOICE = 'Polly.Ola-Neural'
TTS_RATE = '110%'

#: Dozwolone typy urządzeń w opiniach (zgodne z ``CustomerReview.DEVICE_CHOICES``).
REVIEW_DEVICES = {choice[0] for choice in CustomerReview.DEVICE_CHOICES}


def twilio_webhook(view):
    """Dekorator: zwalnia z CSRF i weryfikuje podpis ``X-Twilio-Signature``.

    Przy ``DJANGO_DEBUG=True`` weryfikacja jest pomijana (lokalne testy curl-em).
    W produkcji brak ``TWILIO_AUTH_TOKEN`` lub zły podpis kończy się odpowiedzią 403,
    więc nikt poza Twilio nie może zakładać wpisów ani zapisywać fałszywych nagrań.
    """

    @csrf_exempt
    @wraps(view)
    def wrapper(request, *args, **kwargs):
        if not settings.DEBUG:
            if request.GET.get('provider') == 'telnyx':
                # Telnyx: tajny token w adresie webhooka (ustawiany w panelu admina)
                if not providers.webhook_token_valid('telnyx', request.GET.get('token', '')):
                    logger.warning("Odrzucono webhook Telnyx z błędnym tokenem: %s", request.path)
                    return HttpResponseForbidden("Invalid webhook token")
                return view(request, *args, **kwargs)
            token = providers.twilio_credentials()[1]
            signature = request.headers.get('X-Twilio-Signature', '')
            url = request.build_absolute_uri()
            if not token or not RequestValidator(token).validate(url, request.POST.dict(), signature):
                logger.warning("Odrzucono webhook Twilio bez poprawnego podpisu: %s", request.path)
                return HttpResponseForbidden("Invalid Twilio signature")
        return view(request, *args, **kwargs)

    return wrapper


def _xml(response: VoiceResponse) -> HttpResponse:
    """Zwraca TwiML jako ``application/xml``."""
    return HttpResponse(str(response), content_type='application/xml')


@twilio_webhook
def twilio_conference_bridge(request):
    """Tworzy mostek telekonferencji 3-stronnej (3-way call) z nagrywaniem.

    Zakłada wpis :class:`CallLog` (idempotentnie po ``CallSid``) z terminem
    autokasowania wg ``RETENTION_DAYS``.
    """
    response = VoiceResponse()
    caller = request.POST.get('From', 'Nieznany')
    # Przy przekierowaniu operatora numer użytkownika przychodzi w ForwardedFrom (jeśli operator go przekaże);
    # po nim przycisk "Nagrywaj" w aplikacji znajduje trwające połączenie.
    called = request.POST.get('ForwardedFrom') or request.POST.get('To', 'TelePakt')
    call_sid = request.POST.get('CallSid', 'sid-test')

    CallLog.objects.get_or_create(
        call_sid=call_sid,
        defaults={
            'caller_number': caller,
            'recipient_number': called,
            'status': 'initiated',
            'recording_started': True,  # konferencja ma record-from-start
            'provider': 'telnyx' if request.GET.get('provider') == 'telnyx' else 'twilio',
            'retention_expires_at': timezone.now() + timedelta(days=settings.DEFAULT_RETENTION_DAYS),
        },
    )

    dial = Dial()
    dial.conference(
        f"telepakt_bridge_{call_sid}",
        record='record-from-start',
        recording_status_callback='/api/telephony/recording-callback/' + (
            '?' + request.GET.urlencode() if request.GET.get('provider') == 'telnyx' else ''),
        recording_status_callback_event='completed',
        recording_status_callback_method='POST',
        start_conference_on_enter=True,
        end_conference_on_exit=False,
    )
    response.append(dial)
    return _xml(response)


@twilio_webhook
def twilio_play_legal_formula(request):
    """Odgrywa formułę sprzeciwu prawnego na linii spamera.

    Query: ``script_id`` (opcjonalnie) - ID :class:`LegalScript`; domyślnie pierwszy
    aktywny skrypt. Gdy nie ma żadnego skryptu, używana jest formuła domyślna.
    """
    response = VoiceResponse()
    script_id = request.GET.get('script_id')

    queryset = LegalScript.objects.filter(is_active=True)
    if script_id and script_id.isdigit():
        queryset = queryset.filter(id=int(script_id))
    script = queryset.first()

    formula_text = script.text_content if script else DEFAULT_LEGAL_FORMULA
    auto_hangup = script.auto_hangup if script else True

    # Neuronowy głos Polly (Ola) + tempo 110% - szybciej i bardziej naturalnie niż Polly.Maja.
    say = response.say(voice=TTS_VOICE, language='pl-PL')
    say.prosody(formula_text, rate=TTS_RATE)
    if auto_hangup:
        response.pause(length=1)
        response.hangup()
    return _xml(response)


@twilio_webhook
def twilio_recording_callback(request):
    """Odbiera nagranie z Twilio i zapisuje odnośnik oraz identyfikator nagrania.

    ``RecordingSid`` jest potrzebny, by później skasować nagranie u operatora
    (:func:`telephony.retention.erase_recording`). Zawsze zwraca 200, aby Twilio nie
    ponawiało żądań (nieznany ``CallSid`` jest tylko logowany).
    """
    call_sid = request.POST.get('CallSid')
    recording_url = request.POST.get('RecordingUrl')
    recording_sid = request.POST.get('RecordingSid', '')[:64]
    try:
        duration = max(int(request.POST.get('RecordingDuration', 0)), 0)
    except (TypeError, ValueError):
        duration = 0

    try:
        call = CallLog.objects.get(call_sid=call_sid)
    except CallLog.DoesNotExist:
        logger.info("recording-callback dla nieznanego CallSid=%s", call_sid)
        return HttpResponse(status=200)

    call.recording_url = recording_url
    call.recording_sid = recording_sid
    call.duration_seconds = duration
    call.status = 'recorded'
    call.save()
    return HttpResponse(status=200)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([ScopedRateThrottle])
def start_recording(request):
    """Wlacza nagrywanie trwajacego (lub dopiero dzwoniacego) polaczenia - bez zapowiedzi.

    Wymaga zalogowania (``Authorization: Bearer``). Numer chroniony pochodzi z profilu
    uzytkownika, wiec nikt nie moze nagrywac cudzych polaczen. Opcjonalnie body
    ``{"call_sid": "CA..."}``; bez niego wybieramy najnowsze polaczenie tego numeru
    z ostatnich 10 minut, ktore jeszcze nie jest nagrywane. Rozmowca nie slyszy zadnego komunikatu.
    """
    phone = request.user.profile.phone_protected
    if not phone:
        return Response({"error": "Ustaw chroniony numer telefonu w profilu"}, status=400)
    call_sid = str(request.data.get('call_sid') or '')

    calls = CallLog.objects.filter(
        recipient_number=phone,
        timestamp__gte=timezone.now() - timedelta(minutes=10),
        recording_started=False,
        deleted_from_server=False,
    )
    call = calls.filter(call_sid=call_sid).first() if call_sid else calls.order_by('-timestamp').first()
    if call is None:
        return Response({"error": "Brak trwajacego polaczenia do nagrania"}, status=404)

    adapter = providers.adapter_for(call.provider)
    if adapter is None or not adapter.has_credentials():
        return Response({"error": "Telefonia nie jest skonfigurowana"}, status=503)
    callback = request.build_absolute_uri(
        '/api/telephony/recording-callback/' + providers.callback_query(call.provider)
    )
    try:
        adapter.start_recording(call.call_sid, callback)
    except Exception as exc:  # noqa: BLE001 - błąd API dostawcy -> 502
        logger.error("Nie udało się włączyć nagrywania %s: %s", call.call_sid, exc)
        return Response({"error": "Nie udało się włączyć nagrywania"}, status=502)

    call.recording_started = True
    call.save(update_fields=['recording_started'])
    return Response({"status": "recording", "call_sid": call.call_sid})


start_recording.cls.throttle_scope = 'recording'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def zero_storage_delete(request):
    """Procedura Zero-Storage: kasuje nagranie po pobraniu go przez klienta.

    Body: ``{"call_sid": "CA..."}``. Nagranie jest usuwane u operatora (Twilio) i w
    naszej bazie. Gdy Twilio jest niedostępne, zwracamy 502 i NIE oznaczamy nagrania
    jako usuniętego - klient może spróbować ponownie, a czyszczenie retencyjne
    dokończy sprawę.

    Wymaga zalogowania; można usunąć tylko nagrania połączeń na własny chroniony numer.
    """
    call_sid = request.data.get('call_sid')
    if not call_sid:
        return Response({"error": "Brak call_sid"}, status=400)
    try:
        call = CallLog.objects.get(call_sid=call_sid, recipient_number=request.user.profile.phone_protected)
    except CallLog.DoesNotExist:
        return Response({"error": "Połączenie nie istnieje"}, status=404)

    if not erase_recording(call):
        return Response(
            {"error": "Nie udało się usunąć nagrania u operatora telefonii. Spróbuj ponownie później."},
            status=502,
        )
    return Response({
        "status": "success",
        "message": "Nagranie usunięte z naszych serwerów i z serwera operatora telefonii",
        "call_sid": call_sid,
    })


@api_view(['GET', 'POST'])
@throttle_classes([ScopedRateThrottle])
def reviews_api(request):
    """Zwraca zatwierdzone opinie (GET) lub przyjmuje nową do moderacji (POST).

    POST body: ``author_name``, ``content`` (wymagane), ``rating`` (1-5),
    ``title``, ``device_type``. Nowe opinie mają ``is_approved=False``.
    """
    if request.method == 'GET':
        reviews = CustomerReview.objects.filter(is_approved=True).order_by('-created_at')
        return Response([{
            "id": r.id,
            "author_name": r.author_name,
            "rating": r.rating,
            "title": r.title,
            "content": r.content,
            "created_at": r.created_at.strftime('%Y-%m-%d'),
            "device_type": r.device_type,
            "is_featured": r.is_featured,
            "admin_reply": r.admin_reply,
        } for r in reviews])

    content = str(request.data.get('content', '')).strip()
    if not content or len(content) > 5000:
        return Response({"error": "Treść opinii jest wymagana (maks. 5000 znaków)"}, status=400)
    try:
        rating = int(request.data.get('rating', 5))
    except (TypeError, ValueError):
        return Response({"error": "Ocena musi być liczbą 1-5"}, status=400)
    if not 1 <= rating <= 5:
        return Response({"error": "Ocena musi być liczbą 1-5"}, status=400)

    device = request.data.get('device_type', 'Android')
    if device not in REVIEW_DEVICES:
        device = 'Android'

    review = CustomerReview.objects.create(
        author_name=str(request.data.get('author_name') or 'Anonim')[:100],
        content=content,
        rating=rating,
        title=str(request.data.get('title') or 'Opinia TelePakt')[:150],
        device_type=device,
        is_approved=False,
    )
    return Response({"status": "submitted_for_moderation", "review_id": review.id}, status=201)


# Zakres throttlingu dla reviews_api (stawka w settings.REST_FRAMEWORK).
reviews_api.cls.throttle_scope = 'reviews'


@api_view(['POST'])
def verify_iap_purchase(request):
    """Rejestruje paragon subskrypcji z jednego z 4 sklepów (Play, App Store, Galaxy, AppGallery).

    UWAGA: weryfikacja tokenu w API sklepu NIE jest jeszcze zaimplementowana, więc
    paragon zapisywany jest z ``is_verified=False`` i odpowiedzią
    ``pending_verification``. Subskrypcja nie może być aktywowana na podstawie samego
    tokenu przesłanego przez klienta (każdy mógłby wysłać dowolny ciąg znaków).
    """
    user_email = request.data.get('user_email')
    platform = request.data.get('platform', 'google_play')
    product_id = request.data.get('product_id') or 'telepakt_monthly_19_99'
    purchase_token = request.data.get('purchase_token')

    platform_names = dict(InAppPurchaseReceipt.PLATFORM_CHOICES)
    if platform not in platform_names:
        return Response({
            "error": f"Nieobsługiwany marketplace: {platform}. Dozwolone: {', '.join(platform_names)}"
        }, status=400)
    if not purchase_token or not user_email:
        return Response({"error": "Brak tokenu zakupu lub adresu e-mail abonenta"}, status=400)

    # Okres subskrypcji (roczny vs miesięczny)
    duration_days = 365 if 'yearly' in product_id or 'roczny' in product_id else 30

    receipt, _created = InAppPurchaseReceipt.objects.get_or_create(
        platform=platform,
        purchase_token=str(purchase_token),
        defaults={
            'user_email': user_email,
            'product_id': product_id,
            'is_verified': False,
            'expires_at': timezone.now() + timedelta(days=duration_days),
        },
    )

    return Response({
        "status": "subscription_activated" if receipt.is_verified else "pending_verification",
        "user_email": receipt.user_email,
        "platform": platform,
        "platform_name": platform_names[platform],
        "product_id": receipt.product_id,
        "valid_until": receipt.expires_at.isoformat(),
        "days_active": duration_days,
    }, status=200 if receipt.is_verified else 202)


@api_view(['GET'])
def forwarding_info(request):
    """Numer aktywnego dostawcy i kody GSM do przekierowania warunkowego (ekran w aplikacji).

    Zwraca 503, gdy żaden dostawca nie ma skonfigurowanych danych i numeru.
    """
    for adapter in providers.ordered_providers():
        if adapter.row.phone_number:
            return Response({
                "provider": adapter.kind,
                "number": adapter.row.phone_number,
                "codes": providers.forwarding_codes(adapter.row.phone_number),
            })
    return Response({"error": "Numer TelePakt nie jest jeszcze skonfigurowany"}, status=503)


@api_view(['GET'])
def health_check(request):
    """Health check dla Render.com (``healthCheckPath`` w ``render.yaml``).

    Przy okazji (najwyżej raz na godzinę) czyści nagrania po terminie retencji - patrz
    :func:`telephony.retention.maybe_purge_expired`.
    """
    maybe_purge_expired()
    providers.maybe_run_health_checks()
    return Response({
        "status": "healthy",
        "service": "telepakt-api",
        "domain": "telepakt.pl",
        "timestamp": timezone.now().isoformat(),
    })
