"""Nagrywanie całej rozmowy (3-way) i odsłuch nagrań: most konferencyjny, lista, strumień audio."""
from unittest import mock

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import Profile  # noqa: F401  (używane przez authed_client)

from . import providers
from .models import CallLog, TelephonyProvider
from .tests import authed_client
from .views import OWN_CALL_LABEL

OWN = '+48500600700'


@override_settings(DEBUG=True)
class OwnCallBridgeTests(TestCase):
    def setUp(self):
        authed_client(email='me@telepakt.test', phone=OWN)

    def _bridge(self, from_number, sid):
        return self.client.post('/api/telephony/conference-bridge/', {'From': from_number, 'To': '+48334402036', 'CallSid': sid})

    def test_own_phone_calling_in_is_recorded_silently_for_the_other_party(self):
        body = self._bridge(OWN, 'CAown1').content.decode()
        self.assertIn('beep="false"', body)         # żadnych sygnałów słyszalnych dla rozmówcy
        self.assertIn('waitUrl=""', body)           # cisza zamiast muzyki oczekiwania
        self.assertIn('endConferenceOnExit="true"', body)
        self.assertIn('record="record-from-start"', body)
        call = CallLog.objects.get(call_sid='CAown1')
        self.assertEqual(call.caller_number, OWN_CALL_LABEL)
        self.assertEqual(call.recipient_number, OWN)   # należy do użytkownika -> widoczne w jego nagraniach

    def test_unknown_caller_keeps_the_regular_bridge(self):
        body = self._bridge('+48600111222', 'CAspam1').content.decode()
        self.assertNotIn('beep="false"', body)
        self.assertEqual(CallLog.objects.get(call_sid='CAspam1').caller_number, '+48600111222')


class RecordingsApiTests(TestCase):
    def setUp(self):
        self.client_a = authed_client(email='a@telepakt.test', phone=OWN)
        self.client_b = authed_client(email='b@telepakt.test', phone='+48999000111')
        CallLog.objects.create(call_sid='CAr1', caller_number=OWN_CALL_LABEL, recipient_number=OWN, recording_started=True,
                               recording_url='https://api.twilio.com/2010-04-01/Accounts/AC1/Recordings/RE1',
                               recording_sid='RE1', duration_seconds=42, provider='twilio')
        CallLog.objects.create(call_sid='CAr2', caller_number=OWN_CALL_LABEL, recipient_number=OWN, recording_started=True)  # w toku
        CallLog.objects.create(call_sid='CAr3', caller_number='+48600', recipient_number=OWN, recording_started=False)       # bez nagrania
        CallLog.objects.create(call_sid='CAr4', caller_number='x', recipient_number=OWN, recording_started=True, deleted_from_server=True)
        CallLog.objects.create(call_sid='CAother', caller_number='x', recipient_number='+48999000111', recording_started=True)

    def test_list_returns_only_own_live_recordings(self):
        data = self.client_a.get('/api/telephony/recordings/').json()
        sids = [r['call_sid'] for r in data['recordings']]
        self.assertCountEqual(sids, ['CAr1', 'CAr2'])
        first = next(r for r in data['recordings'] if r['call_sid'] == 'CAr1')
        self.assertTrue(first['ready'])
        self.assertTrue(first['own_call'])
        self.assertEqual(first['duration_seconds'], 42)
        self.assertFalse(next(r for r in data['recordings'] if r['call_sid'] == 'CAr2')['ready'])

    def test_list_requires_login_and_phone(self):
        self.assertEqual(APIClient().get('/api/telephony/recordings/').status_code, 401)
        no_phone = authed_client(email='c@telepakt.test', phone='')
        self.assertTrue(no_phone.get('/api/telephony/recordings/').json()['needs_phone'])

    def _twilio_creds(self):
        return mock.patch('telephony.providers.twilio_credentials', return_value=('ACsid', 'tok'))

    def test_audio_streams_through_with_basic_auth_to_twilio_only(self):
        upstream = mock.MagicMock(status_code=200, headers={'Content-Type': 'audio/mpeg'})
        upstream.iter_content.return_value = iter([b'ID3', b'audio'])
        with self._twilio_creds(), mock.patch('telephony.providers.requests.get', return_value=upstream) as get:
            resp = self.client_a.get('/api/telephony/recordings/CAr1/audio/')
            body = b''.join(resp.streaming_content)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(body, b'ID3audio')
        self.assertEqual(resp['Content-Type'], 'audio/mpeg')
        self.assertEqual(get.call_args[0][0], 'https://api.twilio.com/2010-04-01/Accounts/AC1/Recordings/RE1.mp3')
        self.assertEqual(get.call_args[1]['auth'], ('ACsid', 'tok'))

    def test_audio_access_control_and_states(self):
        self.assertEqual(APIClient().get('/api/telephony/recordings/CAr1/audio/').status_code, 401)
        self.assertEqual(self.client_b.get('/api/telephony/recordings/CAr1/audio/').status_code, 404)  # cudze nagranie
        self.assertEqual(self.client_a.get('/api/telephony/recordings/CAr2/audio/').status_code, 409)  # jeszcze przetwarzane
        self.assertEqual(self.client_a.get('/api/telephony/recordings/CAr4/audio/').status_code, 404)  # już usunięte

    def test_audio_provider_failure_is_reported_not_hidden(self):
        upstream = mock.MagicMock(status_code=404, headers={})
        with self._twilio_creds(), mock.patch('telephony.providers.requests.get', return_value=upstream):
            resp = self.client_a.get('/api/telephony/recordings/CAr1/audio/')
        self.assertEqual(resp.status_code, 502)
        self.assertIn('Twilio HTTP 404', resp.json()['error'])

    def test_credentials_are_never_sent_to_a_foreign_host(self):
        CallLog.objects.filter(call_sid='CAr1').update(recording_url='https://evil.example.com/x')
        with self._twilio_creds(), mock.patch('telephony.providers.requests.get') as get:
            resp = self.client_a.get('/api/telephony/recordings/CAr1/audio/')
        self.assertEqual(resp.status_code, 502)
        get.assert_not_called()

    def test_telnyx_recording_uses_bearer_only_for_telnyx_host(self):
        TelephonyProvider.objects.update_or_create(kind='telnyx', defaults={
            'account_sid': 'acc', 'secret_encrypted': providers.encrypt_secret('KEY'), 'is_enabled': True})
        row = CallLog.objects.get(call_sid='CAr1')
        row.provider, row.recording_url = 'telnyx', 'https://api.telnyx.com/v2/texml/Accounts/acc/Recordings/RE9'
        row.save()
        ok = mock.MagicMock(status_code=200, headers={'Content-Type': 'audio/mpeg'})
        with mock.patch('telephony.providers.requests.get', return_value=ok) as get:
            providers.open_recording(row)
        self.assertEqual(get.call_args[1]['headers'], {'Authorization': 'Bearer KEY'})
        row.recording_url = 'https://files.example.org/r.mp3'
        with mock.patch('telephony.providers.requests.get', return_value=ok) as get:
            providers.open_recording(row)
        self.assertEqual(get.call_args[1]['headers'], {})
