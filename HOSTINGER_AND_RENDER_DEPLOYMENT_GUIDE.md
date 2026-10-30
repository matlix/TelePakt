# Kompleksowy Przewodnik Wdrożenia TelePakt.pl
**Render Blueprint + Konfiguracja Domeny telepakt.pl w Hostinger**

Ten przewodnik przeprowadzi Cię przez proces wdrożenia aplikacji **TelePakt.pl** na platformę chmurową **Render.com** za pomocą pliku Blueprint (`render.yaml`) oraz podpięcia własnej domeny **telepakt.pl** zakupionej w **Hostinger.com**.

---

## 🏗 Architektura Wdrożenia na Render.com

Plik `render.yaml` w głównym katalogu automatycznie definiuje i uruchamia 3 usługi:

1. **`telepakt-web` (Frontend - Static Site):**
   - React 19 + TypeScript + Tailwind CSS
   - Podpięty pod: `https://telepakt.pl` oraz `https://www.telepakt.pl`
2. **`telepakt-api` (Backend - Python 3.11 / Django 5 / Gunicorn):**
   - Webhooki Twilio TwiML Voice, walidacja Google Play/Apple StoreKit, API recenzji i audyt RODO
   - Podpięty pod: `https://api.telepakt.pl`
3. **`telepakt-db` (Zarządzana Baza Danych PostgreSQL):**
   - Bezpieczne przechowywanie rejestru połączeń dowodowych, sum kontrolnych SHA-256 oraz wniosków do Prezesa UKE.

---

## 🚀 KROK 1: Uruchomienie Blueプリント na Render.com (1-Klik)

1. Wejdź na [https://dashboard.render.com](https://dashboard.render.com) i zaloguj się.
2. W prawym górnym rogu kliknij niebieski przycisk **New +** i wybierz **Blueprint**.
3. Połącz swoje konto GitHub i wskaż repozytorium **`matlix/TelePakt`**.
4. Render automatycznie wykryje plik `render.yaml` w repozytorium i wyświetli plan wdrożenia:
   - Web Service: `telepakt-web` (Frontend)
   - Web Service: `telepakt-api` (Django Backend)
   - PostgreSQL: `telepakt-db`
5. Kliknij **Apply** (lub **Approve**).
6. Render automatycznie zainstaluje pakiety, zbuduje frontend, wykona migracje Django i uruchomi obie usługi oraz bazę danych w regionie **Frankfurt** (najniższe opóźnienia telekomunikacyjne dla Polski).

---

## 🌐 KROK 2: Konfiguracja Domeny telepakt.pl w Hostinger.com

Masz wykupioną domenę **`telepakt.pl`** w **Hostinger**. Aby ruch kierował się na Twoje serwery:

### A. Pobranie adresów z Render.com:
1. Po wdrożeniu wejdź w usługę **`telepakt-web`** -> **Settings** -> sekcja **Custom Domains**.
2. Kliknij **Add Custom Domain** i dodaj:
   - `telepakt.pl`
   - `www.telepakt.pl`
   *(Render wyświetli dedykowany adres IP dla rekordu A, np. `216.24.57.1`, oraz alias CNAME)*
3. Wejdź w usługę **`telepakt-api`** -> **Settings** -> **Custom Domains**:
   - Dodaj: `api.telepakt.pl`
   *(Render wyświetli CNAME, np. `telepakt-api.onrender.com`)*

---

### B. Konfiguracja Rekordów DNS w Hostinger hPanel:
1. Zaloguj się na [https://hpanel.hostinger.com](https://hpanel.hostinger.com).
2. W menu głównym przejdź do: **Domeny (Domains)** -> kliknij **Zarządzaj (Manage)** przy **telepakt.pl**.
3. W menu bocznym po lewej kliknij **DNS / Serwery nazw (DNS / Nameservers)**.
4. W sekcji **Zarządzaj rekordami DNS** dodaj lub zaktualizuj poniższe 3 wpisy:

| Typ (Type) | Nazwa / Host (Name) | Wskazuje na (Points to / Value) | TTL | Rola rekordu |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` | `216.24.57.1` *(lub IP podany przez Render)* | `3600` | Główna strona `https://telepakt.pl` |
| **CNAME** | `www` | `telepakt-web.onrender.com` | `3600` | Przekierowanie `www.telepakt.pl` |
| **CNAME** | `api` | `telepakt-api.onrender.com` | `3600` | Backend API `https://api.telepakt.pl` |

*(Uwaga: Jeśli na liście w Hostinger istnieją domyślne rekordy typu A dla `@` lub CNAME dla `www`, usuń je lub zedytuj na powyższe wartości).*

---

## 🔒 KROK 3: Automatyczny Certyfikat SSL / HTTPS

Zarówno Render, jak i Hostinger obsługują Let's Encrypt:
- Po zapisaniu rekordów DNS w Hostinger odczekaj od 5 do 30 minut na propagację DNS w sieci.
- Render automatycznie wykryje poprawność wpisów DNS i **wygeneruje bezpłatny certyfikat SSL (HTTPS)** dla domen:
  - `https://telepakt.pl`
  - `https://www.telepakt.pl`
  - `https://api.telepakt.pl`

---

## 🔑 KROK 4: Zmienne Środowiskowe w Render Dashboard (Opcjonalnie)

W panelu Render dla usługi **`telepakt-api`** w zakładce **Environment** możesz w każdej chwili uzupełnić dane produkcyjne:
- `TWILIO_ACCOUNT_SID` – Twój SID konta Twilio (do dzwonienia i odtwarzania formuł)
- `TWILIO_AUTH_TOKEN` – Twój token Twilio
- `TWILIO_PHONE_NUMBER` – Twój polski numer stacjonarny lub komórkowy kupiony w Twilio (np. `+48221234567`)

Gotowe! Twoja platforma TelePakt.pl działa w pełnej chmurze na własnej domenie z automatycznym skalowaniem.
