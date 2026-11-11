"""Podgląd głosu AI: Telnyx TTS (Amazon Polly) czyta komunikat wybranym głosem i tempem."""
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from rest_framework.test import APIClient

from . import providers
from .models import TelephonyProvider
from .tests import authed_client

PHONE = '+48500600700'


class PreviewTests(TestCase):
    def setUp(self):
        cache.clear()
        providers.TelnyxProvider._tts_working = None  # zapamiętana kombinacja nie może przeciekać między testami
        self.api = authed_client(email='p@telepakt.test', phone=PHONE)
        self.message = self.api.get('/api/telephony/messages/').json()['messages'][0]
        self.url = f"/api/telephony/messages/{self.message['id']}/preview/"

    def _telnyx(self):
        TelephonyProvider.objects.update_or_create(kind='telnyx', defaults={
            'account_sid': 'acc', 'secret_encrypted': providers.encrypt_secret('KEY'), 'is_enabled': False})

    @staticmethod
    def _ok(content=b'ID3-audio'):
        return mock.MagicMock(status_code=200, content=content, headers={'Content-Type': 'audio/mpeg'})

    def test_preview_uses_the_selected_voice_speed_and_text_before_saving(self):
        self._telnyx()
        with mock.patch('telephony.providers.requests.post', return_value=self._ok()) as post:
            resp = self.api.post(self.url, {'voice': 'Polly.Jacek', 'rate': 90, 'text': 'Ala & "kot" <ma>'}, format='json')
        self.assertEqual((resp.status_code, resp['Content-Type']), (200, 'audio/mpeg'))
        self.assertEqual(resp.content, b'ID3-audio')
        body = post.call_args[1]['json']
        self.assertEqual(post.call_args[0][0], 'https://api.telnyx.com/v2/text-to-speech/speech')
        self.assertEqual(body['voice'], 'aws.Polly.Jacek')
        self.assertEqual(body['language'], 'pl-PL')
        self.assertEqual(body['text_type'], 'ssml')
        self.assertIn('<prosody rate="90%">', body['text'])
        self.assertIn('Ala &amp; "kot" &lt;ma&gt;', body['text'])      # tekst użytkownika jest escapowany w SSML
        self.assertEqual(post.call_args[1]['headers'], {'Authorization': 'Bearer KEY'})
        self.assertEqual(self.api.get('/api/telephony/voice-settings/').json()['voice'], 'Polly.Ola-Neural')  # nic nie zapisano

    def test_defaults_come_from_the_account_and_normal_speed_sends_plain_text(self):
        self._telnyx()
        self.api.patch('/api/telephony/voice-settings/', {'voice': 'Polly.Ola-Neural', 'rate': 100}, format='json')
        with mock.patch('telephony.providers.requests.post', return_value=self._ok()) as post:
            self.assertEqual(self.api.post(self.url, {}, format='json').status_code, 200)
        body = post.call_args[1]['json']
        self.assertEqual(body['voice'], 'aws.Polly.Ola-Neural')
        self.assertNotIn('text_type', body)
        self.assertEqual(body['text'], self.message['text'])

    def test_validation_and_access_control(self):
        self._telnyx()
        for payload in ({'voice': 'Polly.Nikt'}, {'rate': 1}, {'rate': 'x'}, {'text': 'a' * 1001}):
            self.assertEqual(self.api.post(self.url, payload, format='json').status_code, 400, payload)
        self.assertEqual(APIClient().post(self.url, {}, format='json').status_code, 401)
        other = authed_client(email='o2@telepakt.test', phone='+48999000111')
        self.assertEqual(other.post(self.url, {}, format='json').status_code, 404)

    def test_without_telnyx_credentials_it_explains_what_is_missing(self):
        resp = self.api.post(self.url, {}, format='json')
        self.assertEqual(resp.status_code, 503)
        self.assertIn('Telnyx', resp.json()['error'])

    def test_provider_error_is_reported_with_its_reason_and_never_leaks_the_key(self):
        self._telnyx()
        bad = mock.MagicMock(status_code=422, headers={})
        bad.json.return_value = {'errors': [{'detail': 'Voice not found'}]}
        with mock.patch('telephony.providers.requests.post', return_value=bad):
            resp = self.api.post(self.url, {}, format='json')
        self.assertEqual(resp.status_code, 502)
        self.assertIn('Voice not found', resp.json()['error'])
        self.assertNotIn('KEY', resp.content.decode())


class RobustSynthesisTests(TestCase):
    def setUp(self):
        providers.TelnyxProvider._tts_working = None
        self.row, _ = TelephonyProvider.objects.update_or_create(kind='telnyx', defaults={
            'account_sid': 'acc', 'secret_encrypted': providers.encrypt_secret('KEY'), 'is_enabled': False})

    @staticmethod
    def _resp(status, content=b'', detail=None):
        r = mock.MagicMock(status_code=status, content=content, headers={'Content-Type': 'audio/mpeg'})
        r.json.return_value = {'errors': [{'detail': detail}]} if detail else {}
        return r

    def test_tries_the_other_voice_spelling_when_the_first_is_rejected_and_remembers_it(self):
        responses = [self._resp(422, detail='Voice not found'), self._resp(200, b'AUDIO')]
        with mock.patch('telephony.providers.requests.post', side_effect=responses) as post:
            audio, _ = providers.TelnyxProvider(self.row).synthesize('Cześć', 'Polly.Ola-Neural', 100)
        self.assertEqual(audio, b'AUDIO')
        voices = [c[1]['json']['voice'] for c in post.call_args_list]
        self.assertEqual(voices, ['aws.Polly.Ola-Neural', 'aws.Polly.Neural.Ola'])
        with mock.patch('telephony.providers.requests.post', return_value=self._resp(200, b'X')) as post:
            providers.TelnyxProvider(self.row).synthesize('Cześć', 'Polly.Ola-Neural', 100)
        self.assertEqual(post.call_args[1]['json']['voice'], 'aws.Polly.Neural.Ola')  # działającej nie próbujemy od nowa
        self.assertEqual(post.call_count, 1)

    def test_tries_the_other_endpoint_on_404(self):
        responses = [self._resp(404), self._resp(200, b'AUDIO')]
        with mock.patch('telephony.providers.requests.post', side_effect=responses) as post:
            providers.TelnyxProvider(self.row).synthesize('Cześć', 'Polly.Jacek', 100)
        urls = [c[0][0] for c in post.call_args_list]
        self.assertEqual(urls, ['https://api.telnyx.com/v2/text-to-speech/speech', 'https://api.telnyx.com/v2/text-to-speech'])
        self.assertEqual(post.call_args_list[1][1]['json']['voice'], 'aws.Polly.Jacek')  # 404 nie zmienia nazwy głosu

    def test_auth_and_payment_errors_stop_immediately_with_a_clear_hint(self):
        for status, hint in ((401, 'klucz API'), (402, 'brak środków'), (403, 'uprawnień')):
            with mock.patch('telephony.providers.requests.post', return_value=self._resp(status)) as post:
                with self.assertRaises(providers.ProviderError) as ctx:
                    providers.TelnyxProvider(self.row).synthesize('x', 'Polly.Ola-Neural', 100)
            self.assertEqual(post.call_count, 1)
            self.assertIn(hint, str(ctx.exception))
            self.assertNotIn('KEY', str(ctx.exception))

    def test_when_everything_fails_every_attempt_is_listed(self):
        with mock.patch('telephony.providers.requests.post', return_value=self._resp(422, detail='bad voice')):
            with self.assertRaises(providers.ProviderError) as ctx:
                providers.TelnyxProvider(self.row).synthesize('x', 'Polly.Maja', 100)
        msg = str(ctx.exception)
        self.assertIn('aws.Polly.Maja', msg)
        self.assertIn('aws.Polly.Standard.Maja', msg)
        self.assertIn('HTTP 422 bad voice', msg)

    def test_admin_action_reports_success_and_the_full_failure_reason(self):
        from django.contrib.auth.models import User
        from django.test import override_settings
        User.objects.create_superuser('root', 'r@x.pl', 'Passw0rd!xyz')
        self.client.login(username='root', password='Passw0rd!xyz')
        with override_settings(ALLOWED_HOSTS=['testserver'], STORAGES={
                'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'}}):
            payload = {'action': 'check_tts', '_selected_action': [self.row.pk]}
            with mock.patch('telephony.providers.requests.post', return_value=self._resp(200, b'A' * 2048)):
                ok = self.client.post('/admin/telephony/telephonyprovider/', payload, follow=True)
            self.assertIn('Synteza mowy Telnyx działa', ok.content.decode())
            with mock.patch('telephony.providers.requests.post', return_value=self._resp(403)):
                bad = self.client.post('/admin/telephony/telephonyprovider/', payload, follow=True)
            self.assertIn('BŁĄD', bad.content.decode())
            self.assertIn('uprawnień', bad.content.decode())
