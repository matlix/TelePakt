"""Smoke testy panelu admina (Unfold): pulpit, strony statystyk, listy/formularze wszystkich modeli."""
from datetime import timedelta

from django.contrib import admin
from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from accounts.models import Profile

from . import providers
from .models import CallLog, CustomerReview, InAppPurchaseReceipt, LegalScript, TelephonyProvider

# W testach nie ma manifestu collectstatic, więc zwykły storage zamiast Manifest.
PLAIN_STATIC = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage'},
}


class PythonCompatTests(TestCase):
    def test_template_context_can_be_copied_on_this_python(self):
        """Regresja: Django 5.1 + Python 3.14 -> AttributeError w copy(Context), wszystkie strony panelu 500."""
        import copy
        from django.template import Context

        ctx = Context({'a': 1})
        self.assertEqual(copy.copy(ctx)['a'], 1)
        self.assertEqual(ctx.new({'b': 2})['b'], 2)


@override_settings(STORAGES=PLAIN_STATIC, ALLOWED_HOSTS=['testserver'], DEBUG=False)
class AdminSmokeTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.admin_user = User.objects.create_superuser('root', 'root@telepakt.test', 'Passw0rd!xyz')
        Profile.objects.create(user=cls.admin_user, name='Root')
        now = timezone.now()
        for i, (prov, status) in enumerate([('twilio', 'recorded'), ('twilio', 'deleted'),
                                            ('telnyx', 'initiated'), ('twilio', 'recorded')]):
            CallLog.objects.create(call_sid=f'CA{i}', caller_number=f'+4860000000{i % 2}', recipient_number='+48500',
                                   provider=prov, status=status, duration_seconds=30 * i, recording_started=bool(i % 2),
                                   timestamp=now - timedelta(days=i * 3, hours=i))
        u = User.objects.create_user('u1', 'u1@telepakt.test', 'x')
        Profile.objects.create(user=u, name='Jan', phone_protected='+48500600700', subscription_plan='shield')
        CustomerReview.objects.create(author_name='A', rating=4, title='ok', content='dobre')
        CustomerReview.objects.create(author_name='B', rating=5, title='super', content='x', is_approved=True)
        InAppPurchaseReceipt.objects.create(user_email='a@b.pl', product_id='p', purchase_token='t1',
                                            expires_at=now + timedelta(days=30))
        LegalScript.objects.create(title='T', category='pke', text_content='tekst', legal_act='art. 398')
        providers.ensure_default_providers()

    def setUp(self):
        self.client.force_login(self.admin_user)

    def test_dashboard_renders_with_period_filters(self):
        for query in ['', '?period=today', '?period=all', '?period=custom&date_from=2026-01-01&date_to=2026-12-31',
                      '?period=custom&date_from=zle', '?period=nonsense']:
            resp = self.client.get('/admin/' + query)
            self.assertEqual(resp.status_code, 200, query)
        body = self.client.get('/admin/').content.decode()
        self.assertIn('Dostawcy telefonii', body)
        self.assertIn('Opinie czekające na moderację', body)

    def test_all_stats_pages_render_for_every_period_and_filter(self):
        queries = ['', '?period=today', '?period=yesterday', '?period=7d', '?period=90d', '?period=month',
                   '?period=year', '?period=all&group=month', '?period=30d&group=hour',
                   '?period=custom&date_from=2026-01-01&date_to=2026-12-31',
                   '?provider=telnyx', '?status=recorded', '?plan=shield', '?rating=5']
        for name in ('admin_stats_calls', 'admin_stats_users', 'admin_stats_feedback'):
            for q in queries:
                resp = self.client.get(reverse(name) + q)
                self.assertEqual(resp.status_code, 200, f'{name}{q}')
        body = self.client.get(reverse('admin_stats_calls') + '?period=all').content.decode()
        self.assertIn('Najczęściej dzwoniące numery', body)
        self.assertIn('vendor/chart.umd.min.js', body)  # Chart.js z własnych plików statycznych

    def test_stats_pages_require_staff(self):
        self.client.logout()
        resp = self.client.get(reverse('admin_stats_calls'))
        self.assertEqual(resp.status_code, 302)
        self.assertIn('/admin/login/', resp['Location'])

    def test_every_registered_model_admin_pages_load(self):
        checked = 0
        for model, model_admin in admin.site._registry.items():
            app, name = model._meta.app_label, model._meta.model_name
            if app not in ('accounts', 'telephony', 'auth'):
                continue
            for suffix in ('changelist', 'add'):
                resp = self.client.get(reverse(f'admin:{app}_{name}_{suffix}'))
                self.assertEqual(resp.status_code, 200, f'{app}.{name} {suffix}')
            obj = model.objects.first()
            if obj is not None:
                resp = self.client.get(reverse(f'admin:{app}_{name}_change', args=[obj.pk]))
                self.assertEqual(resp.status_code, 200, f'{app}.{name} change')
            checked += 1
        self.assertGreaterEqual(checked, 10)

    def test_changelist_filters_and_search_work(self):
        for url in ['/admin/telephony/calllog/?status=recorded&provider=twilio',
                    '/admin/telephony/calllog/?q=%2B486000000',
                    '/admin/telephony/calllog/?timestamp_from_0=2026-01-01&timestamp_from_1=00:00:00&timestamp_to_0=2026-12-31&timestamp_to_1=23:59:59',
                    '/admin/telephony/customerreview/?is_approved__exact=0',
                    '/admin/accounts/profile/?subscription_plan=shield']:
            self.assertEqual(self.client.get(url).status_code, 200, url)

    def test_provider_can_be_created_edited_and_secret_is_encrypted(self):
        row = TelephonyProvider.objects.get(kind='twilio')
        url = reverse('admin:telephony_telephonyprovider_change', args=[row.pk])
        resp = self.client.post(url, {'kind': 'twilio', 'is_enabled': 'on', 'priority': 5, 'account_sid': 'ACtest',
                                      'secret': 'super-secret-token', 'phone_number': '+48221112233'})
        self.assertEqual(resp.status_code, 302)
        row.refresh_from_db()
        self.assertTrue(row.is_enabled)
        self.assertNotIn('super-secret-token', row.secret_encrypted)
        self.assertEqual(providers.decrypt_secret(row.secret_encrypted), 'super-secret-token')
        # edycja bez wpisywania sekretu nie kasuje zapisanego
        self.client.post(url, {'kind': 'twilio', 'is_enabled': 'on', 'priority': 5, 'account_sid': 'ACtest',
                               'secret': '', 'phone_number': '+48221112233'})
        row.refresh_from_db()
        self.assertEqual(providers.decrypt_secret(row.secret_encrypted), 'super-secret-token')

    def test_second_provider_of_same_kind_is_rejected_not_500(self):
        resp = self.client.post(reverse('admin:telephony_telephonyprovider_add'),
                                {'kind': 'twilio', 'is_enabled': 'on', 'priority': 1, 'account_sid': 'x',
                                 'secret': 'y', 'phone_number': ''})
        self.assertEqual(resp.status_code, 200)  # formularz z błędem unikalności
        self.assertEqual(TelephonyProvider.objects.filter(kind='twilio').count(), 1)

    def test_webhook_urls_use_api_host_and_token_can_be_rotated(self):
        row = TelephonyProvider.objects.get(kind='telnyx')
        url = reverse('admin:telephony_telephonyprovider_change', args=[row.pk])
        body = self.client.get(url).content.decode()
        self.assertIn('https://api.telepakt.pl/api/telephony/conference-bridge/?provider=telnyx&amp;token=' + row.webhook_token, body)
        self.assertNotIn('https://telepakt.pl/api/', body)  # to jest strona WWW, nie API
        old = row.webhook_token
        resp = self.client.post(reverse('admin:telephony_telephonyprovider_changelist'), {
            'action': 'rotate_webhook_token', '_selected_action': [row.pk]})
        self.assertEqual(resp.status_code, 302)
        row.refresh_from_db()
        self.assertNotEqual(row.webhook_token, old)
        self.assertTrue(row.webhook_token)
