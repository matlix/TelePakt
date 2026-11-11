"""Tryb "przed odebraniem": suwak uzbraja komunikat, telefon odrzuca rozmowę, TelePakt odtwarza go po przekierowaniu."""
from datetime import timedelta

from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .models import ArmedMessage, CallLog, VoiceMessage
from .tests import authed_client
from .tests_voice import make_wav
from .voice_views import ARM_TTL

PHONE = '+48500600700'
BRIDGE = '/api/telephony/conference-bridge/'


class ArmEndpointTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='arm@telepakt.test', phone=PHONE)
        self.messages = self.api.get('/api/telephony/messages/').json()['messages']

    def test_arm_stores_one_message_per_user_and_reports_the_window(self):
        first, second = self.messages[0]['id'], self.messages[1]['id']
        resp = self.api.post(f'/api/telephony/messages/{first}/arm/')
        self.assertEqual((resp.status_code, resp.json()['status'], resp.json()['expires_in']), (200, 'armed', 120))
        self.api.post(f'/api/telephony/messages/{second}/arm/')
        self.assertEqual(ArmedMessage.objects.count(), 1)
        self.assertEqual(ArmedMessage.objects.get().message_id, second)

    def test_arm_requires_login_ownership_and_warns_about_a_missing_phone(self):
        pk = self.messages[0]['id']
        self.assertEqual(APIClient().post(f'/api/telephony/messages/{pk}/arm/').status_code, 401)
        other = authed_client(email='o3@telepakt.test', phone='+48999000111')
        self.assertEqual(other.post(f'/api/telephony/messages/{pk}/arm/').status_code, 404)
        no_phone = authed_client(email='n@telepakt.test', phone='')
        own = no_phone.get('/api/telephony/messages/').json()['messages'][0]['id']
        self.assertTrue(no_phone.post(f'/api/telephony/messages/{own}/arm/').json()['needs_phone'])


@override_settings(DEBUG=True)
class ForwardedCallPlaybackTests(TestCase):
    def setUp(self):
        cache.clear()
        self.api = authed_client(email='fw@telepakt.test', phone=PHONE)
        self.messages = self.api.get('/api/telephony/messages/').json()['messages']
        self.chosen = VoiceMessage.objects.get(pk=self.messages[1]['id'])

    def _forward(self, sid, forwarded=PHONE, caller='+48700111222'):
        data = {'From': caller, 'To': '+48334402036', 'CallSid': sid}
        if forwarded:
            data['ForwardedFrom'] = forwarded
        return self.client.post(BRIDGE, data)

    def test_armed_message_is_played_and_the_call_is_ended(self):
        self.api.post(f'/api/telephony/messages/{self.chosen.pk}/arm/')
        body = self._forward('CAf1').content.decode()
        self.assertIn(self.chosen.text.split('.')[0], body)      # wybrany komunikat, nie inny
        self.assertIn('<Hangup', body)
        self.assertNotIn('<Conference', body)
        call = CallLog.objects.get(call_sid='CAf1')
        self.assertEqual((call.caller_number, call.recipient_number, call.status), ('+48700111222', PHONE, 'formula_played'))
        self.assertFalse(ArmedMessage.objects.exists())          # zużyte

    def test_recorded_message_is_played_as_audio(self):
        self.api.generic('POST', f'/api/telephony/messages/{self.chosen.pk}/audio/', make_wav(1.5), content_type='audio/wav')
        self.api.post(f'/api/telephony/messages/{self.chosen.pk}/arm/')
        body = self._forward('CAf2').content.decode()
        self.assertIn(f'/api/telephony/announce/{self.chosen.public_token}/audio.wav', body)
        self.assertIn('<Hangup', body)

    def test_known_user_without_arming_gets_the_first_active_message(self):
        first = VoiceMessage.objects.get(pk=self.messages[0]['id'])
        body = self._forward('CAf3').content.decode()
        self.assertIn(first.text.split('.')[0], body)
        self.assertIn('<Hangup', body)

    def test_user_without_active_messages_gets_the_default_formula(self):
        VoiceMessage.objects.filter(owner__profile__phone_protected=PHONE).update(is_active=False)
        body = self._forward('CAf4').content.decode()
        self.assertIn('art. 398', body.replace('398 PKE', 'art. 398'))
        self.assertIn('<Hangup', body)

    def test_missing_forwarded_from_uses_the_single_fresh_arming_only(self):
        self.api.post(f'/api/telephony/messages/{self.chosen.pk}/arm/')
        body = self._forward('CAf5', forwarded=None).content.decode()
        self.assertIn(self.chosen.text.split('.')[0], body)
        # dwóch uzbrojonych naraz - nie zgadujemy czyja to rozmowa
        other = authed_client(email='fw2@telepakt.test', phone='+48999000111')
        other_id = other.get('/api/telephony/messages/').json()['messages'][0]['id']
        self.api.post(f'/api/telephony/messages/{self.chosen.pk}/arm/')
        other.post(f'/api/telephony/messages/{other_id}/arm/')
        body = self._forward('CAf6', forwarded=None).content.decode()
        self.assertIn('<Conference', body)

    def test_expired_arming_is_ignored(self):
        self.api.post(f'/api/telephony/messages/{self.chosen.pk}/arm/')
        ArmedMessage.objects.update(armed_at=timezone.now() - ARM_TTL - timedelta(seconds=5))
        body = self._forward('CAf7', forwarded=None).content.decode()
        self.assertIn('<Conference', body)

    def test_unknown_forwarded_number_and_own_three_way_calls_keep_their_behaviour(self):
        self.assertIn('<Conference', self._forward('CAf8', forwarded='+48555000111').content.decode())
        own = self._forward('CAf9', forwarded=None, caller=PHONE).content.decode()   # 3-way: dzwoni sam użytkownik
        self.assertIn('beep="false"', own)
        self.assertEqual(CallLog.objects.get(call_sid='CAf9').caller_number, 'Rozmowa własna (3-way)')
