from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import ClientLog, Profile
from telephony.models import CallLog
from accounts.services import ensure_profile, issue_token


def client_for(email, **profile):
    user, _ = get_user_model().objects.get_or_create(username=email, defaults={'email': email})
    p = ensure_profile(user)
    for k, v in profile.items():
        setattr(p, k, v)
    p.save()
    api = APIClient()
    api.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_token(user, "test")}')
    return user, api


class CreditGatingTests(TestCase):
    def test_everything_is_allowed_when_credit_is_not_enforced(self):
        _, api = client_for('a@telepakt.test')
        me = api.get('/api/auth/me/').json()
        self.assertTrue(me['telephonyEnabled'])

    @override_settings(TELEPAKT_REQUIRE_CREDIT=True)
    def test_no_credit_means_plain_phone(self):
        _, api = client_for('a@telepakt.test', credit_seconds=0, phone_protected='+48500123456')
        me = api.get('/api/auth/me/').json()
        self.assertEqual((me['telephonyEnabled'], me['creditMinutes']), (False, 0))
        for method, path in (('get', '/api/telephony/forwarding-info/'),
                             ('post', '/api/telephony/start-recording/'),
                             ('post', '/api/telephony/messages/1/speak/')):
            r = getattr(api, method)(path)
            self.assertEqual(r.status_code, 402, path)
            self.assertEqual(r.json()['code'], 'no_credit')

    @override_settings(TELEPAKT_REQUIRE_CREDIT=True)
    def test_credit_or_tester_flag_enables_the_functions(self):
        _, paid = client_for('paid@telepakt.test', credit_seconds=600)
        self.assertEqual(paid.get('/api/auth/me/').json()['creditMinutes'], 10)
        self.assertTrue(paid.get('/api/auth/me/').json()['telephonyEnabled'])
        _, tester = client_for('t@telepakt.test', is_tester=True)
        self.assertTrue(tester.get('/api/auth/me/').json()['telephonyEnabled'])

    @override_settings(TELEPAKT_REQUIRE_CREDIT=True)
    def test_other_features_keep_working_without_credit(self):
        _, api = client_for('a@telepakt.test', credit_seconds=0)
        self.assertEqual(api.get('/api/telephony/number-reputation/?number=500123456').status_code, 200)
        self.assertEqual(api.post('/api/telephony/report-number/', {'number': '500123456'}, format='json').status_code, 201)

    @override_settings(TELEPAKT_REQUIRE_CREDIT=True, DEBUG=True)
    def test_bridge_hangs_up_for_an_account_without_credit(self):
        client_for('a@telepakt.test', credit_seconds=0, phone_protected='+48500123456')
        resp = self.client.post('/api/telephony/conference-bridge/',
                                {'From': '+48500123456', 'To': '+48221234567', 'CallSid': 'CAN1'})
        self.assertIn(b'<Hangup', resp.content)
        self.assertNotIn(b'<Conference', resp.content)
        self.assertFalse(CallLog.objects.filter(call_sid='CAN1').exists())

    @override_settings(TELEPAKT_REQUIRE_CREDIT=True, DEBUG=True)
    def test_recorded_own_call_uses_up_credit_but_never_below_zero(self):
        client_for('a@telepakt.test', credit_seconds=100, phone_protected='+48500123456')
        self.client.post('/api/telephony/conference-bridge/',
                         {'From': '+48500123456', 'To': '+48221234567', 'CallSid': 'CAN2'})
        data = {'CallSid': 'CAN2', 'RecordingUrl': 'https://x/rec', 'RecordingSid': 'RE9', 'RecordingDuration': '70'}
        self.client.post('/api/telephony/recording-callback/', data)
        self.client.post('/api/telephony/recording-callback/', data)  # powtorka callbacku nie liczy drugi raz
        self.assertEqual(Profile.objects.get(phone_protected='+48500123456').credit_seconds, 30)
        self.client.post('/api/telephony/conference-bridge/',
                         {'From': '+48500123456', 'To': '+48221234567', 'CallSid': 'CAN3'})
        self.client.post('/api/telephony/recording-callback/', {**data, 'CallSid': 'CAN3', 'RecordingSid': 'RE10'})
        self.assertEqual(Profile.objects.get(phone_protected='+48500123456').credit_seconds, 0)


class ClientLogTests(TestCase):
    def test_regular_accounts_cannot_send_logs(self):
        _, api = client_for('a@telepakt.test')
        r = api.post('/api/auth/client-log/', {'events': [{'message': 'x'}]}, format='json')
        self.assertEqual(r.status_code, 403)
        self.assertEqual(ClientLog.objects.count(), 0)

    def test_tester_logs_are_stored_and_validated(self):
        _, api = client_for('t@telepakt.test', is_tester=True)
        r = api.post('/api/auth/client-log/', {'events': [
            {'level': 'error', 'source': 'autotest', 'screen': 'Profil', 'message': 'boom', 'details': 'stack'},
            {'level': 'weird', 'message': 'ok'},
            'not-a-dict',
        ]}, format='json')
        self.assertEqual((r.status_code, r.json()['stored']), (201, 2))
        self.assertEqual(list(ClientLog.objects.order_by('id').values_list('level', flat=True)), ['error', 'info'])
        self.assertEqual(api.post('/api/auth/client-log/', {'events': []}, format='json').status_code, 400)


class BalanceEndpointTests(TestCase):
    def test_only_testers_and_staff_see_the_balance(self):
        _, api = client_for('a@telepakt.test')
        self.assertEqual(api.get('/api/telephony/provider-balance/').status_code, 403)

    def test_reports_whether_the_balance_covers_a_full_test(self):
        _, api = client_for('t@telepakt.test', is_tester=True)
        fake = mock.Mock(kind='telnyx')
        fake.has_credentials.return_value = True
        fake.balance.return_value = {'balance': 5.0, 'currency': 'USD', 'available_credit': None}
        with mock.patch('telephony.providers.ordered_providers', return_value=[fake]):
            body = api.get('/api/telephony/provider-balance/').json()
        self.assertEqual((body['provider'], body['balance'], body['enough_for_full_test']), ('telnyx', 5.0, True))
        fake.balance.return_value = {'balance': 0.4, 'currency': 'USD', 'available_credit': None}
        with mock.patch('telephony.providers.ordered_providers', return_value=[fake]):
            self.assertFalse(api.get('/api/telephony/provider-balance/').json()['enough_for_full_test'])

    def test_provider_errors_are_shown(self):
        _, api = client_for('t@telepakt.test', is_tester=True)
        fake = mock.Mock(kind='telnyx')
        fake.has_credentials.return_value = True
        fake.balance.side_effect = RuntimeError('Telnyx HTTP 401')
        with mock.patch('telephony.providers.ordered_providers', return_value=[fake]):
            r = api.get('/api/telephony/provider-balance/')
        self.assertEqual(r.status_code, 503)
        self.assertIn('Telnyx HTTP 401', r.json()['error'])
