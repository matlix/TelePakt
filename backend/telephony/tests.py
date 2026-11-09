"""Testy API telephony: webhooki Twilio, opinie, paragony IAP, health check."""
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import CallLog, CustomerReview, InAppPurchaseReceipt


@override_settings(DEBUG=True)
class TwilioWebhookTests(TestCase):
    """W trybie DEBUG podpis Twilio jest pomijany."""

    def test_conference_bridge_creates_call_log(self):
        resp = self.client.post('/api/telephony/conference-bridge/',
                                {'From': '+48500100200', 'To': '+48221234567', 'CallSid': 'CA1'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'<Conference', resp.content)
        self.assertTrue(CallLog.objects.filter(call_sid='CA1', status='initiated').exists())

    def test_recording_callback_sets_hash(self):
        CallLog.objects.create(call_sid='CA2', caller_number='x', recipient_number='y')
        self.client.post('/api/telephony/recording-callback/',
                         {'CallSid': 'CA2', 'RecordingUrl': 'https://x/rec', 'RecordingDuration': '12'})
        call = CallLog.objects.get(call_sid='CA2')
        self.assertEqual(call.status, 'recorded')
        self.assertEqual(len(call.sha256_hash), 64)

    def test_recording_callback_bad_duration_does_not_crash(self):
        CallLog.objects.create(call_sid='CA3', caller_number='x', recipient_number='y')
        resp = self.client.post('/api/telephony/recording-callback/',
                                {'CallSid': 'CA3', 'RecordingUrl': 'u', 'RecordingDuration': 'abc'})
        self.assertEqual(resp.status_code, 200)

    def test_play_formula_falls_back_to_default(self):
        resp = self.client.post('/api/telephony/play-formula/?script_id=999')
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'<Say', resp.content)
        self.assertIn(b'Polly.Ola-Neural', resp.content)
        self.assertIn(b'<prosody rate="110%"', resp.content)


@override_settings(DEBUG=False, TWILIO_AUTH_TOKEN='secret', ALLOWED_HOSTS=['testserver'],
                   SECURE_SSL_REDIRECT=False)
class TwilioSignatureTests(TestCase):
    def test_unsigned_request_is_rejected(self):
        resp = self.client.post('/api/telephony/conference-bridge/', {'CallSid': 'CAX'})
        self.assertEqual(resp.status_code, 403)
        self.assertFalse(CallLog.objects.exists())

    @override_settings(TWILIO_AUTH_TOKEN='')
    def test_missing_token_rejects_everything(self):
        resp = self.client.post('/api/telephony/recording-callback/', {'CallSid': 'CAX'})
        self.assertEqual(resp.status_code, 403)


@override_settings(DEBUG=True)
class ReviewsTests(TestCase):
    def setUp(self):
        self.api = APIClient()

    def test_post_goes_to_moderation_and_is_hidden(self):
        resp = self.api.post('/api/telephony/reviews/', {'content': 'Super', 'rating': 5}, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertFalse(CustomerReview.objects.get().is_approved)
        self.assertEqual(self.api.get('/api/telephony/reviews/').json(), [])

    def test_invalid_rating_returns_400(self):
        for bad in ('abc', 0, 6):
            resp = self.api.post('/api/telephony/reviews/', {'content': 'x', 'rating': bad}, format='json')
            self.assertEqual(resp.status_code, 400, bad)

    def test_empty_content_returns_400(self):
        resp = self.api.post('/api/telephony/reviews/', {'content': '  '}, format='json')
        self.assertEqual(resp.status_code, 400)


@override_settings(DEBUG=True)
class PurchaseAndHealthTests(TestCase):
    def setUp(self):
        self.api = APIClient()

    def test_purchase_is_not_auto_verified(self):
        payload = {'user_email': 'a@b.pl', 'purchase_token': 'tok', 'platform': 'google_play'}
        resp = self.api.post('/api/telephony/verify-purchase/', payload, format='json')
        self.assertEqual(resp.status_code, 202)
        self.assertEqual(resp.json()['status'], 'pending_verification')
        self.assertFalse(InAppPurchaseReceipt.objects.get().is_verified)

    def test_purchase_is_idempotent_per_token(self):
        payload = {'user_email': 'a@b.pl', 'purchase_token': 'tok'}
        self.api.post('/api/telephony/verify-purchase/', payload, format='json')
        self.api.post('/api/telephony/verify-purchase/', payload, format='json')
        self.assertEqual(InAppPurchaseReceipt.objects.count(), 1)

    def test_unknown_platform_rejected(self):
        resp = self.api.post('/api/telephony/verify-purchase/',
                             {'user_email': 'a@b.pl', 'purchase_token': 't', 'platform': 'nope'}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_zero_storage_delete(self):
        CallLog.objects.create(call_sid='CA9', caller_number='x', recipient_number='y',
                               recording_url='https://x/r')
        resp = self.api.post('/api/telephony/zero-storage-delete/', {'call_sid': 'CA9'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(CallLog.objects.get(call_sid='CA9').recording_url)
        self.assertEqual(self.api.post('/api/telephony/zero-storage-delete/', {}, format='json').status_code, 400)

    def test_health(self):
        self.assertEqual(self.api.get('/api/telephony/health/').json()['status'], 'healthy')
