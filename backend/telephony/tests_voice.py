"""Komunikaty głosowe: ustawienia, CRUD, własne nagranie WAV, odtwarzanie w rozmowie, adresy dla dostawcy."""
import io
import wave
from unittest import mock

from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient

from . import providers, voice
from .models import CallLog, TelephonyProvider, VoiceMessage
from .tests import authed_client
from .views import OWN_CALL_LABEL

PHONE = '+48500600700'


def make_wav(seconds=1.0, rate=8000, channels=1, width=2):
    buf = io.BytesIO()
    with wave.open(buf, 'wb') as w:
        w.setnchannels(channels)
        w.setsampwidth(width)
        w.setframerate(rate)
        w.writeframes(b'\x00\x01' * int(rate * seconds) * channels)
    return buf.getvalue()


class VoiceSettingsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='v@telepakt.test', phone=PHONE)

    def test_defaults_and_update(self):
        data = self.api.get('/api/telephony/voice-settings/').json()
        self.assertEqual((data['voice'], data['rate']), ('Polly.Ola-Neural', 110))
        self.assertTrue(any(v['id'] == 'Polly.Jacek' for v in data['voices']))
        resp = self.api.patch('/api/telephony/voice-settings/', {'voice': 'Polly.Jacek', 'rate': 90}, format='json')
        self.assertEqual((resp.json()['voice'], resp.json()['rate']), ('Polly.Jacek', 90))

    def test_invalid_values_are_rejected(self):
        for payload in ({'voice': 'Polly.Nikt'}, {'rate': 10}, {'rate': 500}, {'rate': 'szybko'}):
            self.assertEqual(self.api.patch('/api/telephony/voice-settings/', payload, format='json').status_code, 400)

    def test_requires_login(self):
        self.assertEqual(APIClient().get('/api/telephony/voice-settings/').status_code, 401)


class MessagesTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='m@telepakt.test', phone=PHONE)

    def test_first_listing_seeds_defaults_without_recording_notice_or_threats(self):
        messages = self.api.get('/api/telephony/messages/').json()['messages']
        self.assertEqual(len(messages), len(voice.DEFAULT_MESSAGES))
        joined = ' '.join(m['text'] for m in messages).lower()
        self.assertNotIn('nagryw', joined)       # zasada produktu: bez zapowiedzi nagrywania
        self.assertNotIn('rygorem', joined)      # i bez gróźb
        self.assertEqual(len(self.api.get('/api/telephony/messages/').json()['messages']), len(messages))  # tylko raz

    def test_create_edit_delete_and_limits(self):
        created = self.api.post('/api/telephony/messages/', {'title': 'Mój', 'text': 'Dzień dobry.', 'situation': 'debt'}, format='json')
        self.assertEqual(created.status_code, 201)
        pk = created.json()['id']
        patched = self.api.patch(f'/api/telephony/messages/{pk}/', {'text': 'Nowa treść', 'is_active': False}, format='json')
        self.assertEqual((patched.json()['text'], patched.json()['is_active']), ('Nowa treść', False))
        self.assertEqual(self.api.patch(f'/api/telephony/messages/{pk}/', {'text': ''}, format='json').status_code, 400)
        self.assertEqual(self.api.patch(f'/api/telephony/messages/{pk}/', {'situation': 'zla'}, format='json').status_code, 400)
        self.assertEqual(self.api.delete(f'/api/telephony/messages/{pk}/').status_code, 204)
        for i in range(voice.MAX_MESSAGES):
            self.api.post('/api/telephony/messages/', {'title': f't{i}', 'text': 'x'}, format='json')
        self.assertEqual(self.api.post('/api/telephony/messages/', {'title': 'za dużo', 'text': 'x'}, format='json').status_code, 400)

    def test_messages_are_private_to_their_owner(self):
        pk = self.api.post('/api/telephony/messages/', {'title': 'A', 'text': 'x'}, format='json').json()['id']
        other = authed_client(email='o@telepakt.test', phone='+48999000111')
        self.assertEqual(other.patch(f'/api/telephony/messages/{pk}/', {'title': 'X'}, format='json').status_code, 404)
        self.assertEqual(other.delete(f'/api/telephony/messages/{pk}/').status_code, 404)
        self.assertEqual(other.post(f'/api/telephony/messages/{pk}/speak/').status_code, 404)
        self.assertEqual(APIClient().get('/api/telephony/messages/').status_code, 401)


class OwnRecordingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='r@telepakt.test', phone=PHONE)
        self.pk = self.api.post('/api/telephony/messages/', {'title': 'A', 'text': 'x'}, format='json').json()['id']

    def _upload(self, data):
        return self.api.generic('POST', f'/api/telephony/messages/{self.pk}/audio/', data, content_type='audio/wav')

    def test_valid_wav_is_stored_and_can_be_previewed_and_removed(self):
        resp = self._upload(make_wav(2.0))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()['has_audio'])
        self.assertEqual(resp.json()['source'], 'recorded')
        self.assertAlmostEqual(resp.json()['audio_seconds'], 2.0, places=1)
        self.assertEqual(self.api.get(f'/api/telephony/messages/{self.pk}/audio/').content[:4], b'RIFF')
        removed = self.api.delete(f'/api/telephony/messages/{self.pk}/audio/')
        self.assertEqual(removed.json()['source'], 'tts')

    def test_invalid_audio_is_rejected_with_a_reason(self):
        cases = [(b'not a wav at all', 'WAV'), (make_wav(0.1), 'krótkie'), (make_wav(1, channels=2), 'mono'),
                 (make_wav(65, rate=8000), 'za długie'), (make_wav(1, rate=4000), 'częstotliwość')]
        for data, hint in cases:
            resp = self._upload(data)
            self.assertEqual(resp.status_code, 400, hint)
            self.assertIn(hint, resp.json()['error'])
        self.assertEqual(self._upload(b'RIFF' + b'\x00' * 2_100_000).status_code, 400)  # za duże


class SpeakTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='s@telepakt.test', phone=PHONE)
        self.message = self.api.post('/api/telephony/messages/', {'title': 'Sprzeciw', 'text': 'Nie wyrażam zgody.'}, format='json').json()
        self.msg_obj = VoiceMessage.objects.get(pk=self.message['id'])

    def _own_call(self, **kw):
        return CallLog.objects.create(call_sid='CAs1', caller_number=OWN_CALL_LABEL, recipient_number=PHONE,
                                      recording_started=True, status='initiated', provider='twilio', **kw)

    def test_no_active_own_call_gives_an_actionable_message(self):
        resp = self.api.post(f"/api/telephony/messages/{self.message['id']}/speak/")
        self.assertEqual(resp.status_code, 409)
        self.assertIn('scal', resp.json()['error'])

    def test_speak_announces_into_the_conference_with_a_public_url(self):
        self._own_call()
        conf = mock.MagicMock(sid='CFx')
        with mock.patch('telephony.providers.twilio_credentials', return_value=('AC1', 'tok')), \
                mock.patch('telephony.retention._twilio_client') as client:
            client.return_value.conferences.list.return_value = [conf]
            resp = self.api.post(f"/api/telephony/messages/{self.message['id']}/speak/")
        self.assertEqual(resp.status_code, 200)
        client.return_value.conferences.list.assert_called_once_with(friendly_name='telepakt_bridge_CAs1', status='in-progress', limit=1)
        update = client.return_value.conferences.return_value.participants.return_value.update
        url = update.call_args[1]['announce_url']
        self.assertTrue(url.endswith(f'/api/telephony/announce/{self.msg_obj.public_token}/'))

    def test_provider_failure_is_reported_with_the_reason(self):
        self._own_call()
        with mock.patch('telephony.providers.twilio_credentials', return_value=('AC1', 'tok')), \
                mock.patch('telephony.retention._twilio_client') as client:
            client.return_value.conferences.list.return_value = []
            resp = self.api.post(f"/api/telephony/messages/{self.message['id']}/speak/")
        self.assertEqual(resp.status_code, 502)
        self.assertIn('konferencji', resp.json()['error'])

    def test_ended_or_other_peoples_calls_are_not_used(self):
        CallLog.objects.create(call_sid='CAold', caller_number=OWN_CALL_LABEL, recipient_number=PHONE, status='recorded')
        CallLog.objects.create(call_sid='CAelse', caller_number=OWN_CALL_LABEL, recipient_number='+48999000111', status='initiated')
        self.assertEqual(self.api.post(f"/api/telephony/messages/{self.message['id']}/speak/").status_code, 409)

    def test_telnyx_announce_finds_the_conference_then_updates_the_participant(self):
        row, _ = TelephonyProvider.objects.update_or_create(kind='telnyx', defaults={
            'account_sid': 'acc', 'secret_encrypted': providers.encrypt_secret('KEY'), 'is_enabled': True})
        found = mock.MagicMock(status_code=200)
        # Konferencja z jedną nogą (3-way) bywa w stanie "init" - też ma przyjąć komunikat; zakończona nie.
        found.json.return_value = {'conferences': [{'sid': 'CFold', 'status': 'completed'}, {'sid': 'CFtel', 'status': 'init'}]}
        done = mock.MagicMock(status_code=200)
        with mock.patch('telephony.providers.requests.request', side_effect=[found, done]) as req:
            providers.TelnyxProvider(row).announce('CAx', 'telepakt_bridge_CAx', 'https://api/announce/t/')
        first, second = req.call_args_list
        self.assertEqual(first[0][0], 'GET')
        self.assertEqual(first[1]['params'], {'FriendlyName': 'telepakt_bridge_CAx'})
        self.assertEqual(second[0][0], 'POST')
        self.assertTrue(second[0][1].endswith('/acc/Conferences/CFtel/Participants/CAx'))
        self.assertEqual(second[1]['data']['AnnounceUrl'], 'https://api/announce/t/')


    def test_telnyx_missing_conference_error_lists_what_telnyx_sees(self):
        row, _ = TelephonyProvider.objects.update_or_create(kind='telnyx', defaults={
            'account_sid': 'acc', 'secret_encrypted': providers.encrypt_secret('KEY'), 'is_enabled': True})
        empty = mock.MagicMock(status_code=200)
        empty.json.return_value = {'conferences': []}
        recent = mock.MagicMock(status_code=200)
        recent.json.return_value = {'conferences': [{'friendly_name': 'inna_nazwa', 'status': 'in-progress'}]}
        with mock.patch('telephony.providers.requests.request', side_effect=[empty, recent]):
            with self.assertRaises(providers.ProviderError) as ctx:
                providers.TelnyxProvider(row).announce('CAx', 'telepakt_bridge_CAx', 'https://api/announce/t/')
        message = str(ctx.exception)
        self.assertIn('telepakt_bridge_CAx', message)
        self.assertIn('inna_nazwa (in-progress)', message)


class AnnounceEndpointsTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='a@telepakt.test', phone=PHONE)
        self.api.patch('/api/telephony/voice-settings/', {'voice': 'Polly.Jacek', 'rate': 95}, format='json')
        self.msgs = self.api.get('/api/telephony/messages/').json()['messages']
        self.msg = VoiceMessage.objects.get(pk=self.msgs[0]['id'])

    def test_tts_message_returns_say_with_the_owners_voice_and_speed(self):
        body = APIClient().post(f'/api/telephony/announce/{self.msg.public_token}/').content.decode()
        self.assertIn('voice="Polly.Jacek"', body)
        self.assertIn('rate="95%"', body)
        self.assertIn(self.msg.text.split('.')[0], body)

    def test_recorded_message_returns_play_and_serves_the_audio_publicly(self):
        self.api.generic('POST', f'/api/telephony/messages/{self.msg.pk}/audio/', make_wav(1.5), content_type='audio/wav')
        body = APIClient().get(f'/api/telephony/announce/{self.msg.public_token}/').content.decode()
        self.assertIn(f'/api/telephony/announce/{self.msg.public_token}/audio.wav', body)
        audio = APIClient().get(f'/api/telephony/announce/{self.msg.public_token}/audio.wav')
        self.assertEqual((audio.status_code, audio['Content-Type']), (200, 'audio/wav'))
        self.assertEqual(audio.content[:4], b'RIFF')

    def test_unknown_token_is_404_and_tokens_are_long_and_unique(self):
        self.assertEqual(APIClient().get('/api/telephony/announce/nope/').status_code, 404)
        self.assertEqual(APIClient().get('/api/telephony/announce/nope/audio.wav').status_code, 404)
        tokens = list(VoiceMessage.objects.values_list('public_token', flat=True))
        self.assertEqual(len(set(tokens)), len(tokens))
        self.assertTrue(all(len(t) == 40 for t in tokens))
