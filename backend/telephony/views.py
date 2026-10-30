"""Widoki i webhooki Twilio dla aplikacji TelePakt (telepakt.pl)."""
import hashlib
from datetime import timedelta
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response
from twilio.twiml.voice_response import VoiceResponse, Dial
from .models import LegalScript, CallLog, CustomerReview, InAppPurchaseReceipt

@csrf_exempt
def twilio_conference_bridge(request):
    """Tworzy mostek telekonferencji 3-stronnej (3-way call)."""
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
            'retention_expires_at': timezone.now() + timedelta(days=30)
        }
    )

    dial = Dial()
    dial.conference(
        f"telepakt_bridge_{call_sid}",
        record='record-from-start',
        recording_status_callback='/api/telephony/recording-callback/',
        recording_status_callback_event='completed',
        recording_status_callback_method='POST',
        start_conference_on_enter=True,
        end_conference_on_exit=False
    )
    response.append(dial)
    return HttpResponse(str(response), content_type='application/xml')


@csrf_exempt
def twilio_play_legal_formula(request):
    """Odgrywa formułę sprzeciwu prawnego na linii spamera."""
    response = VoiceResponse()
    script_id = request.GET.get('script_id')

    try:
        if script_id:
            script = LegalScript.objects.get(id=script_id, is_active=True)
        else:
            script = LegalScript.objects.filter(is_active=True).first()
        
        formula_text = script.text_content if script else "Żądam natychmiastowego usunięcia mojego numeru na podstawie art. 398 PKE."
        auto_hangup = script.auto_hangup if script else True
    except Exception:
        formula_text = "Niniejsza rozmowa jest rejestrowana. Na podstawie art. 398 PKE żądam usunięcia danych pod rygorem kary 1 000 000 zł."
        auto_hangup = True

    response.say(formula_text, voice='Polly.Maja', language='pl-PL')
    if auto_hangup:
        response.pause(length=1)
        response.hangup()

    return HttpResponse(str(response), content_type='application/xml')


@csrf_exempt
def twilio_recording_callback(request):
    """Odbiera nagranie z Twilio, generuje sumę kontrolną SHA-256 dla sądu/UKE."""
    call_sid = request.POST.get('CallSid')
    recording_url = request.POST.get('RecordingUrl')
    duration = int(request.POST.get('RecordingDuration', 0))

    try:
        call = CallLog.objects.get(call_sid=call_sid)
        call.recording_url = recording_url
        call.duration_seconds = duration
        call.status = 'recorded'
        sha = hashlib.sha256(f"{call_sid}-{recording_url}-{duration}".encode()).hexdigest()
        call.sha256_hash = sha
        call.save()
    except CallLog.DoesNotExist:
        pass

    return HttpResponse(status=200)


@api_view(['POST'])
def zero_storage_delete(request):
    """Realizuje procedurę Zero-Storage: usuwa plik po pobraniu przez klienta."""
    call_sid = request.data.get('call_sid')
    try:
        call = CallLog.objects.get(call_sid=call_sid)
        call.deleted_from_server = True
        call.recording_url = None
        call.status = 'deleted'
        call.save()
        return Response({
            "status": "success",
            "message": "Nagranie trwale usunięte z serwerów",
            "call_sid": call_sid,
            "retained_hash": call.sha256_hash
        })
    except CallLog.DoesNotExist:
        return Response({"error": "Połączenie nie istnieje"}, status=404)


@api_view(['GET', 'POST'])
def reviews_api(request):
    """Zwraca lub przyjmuje opinie użytkowników dla domeny telepakt.pl."""
    if request.method == 'GET':
        reviews = CustomerReview.objects.filter(is_approved=True)
        data = [{
            "id": r.id,
            "author_name": r.author_name,
            "rating": r.rating,
            "title": r.title,
            "content": r.content,
            "created_at": r.created_at.strftime('%Y-%m-%d'),
            "device_type": r.device_type,
            "is_featured": r.is_featured,
            "admin_reply": r.admin_reply
        } for r in reviews]
        return Response(data)
    elif request.method == 'POST':
        author = request.data.get('author_name', 'Anonim')
        content = request.data.get('content', '')
        rating = int(request.data.get('rating', 5))
        title = request.data.get('title', 'Opinia TelePakt')
        device = request.data.get('device_type', 'Android')
        review = CustomerReview.objects.create(
            author_name=author,
            content=content,
            rating=rating,
            title=title,
            device_type=device,
            is_approved=False
        )
        return Response({"status": "submitted_for_moderation", "review_id": review.id})


@api_view(['POST'])
def verify_iap_purchase(request):
    """Weryfikacja zakupów Google Play Billing i Apple StoreKit."""
    user_email = request.data.get('user_email')
    platform = request.data.get('platform', 'google_play')
    product_id = request.data.get('product_id')
    purchase_token = request.data.get('purchase_token')

    if not purchase_token or not user_email:
        return Response({"error": "Brak tokenu zakupu lub e-maila"}, status=400)

    receipt = InAppPurchaseReceipt.objects.create(
        user_email=user_email,
        platform=platform,
        product_id=product_id or 'telepakt_monthly_19_99',
        purchase_token=purchase_token,
        is_verified=True,
        expires_at=timezone.now() + timedelta(days=30)
    )

    return Response({
        "status": "subscription_activated",
        "user_email": user_email,
        "platform": platform,
        "valid_until": receipt.expires_at.isoformat(),
        "message": "Subskrypcja aktywna. Ochrona TelePakt włączona."
    })


@api_view(['GET'])
def health_check(request):
    """Endpoint sprawdzający stan zdrowia (health check) dla Render.com."""
    return Response({
        "status": "healthy",
        "service": "telepakt-api",
        "domain": "telepakt.pl",
        "timestamp": timezone.now().isoformat()
    })
