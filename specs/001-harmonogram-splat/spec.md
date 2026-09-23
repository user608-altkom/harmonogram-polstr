# Specyfikacja funkcji: Kalkulator harmonogramu spłat na POLSTR 1M i WIBOR 3M

**Gałąź funkcji**: `spec-mvp` (artefakty), implementacja w gałęziach `faza-<n>-<nazwa>`

**Utworzona**: 2026-09-23

**Status**: Zatwierdzona do planowania

**Wejście**: zgłoszenie z biznesu i zakres MVP z [BRIEF.md](../../BRIEF.md) (sekcje „Treść zgłoszenia”, „Zakres MVP”, „Ekran”, „Wydanie”, „Reguły”, „Liczba kontrolna”). Dopisek: liczba kontrolna z BRIEF.md jest kryterium akceptacji; ekran www to osobna, ostatnia historia użytkownika, jego wygląd powstaje jako komponent React.

## Kontekst

Od września 2026 banki oferują kredyty hipoteczne ze zmiennym oprocentowaniem opartym na POLSTR 1M zamiast WIBOR. Doradca w oddziale banku potrzebuje kalkulatora harmonogramu spłat, który obsłuży oba wskaźniki, raty równe i malejące oraz nadpłaty.

## Scenariusze użytkownika i testy *(obowiązkowe)*

### Historia 1: Harmonogram rat równych przy stałej stopie (Priorytet: P1) 🎯 MVP

Doradca podaje kwotę, liczbę rat, datę pierwszej raty, marżę i wskaźnik, wybiera raty równe i dostaje przez `GET /api/harmonogram` tabelę rat i sumę odsetek.

**Dlaczego ten priorytet**: to rdzeń kalkulatora i jedyny scenariusz z liczbą kontrolną; bez niego pozostałe historie nie mają na czym się oprzeć.

**Test niezależny**: test domeny ze stałą serią 3,55 % oraz zapytanie do API zwracające JSON.

**Scenariusze akceptacji**:

1. **Zakładając** kwotę 400 000 zł, 300 rat równych, stałą serię wskaźnika 3,55 % i marżę 2,11 pp, **gdy** liczę harmonogram, **wtedy** rata wynosi 2 494,72 zł (tolerancja ±0,05 zł), a ostatnia rata wyrównująca 2 492,53 zł.
2. **Zakładając** te same parametry, **gdy** sumuję części kapitałowe, **wtedy** suma równa się dokładnie 400 000,00 zł, a saldo po ostatniej racie wynosi 0.
3. **Zakładając** poprawne parametry w query string, **gdy** wołam `GET /api/harmonogram`, **wtedy** dostaję JSON z tabelą rat (numer, data, część kapitałowa, część odsetkowa, rata, saldo po spłacie) i sumą odsetek.
4. **Zakładając** brakujący lub błędny parametr, **gdy** wołam API, **wtedy** dostaję status 400 z opisem błędu i przykładem poprawnego zapytania.

---

### Historia 2: Zmienny wskaźnik z serii (Priorytet: P2)

Oprocentowanie okresu to wartość wskaźnika z serii plus marża. POLSTR 1M zmienia się co miesiąc w dniu raty, WIBOR 3M co kwartał. Po zmianie stopy rata równa jest przeliczana.

**Dlaczego ten priorytet**: kredyt ma zmienne oprocentowanie; bez tej historii kalkulator liczy tylko przypadek szczególny.

**Test niezależny**: test domeny z serią o dwóch wartościach i porównanie momentu zmiany dla POLSTR 1M i WIBOR 3M.

**Scenariusze akceptacji**:

1. **Zakładając** serię, której wartość zmienia się w trakcie spłaty, **gdy** liczę harmonogram POLSTR 1M, **wtedy** od pierwszej raty, której data przypada w dniu zmiany lub później, obowiązuje nowa stopa, a rata równa jest przeliczona od salda i liczby pozostałych rat.
2. **Zakładając** tę samą serię, **gdy** liczę harmonogram WIBOR 3M, **wtedy** stopa zmienia się tylko w ratach 1, 4, 7, … (początek kwartału liczony od pierwszej raty) i obowiązuje przez 3 raty.
3. **Zakładając** raty wychodzące poza ostatni wpis serii, **gdy** liczę harmonogram, **wtedy** obowiązuje ostatnia znana wartość wskaźnika.

---

### Historia 3: Raty malejące (Priorytet: P3)

Doradca wybiera raty malejące: część kapitałowa jest stała, odsetki i rata maleją.

**Dlaczego ten priorytet**: drugi typ rat z zakresu MVP, mniej popularny niż raty równe.

**Test niezależny**: test domeny z ratami malejącymi przy stałej stopie.

**Scenariusze akceptacji**:

1. **Zakładając** 400 000 zł, 300 rat malejących i stałą stopę 5,66 %, **gdy** liczę harmonogram, **wtedy** część kapitałowa każdej raty poza ostatnią wynosi 1 333,33 zł, pierwsza rata 3 220,00 zł, a każda kolejna rata jest nie większa od poprzedniej.
2. **Zakładając** te same parametry, **gdy** sumuję części kapitałowe, **wtedy** suma równa się dokładnie kwocie kredytu (ostatnia rata wyrównuje).

---

### Historia 4: Nadpłaty (Priorytet: P4)

Doradca dodaje listę nadpłat: miesiąc (numer raty), kwota, tryb „obniż ratę” albo „skróć okres”.

**Dlaczego ten priorytet**: rozszerza wynik o scenariusz, o który klienci pytają najczęściej, ale wymaga działającego harmonogramu.

**Test niezależny**: testy domeny obu trybów przy ratach równych i malejących.

**Scenariusze akceptacji**:

1. **Zakładając** nadpłatę po racie *m* w trybie „obniż ratę”, **gdy** liczę harmonogram, **wtedy** liczba rat się nie zmienia, a rata od *m*+1 jest niższa niż bez nadpłaty.
2. **Zakładając** nadpłatę po racie *m* w trybie „skróć okres”, **gdy** liczę harmonogram, **wtedy** rata (przy ratach malejących część kapitałowa) się nie zmienia, a harmonogram ma mniej rat.
3. **Zakładając** dowolne nadpłaty, **gdy** sumuję części kapitałowe i nadpłaty, **wtedy** suma równa się kwocie kredytu, a suma odsetek jest mniejsza niż bez nadpłat.
4. **Zakładając** nadpłatę większą niż saldo po racie *m*, **gdy** liczę harmonogram, **wtedy** dostaję błąd walidacji (w API status 400).

---

### Historia 5: Ekran www (Priorytet: P5)

Doradca wypełnia formularz w przeglądarce, klika „Policz” i widzi ratę pierwszą i ostatnią, sumę odsetek, tabelę rat oraz może pobrać CSV.

**Dlaczego ten priorytet**: ostatnia historia; wygląd powstaje jako komponent React, a logika jest już gotowa w API.

**Test niezależny**: ręcznie w przeglądarce na liczbie kontrolnej, lokalnie i na adresie Vercel.

**Scenariusze akceptacji**:

1. **Zakładając** formularz z parametrami liczby kontrolnej i wskaźnikiem POLSTR 1M, **gdy** klikam „Policz”, **wtedy** widzę ratę pierwszą, ratę ostatnią, sumę odsetek i tabelę 300 rat.
2. **Zakładając** policzony harmonogram, **gdy** klikam „Eksport CSV”, **wtedy** przeglądarka pobiera plik CSV z tabelą rat, zbudowany bez udziału serwera.
3. **Zakładając** błędne parametry, **gdy** klikam „Policz”, **wtedy** widzę komunikat błędu z API.

### Przypadki brzegowe

- Data pierwszej raty w dniu 29–31: kolejne raty przypadają na ten sam dzień miesiąca, a w krótszym miesiącu na jego ostatni dzień.
- Data raty przed pierwszym wpisem serii: błąd walidacji z komunikatem.
- Data raty dokładnie w dniu wpisu serii: obowiązuje nowy wpis; dzień wcześniej obowiązuje poprzedni.
- Jedna rata: cała kwota i odsetki w jednej racie.
- Nadpłata spłacająca całe saldo: harmonogram kończy się na racie *m*.
- Kilka nadpłat po tej samej racie: stosowane po kolei.
- Nadpłata po ostatniej racie albo o numerze spoza zakresu: błąd walidacji.

## Wymagania *(obowiązkowe)*

### Wymagania funkcjonalne

- **FR-001**: System MUSI przyjmować kwotę kredytu, liczbę rat, datę pierwszej raty (YYYY-MM-DD), marżę w punktach procentowych, typ rat (równe albo malejące), wskaźnik (POLSTR 1M albo WIBOR 3M) i listę nadpłat (numer raty, kwota, tryb).
- **FR-002**: Oprocentowanie roczne okresu MUSI być równe wartości wskaźnika plus marża.
- **FR-003**: Dla POLSTR 1M stopa raty *n* MUSI być wartością serii obowiązującą w dniu raty *n*; dla WIBOR 3M wartością obowiązującą w dniu raty 1, 4, 7, … otwierającej kwartał, do którego należy rata *n*.
- **FR-004**: Wpis serii MUSI obowiązywać od dnia `od` do dnia przed kolejnym wpisem; po ostatnim wpisie obowiązuje ostatnia znana wartość.
- **FR-005**: Odsetki za okres MUSZĄ być liczone jako saldo × stopa roczna / 12 (odsetki proste, bez kapitalizacji w ramach miesiąca).
- **FR-006**: Kwoty MUSZĄ być liczone w groszach i zaokrąglane do grosza w jednym miejscu.
- **FR-007**: Ostatnia rata MUSI wyrównywać tak, aby suma części kapitałowych i nadpłat była równa kwocie kredytu.
- **FR-008**: Rata równa MUSI być przeliczana annuitetowo od salda i liczby pozostałych rat przy zmianie stopy i po nadpłacie w trybie „obniż ratę”.
- **FR-009**: Rata malejąca MUSI mieć stałą część kapitałową równą kwocie podzielonej przez liczbę rat, przeliczaną od salda i liczby pozostałych rat po nadpłacie w trybie „obniż ratę”.
- **FR-010**: Nadpłata po racie *m* MUSI zmniejszać saldo przed ratą *m*+1; tryb „skróć okres” zachowuje ratę (część kapitałową przy ratach malejących) i skraca harmonogram.
- **FR-011**: `GET /api/harmonogram` MUSI przyjmować parametry w query string i zwracać JSON z tabelą rat (numer, data, część kapitałowa, część odsetkowa, rata, nadpłata, saldo po spłacie, stopa) i sumą odsetek; błędy wejścia to status 400 z polem `blad`.
- **FR-012**: Ekran w `app/page.tsx` MUSI mieć formularz parametrów, przycisk „Policz”, ratę pierwszą i ostatnią, sumę odsetek, tabelę rat i eksport CSV po stronie przeglądarki.
- **FR-013**: Obliczenia MUSZĄ być w module domenowym `src/domena/`; route handler tylko parsuje parametry i woła domenę.

### Kluczowe encje

- **Parametry kredytu**: kwota, liczba rat, data pierwszej raty, marża, typ rat, wskaźnik, nadpłaty.
- **Wpis serii wskaźnika**: data `od` i stopa jako ułamek.
- **Nadpłata**: numer raty, po której następuje, kwota, tryb.
- **Rata**: numer, data, część kapitałowa, część odsetkowa, rata, nadpłata, saldo po spłacie, stopa roczna.
- **Harmonogram**: lista rat, suma odsetek, rata pierwsza, rata ostatnia.

## Kryteria sukcesu *(obowiązkowe)*

### Mierzalne wyniki

- **SC-001**: Dla liczby kontrolnej z BRIEF.md rata równa wynosi 2 494,72 zł ±0,05 zł, a ostatnia rata 2 492,53 zł.
- **SC-002**: W każdym scenariuszu testowym suma części kapitałowych i nadpłat równa się kwocie kredytu co do grosza.
- **SC-003**: Pięć testów z minimalnego zestawu BRIEF.md przechodzi w vitest lokalnie i w GitHub Actions.
- **SC-004**: Adres produkcyjny Vercel pokazuje ekran, który dla parametrów liczby kontrolnej zwraca wynik w czasie poniżej 2 sekund.
- **SC-005**: Doradca uzyskuje harmonogram i plik CSV w nie więcej niż 3 krokach: wypełnienie formularza, „Policz”, „Eksport CSV”.

## Założenia

- Wartość wskaźnika na okres bierzemy wprost z danych; nie składamy dziennych stawek POLSTR wstecz (świadome uproszczenie MVP).
- Wartości w `dane/*.json` są ilustracyjne i nie są edytowane.
- Użytkownikiem jest doradca w oddziale, ekran po polsku, bez logowania.
- Brak rekompensaty za nadpłatę, okresowo stałej stopy i RRSO (gwiazdki po MVP).
- Parametr nadpłat w query string ma postać `nadplaty=12:10000:obniz,24:5000:skroc` (numer raty:kwota w zł:tryb).
