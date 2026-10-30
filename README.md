# TelePakt.pl 🛡️📞
**Polska Tarcza Anty-Spam, Ochrona Prawna (Art. 398 PKE & RODO) oraz Asystent Rozmów Telefonicznych**

[![CI Build & Test](https://github.com/matlix/telepakt/actions/workflows/ci.yml/badge.svg)](https://github.com/matlix/telepakt/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: Django 5](https://img.shields.io/badge/Backend-Django%205%20%2B%20DRF-092E20.svg)](https://www.djangoproject.com/)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Tailwind%204-61DAFB.svg)](https://vitejs.dev/)
[![Deployment: Render.com](https://img.shields.io/badge/Deployment-Render.com-46E3B7.svg)](https://render.com/)

Oficjalne repozytorium platformy **TelePakt.pl** – kompleksowego systemu ochrony konsumentów i firm przed niechcianym telemarketingiem, botami i natrętnymi call center w Polsce.

---

## 🚀 Spis Treści
1. [O projekcie](#-o-projekcie)
2. [Kluczowe Moduły i Architektura](#-kluczowe-moduły-i-architektura)
3. [Struktura Repozytorium](#-struktura-repozytorium)
4. [Instalacja i Uruchomienie Lokalne](#-instalacja-i-uruchomienie-lokalne)
5. [Wdrożenie na Render.com (Backend Django)](#-wdrożenie-na-rendercom-backend-django)
6. [Konfiguracja Domeny w Hostinger (telepakt.pl)](#-konfiguracja-domeny-w-hostinger-telepaktpl)
7. [In-App Purchases (Google Play & Apple App Store)](#-in-app-purchases-google-play--apple-app-store)
8. [Automatyzacja GitHub Actions](#-automatyzacja-github-actions)
9. [Instrukcja Wypchnięcia do GitHub (Krok po Kroku)](#-instrukcja-wypchnięcia-do-github)

---

## 📌 O projekcie

TelePakt.pl rozwiązuje problem setek tysięcy niechcianych telefonów generowanych przez roboty i agencje fotowoltaiczne, ubezpieczeniowe oraz medyczne:
- **Prawna Podstawa:** Wykorzystuje **Art. 398 nowej ustawy Prawo Komunikacji Elektronicznej (PKE)** oraz unijne rozporządzenie **RODO (GDPR)**.
- **Interaktywny Asystent Połączeń:** Gotowe scenariusze odgrywania komunikatów prawnych (żądań podania NIP, cofnięcia zgody, usunięcia danych osobowych).
- **Automatyczny generator pozwów i skarg do UKE / UODO:** Generuje gotowe do podpisu pisma PDF ze znacznikami czasu i transkrypcją.
- **Nagrania na Życzenie i Prywatność (Zero Retention):** Możliwość pobierania nagrań bezpośrednio na telefon lub chmurę użytkownika (Google Drive, Dropbox, OneDrive, WebDAV) z opcją natychmiastowego usunięcia z serwerów.
- **Moderacja Opinii Społeczności:** Baza nieuczciwych numerów z moderacją administratorską.

---

## 🏗 Kluczowe Moduły i Architektura

1. **Frontend (React 19, TypeScript, Tailwind CSS, Lucide Icons):**
   - Interaktywny symulator aplikacji mobilnej (Android / iOS)
   - Nowoczesny Landing Page i centrum wiedzy prawnej
   - Panel Administracyjny: zarządzanie subskrypcjami, moderacja recenzji, konfiguracja kluczy Twilio, Google Play i Apple App Store
   - Centrum Eksportu i Generator Paczek Projektowych
2. **Backend API (Python 3.12, Django 5, Django Rest Framework, Celery):**
   - Webhooki Twilio TwiML Voice & Recording
   - Walidacja paragonów zakupu z Google Play Developer API oraz Apple StoreKit 2
   - Zadania cykliczne usuwania nagrań (`retention_policy_cleanup`)
   - Pełny panel Django Admin (`/admin/`) z audytem RODO

---

## 📂 Struktura Repozytorium

```
telepakt/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Automatyczna walidacja kodu i testy
│       └── deploy-render.yml      # Automatyczny deploy webhookiem na Render.com
├── src/
│   ├── components/                # Komponenty UI (Symulator, Admin, Landing Page)
│   ├── data/                      # Baza wiedzy prawnej, konfiguracje, opinie
│   ├── types/                     # Definicje typów TypeScript
│   ├── App.tsx                    # Główny widok i routing zakładek
│   └── main.tsx                   # Entrypoint aplikacji React
├── .gitignore                     # Ignorowane pliki Node, Python i systemowe
├── push_to_github.sh              # Skrypt 1-klik do założenia i wysłania repozytorium
├── package.json                   # Zależności Node.js
├── vite.config.ts                 # Konfiguracja Vite
└── README.md                      # Dokumentacja projektu
```

---

## 💻 Instalacja i Uruchomienie Lokalne

### Wymagania:
- Node.js >= 18.0
- Python >= 3.11 (dla modułu Django)

### 1. Uruchomienie Aplikacji Frontendowej:
```bash
# Instalacja zależności
npm install

# Uruchomienie lokalnego serwera deweloperskiego
npm run dev
```
Aplikacja będzie dostępna pod adresem: `http://localhost:3000`

---

## ☁️ Wdrożenie na Render.com (Render Blueprint 1-Klik)

Projekt posiada gotowy plik **`render.yaml`** (Infrastructure as Code), który automatycznie powołuje bazę PostgreSQL, serwer Django oraz frontend:

1. Zaloguj się na [Render.com](https://render.com).
2. W prawym górnym rogu kliknij **New +** -> **Blueprint**.
3. Połącz repozytorium **`matlix/TelePakt`**.
4. Render odczyta `render.yaml` i automatycznie utworzy:
   - **`telepakt-web`**: Frontend React SPA (statyczna witryna na `telepakt.pl`)
   - **`telepakt-api`**: Backend Python Django z Gunicorn i WhiteNoise na `api.telepakt.pl`
   - **`telepakt-db`**: Zarządzana baza PostgreSQL
5. Kliknij **Apply** – wdrożenie ruszy automatycznie.

---

## 🌐 Konfiguracja Domeny w Hostinger (telepakt.pl)

W panelu Hostinger hPanel w zakładce **DNS / Serwery nazw** dla domeny `telepakt.pl` skonfiguruj poniższe rekordy:

| Typ | Nazwa (Host) | Wartość (Wskazuje na) | Rola |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `216.24.57.1` *(lub IP podany przez Render)* | Strona główna `https://telepakt.pl` |
| **CNAME** | `www` | `telepakt-web.onrender.com` | Subdomena `https://www.telepakt.pl` |
| **CNAME** | `api` | `telepakt-api.onrender.com` | Backend REST API i webhooki Twilio |

*Certyfikaty SSL (HTTPS) są generowane automatycznie przez Let's Encrypt po stronie Render w ciągu kilku minut od dodania rekordów.*

Szczegółowy przewodnik: zobacz plik [`HOSTINGER_AND_RENDER_DEPLOYMENT_GUIDE.md`](HOSTINGER_AND_RENDER_DEPLOYMENT_GUIDE.md).

---

## 💳 In-App Purchases (Google Play & Apple App Store)

Wszystkie płatności w aplikacji mobilnej są realizowane bezpośrednio przez **Google Play Billing** oraz **Apple StoreKit**.
- **Zaleta prawno-podatkowa:** Google i Apple są tzw. *Merchant of Record* – pobierają płatności, odprowadzają lokalny VAT i wypłacają środki netto raz w miesiącu. Nie ma konieczności wdrażania bramek typu Stripe/PayU dla aplikacji mobilnej.
- Backend Django weryfikuje tokeny zakupu przez endpoint `/api/purchases/verify/`.

---

## 🐙 Instrukcja Wypchnięcia do GitHub

### Opcja 1: Automatyczny skrypt (najszybszy)
W terminalu wpisz:
```bash
chmod +x push_to_github.sh
./push_to_github.sh
```

### Opcja 2: Narzędzie GitHub CLI (`gh`)
```bash
# Logowanie do GitHub (jeśli jeszcze nie wykonano)
gh auth login

# Utworzenie repozytorium publicznego i wypchnięcie kodu
gh repo create TelePakt --public --source=. --remote=origin --push
```

### Opcja 3: Standardowy Git (manualnie)
1. Utwórz nowe, puste repozytorium na [github.com/new](https://github.com/new) o nazwie np. `TelePakt`.
2. Wykonaj w terminalu:
```bash
git remote add origin https://github.com/TWOJA_NAZWA_UZYTKOWNIKA/TelePakt.git
git branch -M main
git push -u origin main
```

---

## 📄 Licencja & Prawa Autorskie
Projekt stworzony dla platformy **telepakt.pl**.  
Wszelkie prawa zastrzeżone © 2025 TelePakt.
