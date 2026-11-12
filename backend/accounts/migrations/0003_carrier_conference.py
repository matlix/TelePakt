from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_voice_messages'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='conference_supported',
            field=models.BooleanField(blank=True, null=True, verbose_name='Operator wspiera 3-way'),
        ),
        migrations.AddField(
            model_name='profile',
            name='carrier_note',
            field=models.CharField(blank=True, max_length=120, verbose_name='Operator (z aplikacji)'),
        ),
        migrations.AddField(
            model_name='profile',
            name='carrier_checked_at',
            field=models.DateTimeField(blank=True, null=True, verbose_name='Sprawdzono'),
        ),
    ]
