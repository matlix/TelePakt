from django.db import migrations, models

# Dawne teksty domyślne (z powitaniem i pożegnaniem) -> krótsze. Zmieniamy tylko komunikaty, których użytkownik
# nie edytował (tekst identyczny z dawnym domyślnym); własne teksty zostają bez zmian.
OLD_TO_NEW = {
    ('Dzień dobry. Nie wyraziłem zgody na kontakt marketingowy. Na podstawie artykułu 398 Prawa komunikacji '
     'elektronicznej oraz artykułu 21 RODO wnoszę sprzeciw i żądam usunięcia mojego numeru z Państwa baz. '
     'Proszę o informację, skąd mają Państwo mój numer. Do widzenia.'):
        ('Nie wyrażam zgody na kontakt marketingowy. Na podstawie artykułu 398 Prawa komunikacji elektronicznej '
         'żądam usunięcia mojego numeru z waszych baz.'),
    ('Nie jestem zainteresowany i nie zgadzam się na kontakt marketingowy. Proszę trwale usunąć mój numer '
     'z listy kontaktowej. Do widzenia.'):
        'Nie jestem zainteresowany. Proszę usunąć mój numer z listy kontaktowej.',
    ('Nie udzielam żadnych informacji przez telefon. Jeśli reprezentują Państwo instytucję, proszę o kontakt '
     'pisemny na adres, który mają Państwo w dokumentach. Do widzenia.'):
        'Nie udzielam informacji przez telefon. Proszę o kontakt pisemny.',
    ('Nie wyrażam zgody na przesyłanie ofert handlowych na ten numer, również w związku z prowadzoną '
     'działalnością. Proszę o usunięcie numeru z bazy. Do widzenia.'):
        'Nie wyrażam zgody na oferty handlowe na ten numer, także firmowe. Proszę usunąć numer z bazy.',
}


def shorten_defaults(apps, schema_editor):
    VoiceMessage = apps.get_model('telephony', 'VoiceMessage')
    for old, new in OLD_TO_NEW.items():
        VoiceMessage.objects.filter(text=old).update(text=new)


class Migration(migrations.Migration):

    dependencies = [
        ('telephony', '0005_voice_messages'),
    ]

    operations = [
        migrations.AddField(
            model_name='voicemessage',
            name='use_recording',
            field=models.BooleanField(default=True, verbose_name='Używaj własnego nagrania'),
        ),
        migrations.RunPython(shorten_defaults, migrations.RunPython.noop),
    ]
