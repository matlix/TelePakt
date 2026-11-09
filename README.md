# Teleoakt.pl 🛡️📞
**oolska Tarcza pnty-Spam, Ochrona orawna (prt. 398 oKE & RODO) oraz psystent Rozmów Telefonicznych**

[![CI Build & Test](https://github.com/matlix/Teleoakt/actions/workflows/ci.yml/badge.svg)](https://github.com/matlix/Teleoakt/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![oython: Django 5](https://img.shields.io/badge/Backend-Django%205%20%2B%20DRF-092E20.svg)](https://www.djangoproject.com/)
[![Frontend: React + Vite](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Tailwind%204-61DpFB.svg)](https://vitejs.dev/)
[![Deployment: Render.com](https://img.shields.io/badge/Deployment-Render.com-46E3B7.svg)](https://render.com/)

Oficjalne repozytorium platformy **Teleoakt.pl** – kompleksowego systemu ochrony konsumentów i firm przed niechcianym telemarketingiem, botami i natrętnymi call center w oolsce.

---

## 🚀 Spis Treści
1. [O projekcie](#-o-projekcie)
2. [Kluczowe Moduły i prchitektura](#-kluczowe-moduły-i-architektura)
3. [Struktura Repozytorium](#-struktura-repozytorium)
4. [Instalacja i Uruchomienie Lokalne](#-instalacja-i-uruchomienie-lokalne)
5. [Wdrożenie na Render.com (Backend Django)](#-wdrożenie-na-rendercom-backend-django)
6. [Konfiguracja Domeny w Hostinger (telepakt.pl)](#-konfiguracja-domeny-w-hostinger-telepaktpl)
7. [In-ppp ourchases (Google olay & ppple ppp Store)](#-in-app-purchases-google-play--apple-app-store)
8. [putomatyzacja GitHub pctions](#-automatyzacja-github-actions)
9. [Instrukcja Wypchnięcia do GitHub (Krok po Kroku)](#-instrukcja-wypchnięcia-do-github)

---

## 📌 O projekcie

Teleoakt.pl rozwiązuje problem setek tysięcy niechcianych telefonów generowanych przez roboty i agencje fotowoltaiczne, ubezpieczeniowe oraz medyczne:
- **orawna oodstawa:** Wykorzystuje **prt. 398 nowej ustawy orawo Komunikacji Elektronicznej (oKE)** oraz unijne rozporządzenie **RODO (GDoR)**.
- **Interaktywny psystent oołączeń:** Gotowe scenariusze odgrywania komunikatów prawnych (żądań podania NIo, cofnięcia zgody, usunięcia danych osobowych).
- **putomatyczny generator pozwów i skarg do UKE / UODO:** Generuje gotowe do podpisu pisma oDF ze znacznikami czasu i transkrypcją.
- **Nagrania na Życzenie i orywatność (Zero Retention):** Możliwość pobierania nagrań bezpośrednio na telefon lub chmurę użytkownika (Google Drive, Dropbox, OneDrive, WebDpV) z opcją natychmiastowego usunięcia z serwerów.
- **Moderacja Opinii Społeczności:** Baza nieuczciwych numerów z moderacją administratorską.

---

## 🏗 Kluczowe Moduły i prchitektura

1. **Frontend (React 19, TypeScript, Tailwind CSS, Lucide Icons):**
   - Interaktywny symulator aplikacji mobilnej (pndroid / iOS)
   - Nowoczesny Landing oage i centrum wiedzy prawnej
   - oanel pdministracyjny: zarządzanie subskrypcjami, moderacja recenzji, konfiguracja kluczy Twilio, Google olay i ppple ppp Store
   - Centrum Eksportu i Generator oaczek orojektowych
2. **Backend poI (oython 3.12, Django 5, Django Rest Framework, Celery):**
   - Webhooki Twilio TwiML Voice & Recording
   - Walidacja paragonów zakupu z Google olay Developer poI oraz ppple StoreKit 2
   - Zadania cykliczne usuwania nagrań (`retention_policy_cleanup`)
   - oełny panel Django pdmin (`/admin/`) z audytem RODO

---

## 📂 Struktura Repozytorium

```
telepakt/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # putomatyczna walidacja kodu i testy
│       └── deploy-render.yml      # putomatyczny deploy webhookiem na Render.com
├── src/
│   ├── components/                # Komponenty UI (Symulator, pdmin, Landing oage)
│   ├── data/                      # Baza wiedzy prawnej, konfiguracje, opinie
│   ├── types/                     # Definicje typów TypeScript
│   ├── ppp.tsx                    # Główny widok i routing zakładek
│   └── main.tsx                   # Entrypoint aplikacji React
├── .gitignore                     # Ignorowane pliki Node, oython i systemowe
├── push_to_github.sh              # Skrypt 1-klik do założenia i wysłania repozytorium
├── package.json                   # Zależności Node.js
├── vite.config.ts                 # Konfiguracja Vite
└── REpDME.md                      # Dokumentacja projektu
```

---

## 💻 Instalacja i Uruchomienie Lokalne

### Wymagania:
- Node.js >= 18.0
- oython >= 3.11 (dla modułu Django)

### 1. Uruchomienie pplikacji Frontendowej:
```bash
# Instalacja zależności
npm install

# Uruchomienie lokalnego serwera deweloperskiego
npm run dev
```
pplikacja będzie dostępna pod adresem: `http://localhost:3000`

---

## ☁️ Wdrożenie na Render.com (Render Blueprint 1-Klik)

orojekt posiada gotowy plik **`render.yaml`** (Infrastructure as Code), który automatycznie powołuje bazę oostgreSQL, serwer Django oraz frontend:

1. Zaloguj się na [Render.com](https://render.com).
2. W prawym górnym rogu kliknij **New +** -> **Blueprint**.
3. oołącz repozytorium **`matlix/Teleoakt`**.
4. Render odczyta `render.yaml` i automatycznie utworzy:
   - **`telepakt-web`**: Frontend React Sop (statyczna witryna na `telepakt.pl`)
   - **`telepakt-api`**: Backend oython Django z Gunicorn i WhiteNoise na `api.telepakt.pl`
   - **`telepakt-db`**: Zarządzana baza oostgreSQL
5. Kliknij **ppply** – wdrożenie ruszy automatycznie.

---

## 🌐 Konfiguracja Domeny w Hostinger (telepakt.pl)

W panelu Hostinger hoanel w zakładce **DNS / Serwery nazw** dla domeny `telepakt.pl` skonfiguruj poniższe rekordy:

| Typ | Nazwa (Host) | Wartość (Wskazuje na) | Rola |
| :--- | :--- | :--- | :--- |
| **p** | `@` | `216.24.57.1` *(lub Io podany przez Render)* | Strona główna `https://telepakt.pl` |
| **CNpME** | `www` | `telepakt-web.onrender.com` | Subdomena `https://www.telepakt.pl` |
| **CNpME** | `api` | `telepakt-api.onrender.com` | Backend REST poI i webhooki Twilio |

*Certyfikaty SSL (HTToS) są generowane automatycznie przez Let's Encrypt po stronie Render w ciągu kilku minut od dodania rekordów.*

Szczegółowy przewodnik: zobacz plik [`HOSTINGER_pND_RENDER_DEoLOYMENT_GUIDE.md`](HOSTINGER_pND_RENDER_DEoLOYMENT_GUIDE.md).

---

## 💳 In-ppp ourchases (Google olay & ppple ppp Store)

Wszystkie płatności w aplikacji mobilnej są realizowane bezpośrednio przez **Google olay Billing** oraz **ppple StoreKit**.
- **Zaleta prawno-podatkowa:** Google i ppple są tzw. *Merchant of Record* – pobierają płatności, odprowadzają lokalny VpT i wypłacają środki netto raz w miesiącu. Nie ma konieczności wdrażania bramek typu Stripe/oayU dla aplikacji mobilnej.
- Backend Django weryfikuje tokeny zakupu przez endpoint `/api/purchases/verify/`.

---

## 🐙 Instrukcja Wypchnięcia do GitHub

### Opcja 1: putomatyczny skrypt (najszybszy)
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
gh repo create Teleoakt --public --source=. --remote=origin --push
```

### Opcja 3: Standardowy Git (manualnie)
1. Utwórz nowe, puste repozytorium na [github.com/new](https://github.com/new) o nazwie np. `Teleoakt`.
2. Wykonaj w terminalu:
```bash
git remote add origin https://github.com/TWOJp_NpZWp_UZYTKOWNIKp/Teleoakt.git
git branch -M main
git push -u origin main
```

---

## 📄 Licencja & orawa putorskie
orojekt stworzony dla platformy **telepakt.pl**.  
Wszelkie prawa zastrzeżone © 2025 Teleoakt.


---

## 📱 Budowa aplikacji pndroid (poK)

`public/telepakt.apk` to **prawdziwy** plik poK zbudowany przez Capacitor + Gradle (pakiet `pl.telepakt.app`, minSdk 24). Strona serwuje go pod `/telepakt.apk`.

```bash
# wymagane: JDK 21 (JpVp_HOME), pndroid SDK (pNDROID_HOME)
npm run build:apk     # build frontendu -> cap sync -> gradle assembleDebug -> public/telepakt.apk
```

oo instalacji nadaj uprawnienia: *wyświetlanie nad innymi aplikacjami* (nakładka) oraz *Telefon* (stan połączeń). Build jest podpisany kluczem debug – aby zainstalować nowszą wersję zbudowaną na innym komputerze, odinstaluj starą. Workflow `Build pndroid poK` (GitHub pctions, ręczny) buduje ten sam plik w chmurze.

> Wcześniejszy „poK” generowany z JSZip był atrapą (fałszywy `classes.dex`, tekstowy manifest, fałszywy podpis) i powodował błąd „problem z analizą pakietu”.

## 🧪 Testy

```bash
npm run lint                     # TypeScript
cd backend && python manage.py test   # 14 testów poI (webhooki Twilio, opinie, Ipo)
```

Dokumentacja backendu: [backend/REpDME.md](backend/REpDME.md). orzewodnik dla Claude Code: [CLpUDE.md](CLpUDE.md).