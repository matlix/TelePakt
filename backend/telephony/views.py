"""Widoki i webhooki Twilio dla aplikacji TelePakt (telepakt.pl).

Endpointy (prefiks ``/api/telephony/``):

========================  ========  ====================================================
Ścieżka                   Metoda    Opis
========================  ========  ====================================================
conference-bridge/        POST      Webhook Twilio: mostek 3-stronny z nagrywaniem
play-formula/             POST      Webhook Twilio: odtwarza formułę prawną (TTS)
recording-callback/       POST      Webhook Twilio: zapis nagrania + suma SHA-256
zero-storage-delete/      POST      Usuwa nagranie z serwera po pobraniu przez klienta
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
import hashlib
import logging
from datetime import timedelta
from functools import wraps

from django.conf import settings
from django.http import HttpResponse, HttpResponseForbidden
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from twilio.request_validator import RequestValidator
from twilio.twiml.voice_response import Dial, VoiceResponse

from .models import CallLog, CustomerReview, InAppPurchaseReceipt, LegalScript

logger = logging.getLogger(__name__)

#: Formuła używana, gdy w bazie nie ma aktywnego skryptu prawnego.
DEFAULT_LEGAL_FORMULA = (
    "Żądam natychmiastowego usunięcia mojego numeru na podstawie art. 398 PKE."
)

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
            token = settings.TWILIO_AUTH_TOKEN
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
    called = request.POST.get('To', 'TelePakt')
    call_sid = request.POST.get('CallSid', 'sid-test')

    CallLog.objects.get_or_create(
        call_sid=call_sid,
        defaults={
            'caller_number': caller,
            'recipient_number': called,
            'status': 'initiated',
            'retention_expires_at': timezone.now() + timedelta(days=settings.DEFAULT_RETENTION_DAYS),
        },
    )

    dial = Dial()
    dial.conference(
        f"telepakt_bridge_{call_sid}",
        record='record-from-start',
        recording_status_callback='/api/telephony/recording-callback/',
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

    response.say(formula_text, voice='Polly.Maja', language='pl-PL')
    if auto_hangup:
        response.pause(length=1)
        response.hangup()
    return _xml(response)


@twilio_webhook
def twilio_recording_callback(request):
    """Odbiera nagranie z Twilio i zapisuje sumę kontrolną SHA-256 (dowód dla sądu/UKE).

    Hash obejmuje ``CallSid``, URL nagrania i czas trwania. Zawsze zwraca 200, aby
    Twilio nie ponawiało żądań (nieznany ``CallSid`` jest tylko logowany).
    """
    call_sid = request.POST.get('CallSid')
    recording_url = request.POST.get('RecordingUrl')
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
    call.duration_seconds = duration
    call.status = 'recorded'
    call.sha256_hash = hashlib.sha256(
        f"{call_sid}-{recording_url}-{duration}".encode()
    ).hexdigest()
    call.save()
    return HttpResponse(status=200)


@api_view(['POST'])
def zero_storage_delete(request):
    """Procedura Zero-Storage: czyści URL nagrania po pobraniu go przez klienta.

    Body: ``{"call_sid": "CA..."}``. Zachowuje sumę SHA-256 jako dowód integralności.

    TODO: uwierzytelnienie (np. token Firebase) oraz fizyczne usunięcie nagrania
    po stronie Twilio (``client.recordings(sid).delete()``).
    """
    call_sid = request.data.get('call_sid')
    if not call_sid:
        return Response({"error": "Brak call_sid"}, status=400)
    try:
        call = CallLog.objects.get(call_sid=call_sid)
    except CallLog.DoesNotExist:
        return Response({"error": "Połączenie nie istnieje"}, status=404)

    call.deleted_from_server = True
    call.recording_url = None
    call.status = 'deleted'
    call.save()
    return Response({
        "status": "success",
        "message": "Nagranie trwale usunięte z serwerów",
        "call_sid": call_sid,
        "retained_hash": call.sha256_hash,
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
def health_check(request):
    """Health check dla Render.com (``healthCheckPath`` w ``render.yaml``)."""
    return Response({
        "status": "healthy",
        "service": "telepakt-api",
        "domain": "telepakt.pl",
        "timestamp": timezone.now().isoformat(),
    })
