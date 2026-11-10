"""Testy kont: rejestracja, logowanie, profil, reset hasla, usuniecie konta."""
from unittest import mock

from django.contrib.auth.models import User
from django.core import mail
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from telephony.models import CallLog

from .models import AuthToken, Profile
from .services import normalize_phone

PASSWORD = 'Sup3r-tajne-haslo'


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class AuthApiTests(TestCase):
    def setUp(self):
        cache.clear()  # liczniki throttlingu nie moga przeciekac miedzy testami
        self.api = APIClient()

    def _register(self, email='Jan@Example.pl', password=PASSWORD, name='Jan'):
        return self.api.post('/api/auth/register/', {'email': email, 'password': password, 'name': name}, format='json')

    def _auth(self, token):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        return client

    def test_register_login_me_roundtrip(self):
        resp = self._register()
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.json()['user']['email'], 'jan@example.pl')
        self.assertEqual(resp.json()['user']['subscriptionPlan'], 'free')

        login = self.api.post('/api/auth/login/', {'email': 'JAN@example.pl', 'password': PASSWORD}, format='json')
        self.assertEqual(login.status_code, 200)
        me = self._auth(login.json()['token']).get('/api/auth/me/')
        self.assertEqual(me.json()['name'], 'Jan')

    def test_token_is_stored_hashed(self):
        token = self._register().json()['token']
        self.assertFalse(AuthToken.objects.filter(key_hash=token).exists())
        self.assertEqual(AuthToken.objects.count(), 1)

    def test_duplicate_weak_password_and_bad_email_rejected(self):
        self._register()
        self.assertEqual(self._register().status_code, 409)
        self.assertEqual(self._register(email='x@y.pl', password='123').status_code, 400)
        self.assertEqual(self._register(email='nie-email').status_code, 400)

    def test_wrong_password_is_generic_401(self):
        self._register()
        resp = self.api.post('/api/auth/login/', {'email': 'jan@example.pl', 'password': 'zle'}, format='json')
        self.assertEqual(resp.status_code, 401)
        resp = self.api.post('/api/auth/login/', {'email': 'nikt@example.pl', 'password': 'zle'}, format='json')
        self.assertEqual(resp.status_code, 401)

    def test_stale_token_header_does_not_block_login(self):
        self._register()
        client = self._auth('wygasly')
        resp = client.post('/api/auth/login/', {'email': 'jan@example.pl', 'password': PASSWORD}, format='json')
        self.assertEqual(resp.status_code, 200)

    def test_invalid_token_is_401_and_logout_revokes(self):
        self.assertEqual(self._auth('nope').get('/api/auth/me/').status_code, 401)
        self.assertEqual(self.api.get('/api/auth/me/').status_code, 401)
        client = self._auth(self._register().json()['token'])
        self.assertEqual(client.post('/api/auth/logout/').status_code, 200)
        self.assertEqual(client.get('/api/auth/me/').status_code, 401)

    def test_patch_profile_normalizes_phone_and_ignores_plan(self):
        client = self._auth(self._register().json()['token'])
        resp = client.patch('/api/auth/me/', {'name': 'Jan K.', 'phoneProtected': '500 123 456',
                                              'subscriptionPlan': 'b2b'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['phoneProtected'], '+48 500 123 456')
        self.assertEqual(resp.json()['subscriptionPlan'], 'free')
        self.assertEqual(Profile.objects.get().phone_protected, '+48500123456')
        self.assertEqual(client.patch('/api/auth/me/', {'phoneProtected': '123'}, format='json').status_code, 400)

    def test_password_reset_flow_logs_out_other_sessions(self):
        old_token = self._register().json()['token']
        self.assertEqual(self.api.post('/api/auth/password-reset/', {'email': 'jan@example.pl'}, format='json').status_code, 200)
        self.assertEqual(self.api.post('/api/auth/password-reset/', {'email': 'brak@example.pl'}, format='json').status_code, 200)
        self.assertEqual(len(mail.outbox), 1)  # nieznany adres: ta sama odpowiedz, brak maila
        code = mail.outbox[0].body.split(': ')[1].split()[0]

        bad = self.api.post('/api/auth/password-reset/confirm/', {'email': 'jan@example.pl', 'code': '00000000',
                                                                  'newPassword': 'Nowe-haslo-123'}, format='json')
        self.assertEqual(bad.status_code, 400)
        ok = self.api.post('/api/auth/password-reset/confirm/', {'email': 'jan@example.pl', 'code': code,
                                                                 'newPassword': 'Nowe-haslo-123'}, format='json')
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(self._auth(old_token).get('/api/auth/me/').status_code, 401)
        login = self.api.post('/api/auth/login/', {'email': 'jan@example.pl', 'password': 'Nowe-haslo-123'}, format='json')
        self.assertEqual(login.status_code, 200)

    def test_reset_code_locks_after_five_wrong_attempts(self):
        self._register()
        self.api.post('/api/auth/password-reset/', {'email': 'jan@example.pl'}, format='json')
        code = mail.outbox[0].body.split(': ')[1].split()[0]
        for _ in range(5):
            self.api.post('/api/auth/password-reset/confirm/', {'email': 'jan@example.pl', 'code': '11111111',
                                                                'newPassword': 'Nowe-haslo-123'}, format='json')
        resp = self.api.post('/api/auth/password-reset/confirm/', {'email': 'jan@example.pl', 'code': code,
                                                                   'newPassword': 'Nowe-haslo-123'}, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_delete_account_needs_password_and_erases_recordings(self):
        client = self._auth(self._register().json()['token'])
        client.patch('/api/auth/me/', {'phoneProtected': '500123456'}, format='json')
        CallLog.objects.create(call_sid='CAD', caller_number='x', recipient_number='+48500123456', recording_sid='RED')
        CallLog.objects.create(call_sid='CAO', caller_number='x', recipient_number='+48999999999', recording_sid='REO')

        self.assertEqual(client.delete('/api/auth/me/', {'password': 'zle'}, format='json').status_code, 403)
        with mock.patch('telephony.retention._twilio_client') as twilio:
            resp = client.delete('/api/auth/me/', {'password': PASSWORD}, format='json')
        self.assertEqual(resp.status_code, 204)
        twilio.return_value.recordings.assert_called_once_with('RED')
        self.assertFalse(User.objects.filter(username='jan@example.pl').exists())
        self.assertFalse(CallLog.objects.filter(call_sid='CAD').exists())
        self.assertTrue(CallLog.objects.filter(call_sid='CAO').exists())  # cudze polaczenie zostaje

    def test_delete_account_keeps_user_if_recording_cannot_be_erased(self):
        client = self._auth(self._register().json()['token'])
        client.patch('/api/auth/me/', {'phoneProtected': '500123456'}, format='json')
        CallLog.objects.create(call_sid='CAD', caller_number='x', recipient_number='+48500123456', recording_sid='RED')
        with mock.patch('telephony.providers.twilio_credentials', return_value=('', '')):
            resp = client.delete('/api/auth/me/', {'password': PASSWORD}, format='json')
        self.assertEqual(resp.status_code, 502)
        self.assertTrue(User.objects.filter(username='jan@example.pl').exists())

    def test_normalize_phone(self):
        self.assertEqual(normalize_phone('+48 500-123-456'), '+48500123456')
        self.assertEqual(normalize_phone(''), '')
        self.assertIsNone(normalize_phone('12345'))
