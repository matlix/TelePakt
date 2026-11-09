/**
 * Oficjalna dokumentacja prawna serwisu TelePakt.pl
 * Zawiera pełne treści: Regulamin, Polityka Prywatności (Zero-Storage),
 * Klauzula RODO oraz Oficjalna Instrukcja Obsługi.
 */

export const TERMS_OF_SERVICE_TEXT = `REGULAMIN ŚWIADCZENIA USŁUG DROGĄ ELEKTRONICZNĄ SERWISU I APLIKACJI TELEPAKT (telepakt.pl)
Wersja obowiązująca od: 10 listopada 2024 r. (zgodna z ustawą Prawo komunikacji elektronicznej)

§ 1. POSTANOWIENIA OGÓLNE
1. Niniejszy Regulamin określa zasady korzystania z aplikacji mobilnej i serwisu internetowego TelePakt (dalej: "Aplikacja" lub "Serwis"), dostępnego pod adresem https://telepakt.pl.
2. Usługodawcą jest operator platformy TelePakt (dalej: "Usługodawca").
3. Aplikacja służy do ochrony abonentów telekomunikacyjnych przed niechcianymi połączeniami bezpośrednimi (spam, telemarketing niezamówiony), realizacji uprawnień wynikających z art. 398 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE) oraz art. 17 i 21 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).
4. Warunkiem korzystania z Aplikacji jest zapoznanie się z niniejszym Regulaminem i akceptacja jego postanowień.

§ 2. ZASADA DZIAŁANIA I CHARAKTER USŁUGI
1. Aplikacja realizuje połączenia w architekturze telekonferencji (3-way call) lub przekierowania połączeń za pośrednictwem bezpiecznego węzła SIP/VoIP.
2. W trakcie trwania połączenia przychodzącego Użytkownik ma możliwość aktywowania modułu oświadczenia woli, który odtwarza uprawnioną formułę prawną sprzeciwu wobec marketingu bezpośredniego oraz żądania usunięcia danych osobowych (numeru telefonu) z bazy dzwoniącego.
3. Nagranie rozmowy realizowane jest na żądanie Użytkownika będącego stroną połączenia, na podstawie art. 308 ustawy z dnia 17 listopada 1964 r. – Kodeks postępowania cywilnego w celu zabezpieczenia materiału dowodowego na wypadek dochodzenia roszczeń lub złożenia zawiadomienia do Prezesa Urzędu Komunikacji Elektronicznej (UKE) lub Prezesa Urzędu Ochrony Danych Osobowych (UODO).

§ 3. PROCEDURA ZERO-STORAGE I PRYWATNOŚĆ
1. Usługodawca stosuje bezwzględną politykę Zero-Storage.
2. Nagranie rozmowy oraz protokół dowodowy są przekazywane bezpośrednio do pamięci urządzenia Użytkownika lub do wskazanej przez niego prywatnej chmury (Google Drive, iCloud, Dropbox, Nextcloud).
3. Żadne pliki audio ani treść rozmów nie są trwale zapisywane ani indeksowane na serwerach Usługodawcy. Po przesłaniu pliku do urządzenia dane w buforze węzła telekomunikacyjnego ulegają natychmiastowemu zniszczeniu (cyfrowy shredding).

§ 4. WARUNKI TECHNICZNE
1. Do prawidłowego działania Aplikacji wymagane jest:
   a) Posiadanie urządzenia z systemem Android (wersja 10.0+) lub iOS (wersja 15.0+);
   b) Aktywna karta SIM z włączoną przez operatora telekomunikacyjnego obsługą połączeń konferencyjnych (tzw. połączenia trójstronne / telekonferencja);
   c) Dostęp do sieci Internet (LTE/5G/Wi-Fi) na potrzeby synchronizacji statusu i pobierania nagrań.

§ 5. PŁATNOŚCI I SUBSKRYPCJE
1. Korzystanie z Aplikacji w wersji podstawowej (do 3 interwencji miesięcznie) jest bezpłatne.
2. Dostęp do pakietu PRO (nielimitowane interwencje, nagrania do pobrania, własny głos w formule, integracja z prywatną chmurą) realizowany jest wyłącznie za pośrednictwem oficjalnych sklepów z aplikacjami: Google Play Store, Apple App Store, Samsung Galaxy Store oraz Huawei AppGallery.
3. Opłaty są obsługiwane wyłącznie przez wybrany sklep z aplikacjami, zgodnie z jego regulaminem.
4. Konsument ma prawo odstąpić od umowy zawartej na odległość w terminie 14 dni bez podawania przyczyny, zgodnie z zasadami danego sklepu mobilnego.

§ 6. REKLAMACJE I KONTAKT
1. Wszelkie reklamacje dotyczące funkcjonowania Aplikacji można zgłaszać pod adresem: kontakt@telepakt.pl.
2. Usługodawca rozpatruje reklamację w terminie 14 dni od dnia jej otrzymania.`;

export const PRIVACY_POLICY_TEXT = `POLITYKA PRYWATNOŚCI I KLAUZULA OCHRONY DANYCH OSOBOWYCH (telepakt.pl)
Ochrona prywatności i procedura „Zero-Storage”
Wersja zaktualizowana: 2025 r.

1. ADMINISTRATOR DANYCH
Administratorem danych osobowych Użytkowników serwisu telepakt.pl oraz aplikacji TelePakt jest TelePakt Polska.
Kontakt w sprawach związanych z danymi i inspektor ochrony danych: iod@telepakt.pl / kontakt@telepakt.pl.

2. JAKIE DANE PRZETWARZAMY?
a) Dane konta Użytkownika: adres e-mail (w przypadku rejestracji w sklepach z aplikacjami), identyfikator subskrypcji;
b) Dane techniczne połączenia: data, godzina nawiązania połączenia, czas trwania, numer dzwoniący (caller ID) – wyłącznie w celach technicznej realizacji telekonferencji i wygenerowania metryki dowodowej;
c) Pliki audio z nagrań rozmów: przetwarzane wyłącznie w locie (in-transit) na bezpośrednie polecenie Użytkownika.

3. UNIKALNA PROCEDURA „ZERO-STORAGE” (BEZWZGLĘDNA PRYWATNOŚĆ)
Aplikacja TelePakt została zaprojektowana zgodnie z rygorystyczną zasadą Privacy by Design i Privacy by Default (art. 25 RODO):
- Po zakończeniu połączenia plik nagrania audio i protokół dowodowy trafiają bezpośrednio do pamięci telefonu Użytkownika lub na jego prywatną chmurę (Google Drive, iCloud, Dropbox).
- Serwery TelePakt w ogóle NIE przechowują nagrań użytkownika – dane w buforze węzła telekomunikacyjnego są natychmiast, bezpowrotnie niszczone (cyfrowy shredding) od razu po pomyślnym przesłaniu na telefon.
- Żaden pracownik, administrator ani podmiot trzeci nie ma i nie będzie miał wglądu do treści rozmów prowadzonych przez Użytkownika.

4. PODSTAWA PRAWNA PRZETWARZANIA
- Art. 6 ust. 1 lit. b RODO – niezbędność do wykonania umowy o świadczenie usługi telekomunikacyjnej;
- Art. 6 ust. 1 lit. f RODO – prawnie uzasadniony interes Administratora (ochrona przed nadużyciami, zapewnienie stabilności węzła);
- Motyw 18 RODO (Zwolnienie domowe): Zgodnie z motywem 18 RODO przetwarzanie danych przez osobę fizyczną w działalności czysto osobistej lub domowej (w tym nagranie rozmówcy naruszającego spokój i składającego nielegalne oferty handlowe) wyłączone jest spod rygorów nakładanych na administratorów komercyjnych.

5. ODBIORCY DANYCH
Dane telemetryczne połączeń przekazywane są wyłącznie licencjonowanym operatorom telekomunikacyjnym (SIP trunking providers) w minimalnym zakresie technicznym niezbędnym do zestawienia telekonferencji.

6. PRAWA UŻYTKOWNIKA
Użytkownik posiada prawo dostępu do swoich danych, ich sprostowania, żądania ich usunięcia („prawo do bycia zapomnianym”), ograniczenia przetwarzania oraz przenoszenia danych. Ponieważ TelePakt nie przechowuje nagrań, usunięcie nagrań leży w wyłącznej dyspozycji Użytkownika na jego urządzeniu.`;

export const RODO_CLAUSE_TEXT = `KLAUZULA INFORMACYJNA DLA ROZMÓWCÓW (ART. 13 i 14 RODO)
Podstawa prawna zgłoszenia naruszenia do Prezesa UODO oraz Prezesa UKE

Zgodnie z art. 13 ust. 1 i 2 oraz art. 14 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO):
1. Podmiot dzwoniący (agencja telemarketingowa / call center / przedsiębiorca zlecający kampanię) jest Administratorem Danych Osobowych w zakresie numeru telefonu abonenta, na który wykonano połączenie.
2. Zgodnie z art. 398 ust. 1 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE), używanie telekomunikacyjnych urządzeń końcowych i automatycznych systemów wywołujących dla celów marketingu bezpośredniego wymaga uprzedniej, wyraźnej zgody abonenta lub użytkownika końcowego.
3. Wobec braku uprzedniej zgody, przetwarzanie numeru telefonu nastąpiło bez podstawy prawnej z art. 6 ust. 1 RODO.
4. Złożenie przez abonenta oświadczenia za pośrednictwem systemu TelePakt stanowi:
   a) Bezwzględny sprzeciw wobec przetwarzania danych w celach marketingu bezpośredniego na podstawie art. 21 ust. 2 RODO (skutkujący natychmiastowym zakazem dalszego przetwarzania numeru w celach marketingowych);
   b) Żądanie niezwłocznego usunięcia danych ze wszystkich zbiorów danych i systemów CRM na podstawie art. 17 ust. 1 lit. d RODO;
   c) Wniosek o udzielenie informacji o źródle pozyskania danych na podstawie art. 15 ust. 1 lit. g RODO (w tym żądanie wskazania pełnej nazwy firmy, adresu siedziby i NIP).
5. Naruszenie powyższych praw stanowi podstawę do nałożenia administracyjnej kary pieniężnej przez Prezesa UODO (do 20 mln EUR lub 4% obrotu) oraz przez Prezesa UKE na podstawie art. 444 i 446 PKE (do 3% rocznego przychodu lub 1 000 000 PLN).`;

export const USER_MANUAL_TEXT = `OFICJALNA INSTRUKCJA UŻYTKOWANIA APLIKACJI TELEPAKT (telepakt.pl)
Przewodnik szybkiego startu dla sieci Play, Plus, Orange i T-Mobile

KROK 1: WŁĄCZENIE POŁĄCZEŃ TRÓJSTRONNYCH (TELEKONFERENCJI) U OPERATORA
Aplikacja TelePakt działa w architekturze bezpiecznej telekonferencji (3-way call). Większość polskich operatorów ma tę funkcję włączoną fabrycznie. W razie potrzeby:
• ORANGE: Włącz usługę w aplikacji „Mój Orange” lub wpisz kod: *110*00# i zatwierdź zieloną słuchawką.
• PLAY: Funkcja jest domyślnie aktywna na wszystkich kartach SIM (abonament i na kartę).
• PLUS: Aktywuj w aplikacji „iPlus” lub zadzwoń pod bezpłatny numer obsługi klienta.
• T-MOBILE: Aktywuj w aplikacji „Mój T-Mobile” w zakładce „Usługi dodatkowe -> Połączenia konferencyjne”.

KROK 2: ODEBRANIE POŁĄCZENIA OD TELEMARKETERA
1. Gdy dzwoni nieznany numer lub podejrzane call center, odbierz połączenie normalnie.
2. Gdy słyszysz, że to oferta handlowa (fotowoltaika, garnki, inwestycje, telekomunikacja), dotknij pływającego suwaka TelePakt na ekranie telefonu.
3. Wybierz odpowiednią formułę prawną (np. „Telemarketer – Pełny sprzeciw art. 398 PKE”). Możesz korzystać z profesjonalnego głosu lektora lub wcześniej nagranego własnego głosu.

KROK 3: AUTOMATYCZNA TELEKONFERENCJA I ODTWORZENIE FORMUŁY
• NA IPHONE: Telefon zadzwoni na Twój dedykowany numer chmurowy TelePakt. Na ekranie iPhone'a kliknij przycisk „Połącz rozmowy” (Scal połączenia).
• NA ANDROID: Jeśli TelePakt ma nadane uprawnienie asystenta, połączenie konferencyjne zostaje zestawione automatycznie w ułamku sekundy.
• System oficjalnym, stanowczym tonem wygłasza sprzeciw z art. 398 PKE, żąda podania NIP i adresu siedziby dzwoniącego oraz informuje o możliwości zgłoszenia sprawy do UKE.
• Jeśli włączyłeś opcję auto-rozłączenia, aplikacja sama zakończy połączenie.

KROK 4: NAGRANIE I ZASADA ZERO-STORAGE
• Po zakończeniu połączenia otrzymasz powiadomienie: „Rozmowa zabezpieczona”.
• Nagranie audio oraz gotowe pismo zawiadomienia do UKE/UODO trafiają wyłącznie do pamięci Twojego telefonu lub na Twoją prywatną chmurę (Google Drive, iCloud, Dropbox).
• Po pobraniu pliku jest on trwale usuwany z naszych serwerów i z serwera operatora telefonii. Niepobrane nagrania usuwamy automatycznie po 30 dniach.`;

export const COOKIES_POLICY_TEXT = `POLITYKA PLIKÓW COOKIES I PAMIĘCI LOKALNEJ (telepakt.pl)
Zgodna z art. 399 ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej (PKE)

1. CZYM SĄ PLIKI COOKIES I PAMIĘĆ LOKALNA (LOCALSTORAGE)?
Serwis telepakt.pl oraz aplikacja PWA wykorzystują technologie przechowywania danych na urządzeniu końcowym Użytkownika (pliki cookies, LocalStorage oraz IndexedDB).

2. DO CZEGO WYKORZYSTUJEMY PAMIĘĆ LOKALNĄ?
a) Działanie bazy antyspamowej w trybie offline (Zero-Storage):
   Lista numerów zgłoszonych przez Ciebie jako uciążliwe jest przechowywana w pamięci Twojego telefonu (localStorage), a sprawdzanie numeru odbywa się lokalnie, bez wysyłania go na serwery.
b) Utrzymanie sesji i preferencji użytkownika:
   Zapamiętanie wybranego głosu lektora, ustawień opóźnienia próbnego połączenia, akceptacji banera informacyjnego.

3. BRAK ZEWNĘTRZNYCH COOKIES ŚLEDZĄCYCH
Serwis telepakt.pl NIE wykorzystuje inwazyjnych ciasteczek reklamowych ani trackerów stron trzecich profilujących użytkowników w celach marketingowych.

4. ZARZĄDZANIE ZGODAMI
Użytkownik może w każdej chwili wyczyścić pamięć podręczną oraz pliki cookies w ustawieniach swojej przeglądarki internetowej lub odinstalować aplikację PWA.`;
