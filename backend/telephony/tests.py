"""Testy API telephony: webhooki Twilio, opinie, paragony IAP, health check."""
from datetime import timedelta
from unittest import mock

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from django.contrib.auth.models import User

from accounts.models import Profile
from accounts.services import issue_token
from .models import CallLog, CustomerReview, InAppPurchaseReceipt, UkeComplaint
from . import providers
from .models import TelephonyProvider
from .retention import purge_expired


def authed_client(email='u@telepakt.test', phone='+48500'):
    """Klient API zalogowany jako uzytkownik z chronionym numerem ``phone``."""
    user = User.objects.create_user(username=email, email=email, password='Passw0rd!x')
    Profile.objects.create(user=user, name='U', phone_protected=phone)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION='Bearer ' + issue_token(user))
    return client


class RetentionTests(TestCase):
    """Nagrania po terminie retencji są kasowane u Twilio i w bazie."""

    def _call(self, sid, **kw):
        return CallLog.objects.create(call_sid=sid, caller_number='x', recipient_number='y', **kw)

    def test_purge_deletes_expired_recording_and_row(self):
        past = timezone.now() - timedelta(days=1)
        self._call('CA1', recording_sid='RE1', recording_url='https://x/1', retention_expires_at=past)
        with mock.patch('telephony.retention._twilio_client') as client:
            self.assertEqual(purge_expired(), 1)
        client.return_value.recordings.assert_called_once_with('RE1')
        self.assertFalse(CallLog.objects.filter(call_sid='CA1').exists())

    def test_purge_keeps_fresh_recordings(self):
        future = timezone.now() + timedelta(days=5)
        self._call('CA2', recording_sid='RE2', retention_expires_at=future)
        with mock.patch('telephony.retention._twilio_client') as client:
            self.assertEqual(purge_expired(), 0)
        client.return_value.recordings.assert_not_called()
        self.assertTrue(CallLog.objects.filter(call_sid='CA2').exists())

    def test_purge_retries_later_when_twilio_fails(self):
        past = timezone.now() - timedelta(days=1)
        self._call('CA3', recording_sid='RE3', retention_expires_at=past)
        with mock.patch('telephony.retention._twilio_client') as client:
            client.return_value.recordings.return_value.delete.side_effect = RuntimeError('boom')
            self.assertEqual(purge_expired(), 0)
        self.assertTrue(CallLog.objects.filter(call_sid='CA3').exists())  # zostaje do kolejnej próby

    def test_purge_keeps_metadata_when_complaint_attached(self):
        past = timezone.now() - timedelta(days=1)
        call = self._call('CA4', recording_sid='RE4', retention_expires_at=past)
        UkeComplaint.objects.create(call_log=call, applicant_name='A', applicant_email='a@b.pl')
        with mock.patch('telephony.retention._twilio_client'):
            purge_expired()
        call = CallLog.objects.get(call_sid='CA4')
        self.assertEqual(call.recording_sid, '')
        self.assertTrue(call.deleted_from_server)


class StartRecordingTests(TestCase):
    """Przycisk "nagrywaj" przed odebraniem: Twilio REST, bez komunikatu dla rozmówcy."""

    def _call(self, sid='CA9', **kw):
        return CallLog.objects.create(call_sid=sid, caller_number='x', recipient_number='+48500', **kw)

    def test_starts_recording_for_latest_call_of_number(self):
        self._call()
        with mock.patch('telephony.retention._twilio_client') as client, \
                mock.patch('telephony.providers.twilio_credentials', return_value=('AC1', 'tok')):
            resp = authed_client().post('/api/telephony/start-recording/', {}, format='json')
        self.assertEqual(resp.status_code, 200)
        client.return_value.calls.assert_called_once_with('CA9')
        self.assertTrue(CallLog.objects.get(call_sid='CA9').recording_started)

    def test_second_press_does_not_start_twice(self):
        self._call(recording_started=True)
        with mock.patch('telephony.retention._twilio_client'):
            resp = authed_client().post('/api/telephony/start-recording/', {}, format='json')
        self.assertEqual(resp.status_code, 404)

    def test_requires_login(self):
        self._call()
        resp = APIClient().post('/api/telephony/start-recording/', {'recipient_number': '+48500'}, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_cannot_record_someone_elses_call(self):
        self._call()  # numer +48500
        client = authed_client(email='other@telepakt.test', phone='+48999')
        with mock.patch('telephony.providers.twilio_credentials', return_value=('AC1', 'tok')):
            resp = client.post('/api/telephony/start-recording/', {'call_sid': 'CA9'}, format='json')
        self.assertEqual(resp.status_code, 404)

    def test_requires_phone_in_profile_and_twilio(self):
        self.assertEqual(authed_client(phone='').post('/api/telephony/start-recording/', {}, format='json').status_code, 400)
        self._call()
        with mock.patch('telephony.providers.twilio_credentials', return_value=('', '')):
            resp = authed_client(email='b@telepakt.test').post('/api/telephony/start-recording/', {'call_sid': 'CA9'}, format='json')
        self.assertEqual(resp.status_code, 503)


@override_settings(DEBUG=True)
class TwilioWebhookTests(TestCase):
    """W trybie DEBUG podpis Twilio jest pomijany."""

    def test_conference_bridge_creates_call_log(self):
        resp = self.client.post('/api/telephony/conference-bridge/',
                                {'From': '+48500100200', 'To': '+48221234567', 'CallSid': 'CA1'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn(b'<Conference', resp.content)
        self.assertTrue(CallLog.objects.filter(call_sid='CA1', status='initiated').exists())

    def test_recording_callback_stores_url_and_sid(self):
        CallLog.objects.create(call_sid='CA2', caller_number='x', recipient_number='y')
        self.client.post('/api/telephony/recording-callback/',
                         {'CallSid': 'CA2', 'RecordingUrl': 'https://x/rec', 'RecordingSid': 'RE123',
                          'RecordingDuration': '12'})
        call = CallLog.objects.get(call_sid='CA2')
        self.assertEqual(call.status, 'recorded')
        self.assertEqual(call.recording_sid, 'RE123')
        self.assertEqual(call.duration_seconds, 12)

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
        self.authed = authed_client()

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

    def test_zero_storage_delete_removes_recording_at_twilio(self):
        CallLog.objects.create(call_sid='CA9', caller_number='x', recipient_number='+48500',
                               recording_url='https://x/r', recording_sid='RE9')
        with mock.patch('telephony.retention._twilio_client') as client:
            resp = self.authed.post('/api/telephony/zero-storage-delete/', {'call_sid': 'CA9'}, format='json')
        self.assertEqual(resp.status_code, 200)
        client.return_value.recordings.assert_called_once_with('RE9')
        client.return_value.recordings.return_value.delete.assert_called_once()
        call = CallLog.objects.get(call_sid='CA9')
        self.assertIsNone(call.recording_url)
        self.assertEqual(call.recording_sid, '')
        self.assertTrue(call.deleted_from_server)
        self.assertEqual(self.authed.post('/api/telephony/zero-storage-delete/', {}, format='json').status_code, 400)

    def test_zero_storage_delete_fails_loudly_when_twilio_is_down(self):
        CallLog.objects.create(call_sid='CA10', caller_number='x', recipient_number='+48500',
                               recording_url='https://x/r', recording_sid='RE10')
        with mock.patch('telephony.retention._twilio_client') as client:
            client.return_value.recordings.return_value.delete.side_effect = RuntimeError('boom')
            resp = self.authed.post('/api/telephony/zero-storage-delete/', {'call_sid': 'CA10'}, format='json')
        self.assertEqual(resp.status_code, 502)
        call = CallLog.objects.get(call_sid='CA10')
        self.assertFalse(call.deleted_from_server)       # nie udajemy, że usunięto
        self.assertEqual(call.recording_sid, 'RE10')

    def test_zero_storage_delete_without_twilio_credentials_is_not_reported_as_success(self):
        CallLog.objects.create(call_sid='CA11', caller_number='x', recipient_number='+48500', recording_sid='RE11')
        resp = self.authed.post('/api/telephony/zero-storage-delete/', {'call_sid': 'CA11'}, format='json')
        self.assertEqual(resp.status_code, 502)

    def test_zero_storage_delete_requires_login_and_ownership(self):
        CallLog.objects.create(call_sid='CA12', caller_number='x', recipient_number='+48999', recording_sid='RE12')
        self.assertEqual(self.api.post('/api/telephony/zero-storage-delete/', {'call_sid': 'CA12'}, format='json').status_code, 401)
        self.assertEqual(self.authed.post('/api/telephony/zero-storage-delete/', {'call_sid': 'CA12'}, format='json').status_code, 404)

    def test_health(self):
        # watek kontroli dostawcow nie moze pisac do bazy testowej rownolegle z testem
        with mock.patch('telephony.providers.maybe_run_health_checks') as check:
            self.assertEqual(self.api.get('/api/telephony/health/').json()['status'], 'healthy')
        check.assert_called_once()


class ProviderFailoverTests(TestCase):
    """Wybor dostawcy, szyfrowanie sekretow, kontrola stanu i przelaczanie."""

    def _provider(self, kind, priority, secret='k', sid='acc', enabled=True, phone='+48111'):
        row, _ = TelephonyProvider.objects.update_or_create(kind=kind, defaults={
            'priority': priority, 'account_sid': sid, 'is_enabled': enabled, 'phone_number': phone,
            'secret_encrypted': providers.encrypt_secret(secret), 'webhook_token': 'tok-' + kind,
        })
        return row

    def test_secret_is_encrypted_and_roundtrips(self):
        row = self._provider('telnyx', 20, secret='KEY123')
        self.assertNotIn('KEY123', row.secret_encrypted)
        self.assertEqual(providers.decrypt_secret(row.secret_encrypted), 'KEY123')

    def test_primary_chosen_then_backup_after_two_failures(self):
        a = self._provider('twilio', 10, phone='+48111')
        self._provider('telnyx', 20, phone='+48222')
        self.assertEqual(providers.active_provider().kind, 'twilio')
        with mock.patch.object(providers.TwilioProvider, 'check', side_effect=RuntimeError('down')):
            providers.run_check(a)
            self.assertEqual(providers.active_provider().kind, 'twilio')  # 1 blad to jeszcze nie awaria
            providers.run_check(a)
        self.assertEqual(providers.active_provider().kind, 'telnyx')
        resp = APIClient().get('/api/telephony/forwarding-info/')
        self.assertEqual(resp.json()['number'], '+48222')
        self.assertEqual(resp.json()['codes']['when_busy'], '**67*+48222#')

    def test_primary_returns_after_recovery(self):
        a = self._provider('twilio', 10)
        self._provider('telnyx', 20)
        a.status = 'failing'
        a.save()
        with mock.patch.object(providers.TwilioProvider, 'check'):
            providers.run_check(a)
        self.assertEqual(providers.active_provider().kind, 'twilio')

    def test_disabled_or_credentialless_provider_is_skipped(self):
        self._provider('twilio', 10, enabled=False)
        self._provider('telnyx', 20, secret='')
        with mock.patch('telephony.providers.twilio_credentials', return_value=('', '')):
            self.assertIsNone(providers.active_provider())
            self.assertEqual(APIClient().get('/api/telephony/forwarding-info/').status_code, 503)

    def test_telnyx_recording_is_silent_and_uses_texml_endpoint(self):
        row = self._provider('telnyx', 20, sid='ACC-UUID', secret='KEY')
        with mock.patch('telephony.providers.requests.request') as req:
            req.return_value.status_code = 200
            providers.TelnyxProvider(row).start_recording('CAx', 'https://cb')
        args, kwargs = req.call_args
        self.assertEqual(args[0], 'POST')
        self.assertTrue(args[1].endswith('/ACC-UUID/Calls/CAx/Recordings.json'))
        self.assertEqual(kwargs['data']['PlayBeep'], 'false')
        self.assertEqual(kwargs['headers']['Authorization'], 'Bearer KEY')

    def test_telnyx_webhook_requires_token_outside_debug(self):
        self._provider('telnyx', 20)
        data = {'From': '+48600', 'To': '+48222', 'CallSid': 'CAT1'}
        bad = self.client.post('/api/telephony/conference-bridge/?provider=telnyx&token=nope', data)
        self.assertEqual(bad.status_code, 403)
        good = self.client.post('/api/telephony/conference-bridge/?provider=telnyx&token=tok-telnyx', data)
        self.assertEqual(good.status_code, 200)
        self.assertEqual(CallLog.objects.get(call_sid='CAT1').provider, 'telnyx')

    def test_telnyx_check_uses_documented_path_and_explains_404(self):
        row = self._provider('telnyx', 20, sid='ACC-UUID', secret='KEY')
        with mock.patch('telephony.providers.requests.request') as req:
            req.return_value.status_code = 404
            req.return_value.json.return_value = {'errors': [{'detail': 'Resource not found'}]}
            with self.assertRaises(providers.ProviderError) as ctx:
                providers.TelnyxProvider(row).check()
        self.assertTrue(req.call_args[0][1].endswith('/ACC-UUID/Calls'))  # bez .json
        self.assertNotIn('KEY', str(ctx.exception))
        self.assertIn('Resource not found', str(ctx.exception))
        self.assertIn('Account ID', str(ctx.exception))


@override_settings(DEBUG=True)
class ForwardedCallTests(TestCase):
    def test_forwarded_from_becomes_recipient_so_record_button_finds_call(self):
        self.client.post('/api/telephony/conference-bridge/', {
            'From': '+48600100200', 'To': '+48221234567', 'ForwardedFrom': '+48500111222', 'CallSid': 'CAF1'})
        self.assertEqual(CallLog.objects.get(call_sid='CAF1').recipient_number, '+48500111222')


@override_settings(DEBUG=True)
class BridgeTwimlTests(TestCase):
    def test_recording_callback_is_absolute_url_and_carries_telnyx_token(self):
        resp = self.client.post('/api/telephony/conference-bridge/?provider=telnyx&token=tok', {
            'From': '+48600', 'To': '+48221', 'CallSid': 'CAB1'})
        body = resp.content.decode()
        self.assertIn('http://testserver/api/telephony/recording-callback/?provider=telnyx&amp;token=tok', body)
        resp = self.client.post('/api/telephony/conference-bridge/', {'From': '+48600', 'To': '+48221', 'CallSid': 'CAB2'})
        self.assertIn('http://testserver/api/telephony/recording-callback/', resp.content.decode())
