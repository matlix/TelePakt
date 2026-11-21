from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from accounts.services import issue_token
from .models import NumberReport, normalize_number


def client_for(email):
    user, _ = get_user_model().objects.get_or_create(username=email, defaults={'email': email})
    api = APIClient()
    api.credentials(HTTP_AUTHORIZATION=f'Bearer {issue_token(user, "test")}')
    return user, api


class NormalizeTests(TestCase):
    def test_polish_formats_converge(self):
        for raw in ('500 123 456', '+48 500 123 456', '0048500123456', '48500123456', '500-123-456'):
            self.assertEqual(normalize_number(raw), '48500123456', raw)

    def test_garbage_is_rejected(self):
        for raw in ('', None, 'abc', '123', '1' * 20):
            self.assertIsNone(normalize_number(raw), raw)


class ReputationTests(TestCase):
    def test_requires_login(self):
        self.assertEqual(APIClient().get('/api/telephony/number-reputation/?number=500123456').status_code, 401)
        self.assertEqual(APIClient().post('/api/telephony/report-number/', {'number': '500123456'}, format='json').status_code, 401)

    def test_warns_only_from_three_distinct_reporters(self):
        for i in range(2):
            _, api = client_for(f'u{i}@telepakt.test')
            r = api.post('/api/telephony/report-number/', {'number': '500 123 456'}, format='json')
            self.assertEqual(r.status_code, 201)
        _, viewer = client_for('viewer@telepakt.test')
        body = viewer.get('/api/telephony/number-reputation/?number=%2B48500123456').json()
        self.assertEqual((body['warn'], body['reports']), (False, 0))  # za mało zgłoszeń: nic nie ujawniamy
        _, api3 = client_for('u3@telepakt.test')
        api3.post('/api/telephony/report-number/', {'number': '48500123456', 'category': 'scam'}, format='json')
        body = viewer.get('/api/telephony/number-reputation/?number=500123456').json()
        self.assertEqual((body['warn'], body['reports']), (True, 3))

    def test_same_user_counts_once(self):
        _, api = client_for('a@telepakt.test')
        self.assertEqual(api.post('/api/telephony/report-number/', {'number': '500123456'}, format='json').status_code, 201)
        r = api.post('/api/telephony/report-number/', {'number': '+48500123456'}, format='json')
        self.assertEqual((r.status_code, r.json()['status']), (200, 'already_reported'))
        self.assertEqual(NumberReport.objects.count(), 1)

    def test_validation_errors_are_readable(self):
        _, api = client_for('a@telepakt.test')
        self.assertIn('numer', api.post('/api/telephony/report-number/', {'number': 'abc'}, format='json').json()['error'])
        self.assertIn('kategoria', api.post('/api/telephony/report-number/', {'number': '500123456', 'category': 'x'}, format='json').json()['error'])
        self.assertEqual(api.get('/api/telephony/number-reputation/?number=1').status_code, 400)
