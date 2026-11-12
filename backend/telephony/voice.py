"""Komunikaty głosowe użytkownika: katalog głosów, sytuacje, komunikaty domyślne, walidacja nagrania WAV.

Komunikat to krótki tekst (czytany głosem syntezatora) albo własne nagranie użytkownika, odtwarzane
rozmówcy przyciskiem (suwakiem) w nakładce. Odtwarzanie działa w rozmowie przechodzącej przez numer
TelePakt (po scaleniu 3-way) - patrz ``voice_views.message_speak``.
"""
import struct

#: Głosy Amazon Polly dostępne w TwiML ``<Say>`` dla języka polskiego (id, opis dla użytkownika).
VOICES = [
    ('Polly.Ola-Neural', 'Ola - kobieta, naturalny głos'),
    ('Polly.Maja', 'Maja - kobieta'),
    ('Polly.Ewa', 'Ewa - kobieta'),
    ('Polly.Jacek', 'Jacek - mężczyzna'),
    ('Polly.Jan', 'Jan - mężczyzna'),
]
DEFAULT_VOICE = 'Polly.Ola-Neural'
RATE_MIN, RATE_MAX, DEFAULT_RATE = 70, 140, 110

#: Sytuacje, do których przypisuje się komunikaty (klucz, nazwa).
SITUATIONS = [
    ('objection', 'Sprzeciw wobec marketingu (art. 398 PKE, RODO)'),
    ('short_refusal', 'Krótka odmowa'),
    ('identity', 'Podszywanie się pod bank lub instytucję'),
    ('b2b', 'Oferta dla firmy (B2B)'),
    ('debt', 'Windykacja'),
    ('custom', 'Własny komunikat'),
]
SITUATION_KEYS = {key for key, _label in SITUATIONS}

MAX_MESSAGES = 12
MAX_TITLE = 80
MAX_TEXT = 1000

#: Komunikaty tworzone przy pierwszym wejściu (bez zapowiedzi nagrywania i bez gróźb - zasady produktu).
DEFAULT_MESSAGES = [
    ('Sprzeciw wobec marketingu', 'objection',
     'Nie wyrażam zgody na kontakt marketingowy. Na podstawie artykułu 398 Prawa komunikacji elektronicznej '
     'żądam usunięcia mojego numeru z waszych baz.'),
    ('Krótka odmowa', 'short_refusal',
     'Nie jestem zainteresowany. Proszę usunąć mój numer z listy kontaktowej.'),
    ('Nie podaję danych przez telefon', 'identity',
     'Nie udzielam informacji przez telefon. Proszę o kontakt pisemny.'),
    ('Oferta dla firmy', 'b2b',
     'Nie wyrażam zgody na oferty handlowe na ten numer, także firmowe. Proszę usunąć numer z bazy.'),
]

#: Własne nagranie: WAV mono 16-bit PCM, do 60 s / 2 MB (tyle bezpiecznie mieści się w bazie).
MAX_AUDIO_BYTES = 2_000_000
MAX_AUDIO_SECONDS = 60


def parse_wav(data: bytes) -> dict:
    """Sprawdza nagranie WAV (PCM 16-bit mono) i zwraca ``{"rate": .., "seconds": ..}``.

    Rzuca ``ValueError`` z komunikatem po polsku. Dostawcy telefonii odtwarzają WAV PCM, ale nie
    odtwarzają formatów przeglądarkowych (webm/opus) - dlatego aplikacja konwertuje nagranie do WAV.
    """
    if len(data) > MAX_AUDIO_BYTES:
        raise ValueError('Nagranie jest za duże (maksymalnie 2 MB).')
    if len(data) < 44 or data[0:4] != b'RIFF' or data[8:12] != b'WAVE':
        raise ValueError('To nie jest plik WAV.')
    pos, fmt, data_size = 12, None, None
    while pos + 8 <= len(data):
        chunk_id = data[pos:pos + 4]
        size = struct.unpack('<I', data[pos + 4:pos + 8])[0]
        body = pos + 8
        if chunk_id == b'fmt ' and size >= 16:
            fmt = struct.unpack('<HHIIHH', data[body:body + 16])
        elif chunk_id == b'data':
            data_size = min(size, len(data) - body)
            break
        pos = body + size + (size & 1)
    if fmt is None or data_size is None:
        raise ValueError('Uszkodzony plik WAV.')
    audio_format, channels, rate, _byte_rate, _align, bits = fmt
    if audio_format != 1 or channels != 1 or bits != 16:
        raise ValueError('Nagranie musi być w formacie WAV: mono, 16-bit PCM.')
    if not 8000 <= rate <= 48000:
        raise ValueError('Nieobsługiwana częstotliwość próbkowania.')
    seconds = data_size / (rate * 2)
    if seconds < 0.5:
        raise ValueError('Nagranie jest za krótkie.')
    if seconds > MAX_AUDIO_SECONDS:
        raise ValueError('Nagranie jest za długie (maksymalnie 60 sekund).')
    return {'rate': rate, 'seconds': round(seconds, 1)}
