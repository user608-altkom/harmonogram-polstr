# Plan realizacji: Harmonogram na POLSTR (metodyka spec-kit)

Plan przygotowany na podstawie README.md, BRIEF.md, KARTA.md, AGENTS.md i `.github/instructions/review.instructions.md`. To jest plan, nic z niego nie zostało jeszcze wykonane. Artefakty spec-kit (`constitution.md`, `spec.md`, `plan.md`, `tasks.md`) powstaną z komend `/speckit-*` w czacie Copilota według kroków poniżej.

## 0. Stan wyjściowy

| Element | Stan |
| --- | --- |
| Repo GitHub | `user608-altkom/harmonogram-polstr` (prywatne), gałąź `main`, jeden commit |
| Spec-kit | zainicjalizowany, `.specify/memory/constitution.md` to pusty szablon |
| Domena | `policzHarmonogram()` rzuca „nie zaimplementowano” |
| API | `GET /api/harmonogram` parsuje parametry (bez nadpłat), zwraca 501 |
| Ekran | `app/page.tsx` to zaślepka |
| Testy | `tests/smoke.test.ts`: dane są uporządkowane, domena rzuca błąd, strefa czasowa Europe/Warsaw |
| Liczba kontrolna | sprawdzona na brudno: konwencja z BRIEF daje ratę 2 494,72 zł i ostatnią ratę 2 492,53 zł, więc jest spójna |

## 1. Oś czasu i bramki

| Godzina | Etap | Bramka |
| --- | --- | --- |
| do 12:10 | przygotowanie: `npm install`, testy, Vercel, Copilot jako recenzent | Bramka 0 |
| 12:10 do 14:00 | constitution, specify, (clarify), plan, tasks, (analyze), PR #1 | Bramka 1 |
| 14:00 do 15:00 | implementacja faza po fazie, każda faza w osobnym PR; równolegle ekran w Claude Design | Bramka 2, tag `v0.1.0` |
| 15:00 do 15:45 | karta zmiany: test, poprawka, PR, review, scalenie | Bramka 3, tag `v0.2.0`, mail |

Godziny to terminy końcowe, nie godziny startu. Każdy etap i każdą fazę można zacząć i zakończyć wcześniej, gdy poprzedni etap jest scalony, a jego bramka spełniona. Na przykład PR #1 może powstać przed 14:00, implementacja może ruszyć zaraz po jego scaleniu, a ekran w Claude Design można zaprojektować przed 14:00. Kolejności etapów i zasady „PR i review przed kolejną fazą” to nie zmienia. Czas zaoszczędzony przed 15:00 idzie najpierw na pełny zakres MVP (US2 do US4), a potem na gwiazdki z KARTA.md.

Zasada awaryjna: jeśli o 14:45 testy nie są zielone, zakres spada do rat równych bez nadpłat, a ekran i tak jest podpinany.

## 2. Etap przygotowania (Bramka 0)

1. `npm install`, `npm test`, `npm run typecheck`, `npm run dev`; sprawdzić `/api/harmonogram` (oczekiwane 501).
2. `gh run list`: workflow „Testy” zielony.
3. Vercel: „Continue with GitHub”, import `harmonogram-polstr`, deploy, zanotować adres produkcyjny.
4. Sprawdzić, czy Copilot jest na liście Reviewers; jeśli nie, zostaje rutyna `skrypty/review-pr.ps1`.
5. `git switch -c spec-mvp`.

## 3. `/speckit-constitution`

Wynik: `.specify/memory/constitution.md` (wersja 1.0.0). Proponowane zasady, każda sprawdzalna w review:

1. **Domena czysta i odizolowana.** Cała logika w `src/domena/`: czyste funkcje bez React, bez I/O, bez `Date.now()`, bez `console.log`. Seria wskaźnika trafia do domeny jako argument, nie jako import.
2. **Cienki route handler.** `app/api/harmonogram/route.ts` parsuje query string, przelicza jednostki kontraktu (zł na grosze, pp na ułamek), woła domenę, zwraca JSON. Nie liczy rat i nie zaokrągla wyników.
3. **TDD (bezwzględnie).** Najpierw test w vitest, który nie przechodzi, potem kod. Każda zmiana logiki obliczeń ma test z liczbą kontrolną.
4. **Pieniądze w groszach.** Kwoty to liczby całkowite w groszach; zaokrąglanie do grosza w jednej funkcji `zaokraglijDoGrosza`.
5. **TypeScript strict, prostota.** Bez `any`, `@ts-ignore`, `as unknown as`; bez nowych zależności bez uzasadnienia w PR; Tailwind bez bibliotek UI.
6. **Proces.** Jeden PR na fazę z `tasks.md`, review Copilota przed kolejną fazą, `npm test`, `npm run typecheck` i `npm run build` zielone przed zgłoszeniem gotowości. Push do `main` to produkcja na Vercel.
7. **Język.** Dokumenty, nazwy domenowe (bez skrótów) i commity po polsku.

Prompt: ten z KARTA.md, sekcja „Komendy spec-kit”, z dopiskiem o wstrzykiwaniu serii do domeny (zasada 1).

## 4. `/speckit-specify`

Wynik: `specs/001-harmonogram-splat/spec.md`. Wejście: sekcje „Treść zgłoszenia” i „Zakres MVP” z BRIEF.md, razem z „Ekran” i „Wydanie”, oraz dopisek z KARTA.md (liczba kontrolna jako kryterium akceptacji, ekran jako ostatnia historia).

Oczekiwane historie użytkownika (kolejność = priorytet):

| ID | Historia | Kryterium akceptacji |
| --- | --- | --- |
| US1 (P1) | Harmonogram rat równych przy stałej stopie, dostępny przez `GET /api/harmonogram` | 400 000 zł, 300 rat, 3,55 % + 2,11 pp: rata 2 494,72 zł (±0,05), ostatnia rata 2 492,53 zł, suma kapitału = kwota |
| US2 (P2) | Zmienny wskaźnik z serii: POLSTR 1M co miesiąc, WIBOR 3M co kwartał, po końcu serii ostatnia znana wartość | test ze zmianą wskaźnika w trakcie spłaty: rata przeliczona od okresu zmiany |
| US3 (P3) | Raty malejące | stała część kapitałowa, malejąca rata, suma kapitału = kwota |
| US4 (P4) | Nadpłaty: miesiąc, kwota, tryb „obniż ratę” albo „skróć okres” | dwa testy: niższa rata przy tej samej liczbie rat; ta sama rata przy mniejszej liczbie rat |
| US5 (P5) | Ekran www: formularz, „Policz”, rata pierwsza i ostatnia, suma odsetek, tabela, eksport CSV | na produkcji ekran pokazuje liczbę kontrolną |

Wymagania niefunkcjonalne w spec: kwoty w groszach, jedno miejsce zaokrąglania, rata wyrównująca na końcu, odsetki proste (saldo × stopa roczna / 12), świadome uproszczenie (bez składania dziennych stawek POLSTR).

## 5. `/speckit-clarify` (zalecany mimo że opcjonalny)

BRIEF nie rozstrzyga kilku rzeczy, a od nich zależą testy. Przyjęte odpowiedzi, zgodne z BRIEF i najprostsze:

| Pytanie | Decyzja |
| --- | --- |
| Która wartość wskaźnika obowiązuje dla raty *n*? | wpis serii obowiązujący w dniu raty *n* (POLSTR); dla WIBOR 3M wartość z dnia raty 1, 4, 7, … trzymana przez 3 raty |
| Co z ratą równą po zmianie stopy? | rata przeliczana annuitetowo od salda i liczby pozostałych rat |
| Daty rat przy dniu 29 do 31 | ten sam dzień miesiąca, a w krótszym miesiącu jego ostatni dzień |
| Kiedy działa nadpłata „w miesiącu *m*”? | po zapłacie raty numer *m*, zmniejsza saldo przed ratą *m*+1 |
| „Obniż ratę” przy ratach malejących | nowa część kapitałowa = saldo / pozostałe raty |
| „Skróć okres” | rata równa (albo część kapitałowa przy malejących) bez zmian, harmonogram kończy się wcześniej, ostatnia rata wyrównuje |
| Nadpłata większa niż saldo | błąd walidacji 400 |
| Format nadpłat w query string | `nadplaty=12:10000:obniz,24:5000:skroc` (miesiąc:kwota w zł:tryb) |

## 6. `/speckit-plan`

Prompt: ten z KARTA.md. Wynik w `specs/001-harmonogram-splat/`:

- `plan.md`: kontekst techniczny (TypeScript 5.9 strict, Next.js 16 App Router, React 19, Tailwind 4, vitest 4, Node 22, Vercel, bez bazy danych, bez nowych zależności), Constitution Check (7 zasad z pkt 3, wszystkie „spełnione”), struktura katalogów.
- `research.md`: decyzje z pkt 5 z uzasadnieniem, wzór annuitetu, reguła raty wyrównującej, algorytm wyboru wpisu serii.
- `data-model.md`: typy domeny, jak poniżej.
- `contracts/api-harmonogram.md`: kontrakt `GET /api/harmonogram`.
- `quickstart.md`: jak sprawdzić liczbę kontrolną z przeglądarki i z testu.

Proponowany model domeny (`src/domena/harmonogram.ts`):

```ts
type TrybNadplaty = 'obnizRate' | 'skrocOkres';
interface Nadplata { numerRaty: number; kwotaGr: number; tryb: TrybNadplaty }
interface ParametryKredytu { kwotaGr; liczbaRat; marza; typRat; wskaznik; pierwszaRata; nadplaty: Nadplata[] }
interface Rata { numer; data; czescKapitalowaGr; czescOdsetkowaGr; rataGr; nadplataGr; saldoPoSplacieGr; stopaRoczna }
interface Harmonogram { raty: Rata[]; sumaOdsetekGr: number; rataPierwszaGr: number; rataOstatniaGr: number }

function policzHarmonogram(parametry: ParametryKredytu, seria: WpisSerii[]): Harmonogram
```

Funkcje pomocnicze (też czyste i testowane): `zaokraglijDoGrosza`, `dataRaty(pierwszaRata, numer)`, `stopaWskaznikaNaDzien(seria, data)`, `rataAnnuitetowa(saldoGr, stopaRoczna, liczbaRat)`.

Kontrakt API: wejście `kwota` (zł), `liczbaRat`, `marza` (pp), `wskaznik` (`POLSTR_1M` | `WIBOR_3M`), `typRat` (`rowne` | `malejace`), `pierwszaRata` (YYYY-MM-DD), opcjonalnie `nadplaty`. Wyjście: JSON z harmonogramem w groszach (ekran formatuje złote). Błędy: 400 z polem `blad` i przykładem.

## 7. `/speckit-tasks`

Prompt: ten z KARTA.md. Oczekiwany układ `tasks.md`; każda faza to jeden PR i jedna gałąź `faza-<n>-<nazwa>`:

| Faza | Zawartość | Gałąź |
| --- | --- | --- |
| 1 Setup | pusta, szkielet już istnieje | (razem z fazą 2 i 3) |
| 2 Foundational | typy z `data-model.md`; testy i implementacja `zaokraglijDoGrosza`, `dataRaty`, `stopaWskaznikaNaDzien` (granice: dzień wpisu, dzień przed kolejnym, po końcu serii); aktualizacja `smoke.test.ts` | `faza-2-podstawy` |
| 3 US1 | test liczby kontrolnej ze stałą serią `[{od:'2000-01-01', stopa:0.0355}]` (czerwony), `rataAnnuitetowa`, pętla harmonogramu z ratą wyrównującą, test sumy kapitału; route handler przekazuje `seriaWskaznika()` i zwraca JSON | `faza-3-rowne-raty` |
| 4 US2 | test zmiany wskaźnika w trakcie spłaty (POLSTR co miesiąc, WIBOR co kwartał), przeliczanie raty po zmianie stopy | `faza-4-zmienny-wskaznik` |
| 5 US3 | test rat malejących i sumy kapitału, implementacja | `faza-5-raty-malejace` |
| 6 US4 | testy obu trybów nadpłaty i nadpłaty ponad saldo, implementacja, parsowanie `nadplaty` w route handlerze | `faza-6-nadplaty` |
| 7 US5 | wklejenie eksportu z Claude Design do `app/page.tsx`, podpięcie do `/api/harmonogram`, eksport CSV w przeglądarce, sprawdzenie liczby kontrolnej ręcznie | `faza-7-ekran` |
| 8 Polish | README (użycie API), `npm run lint`, build, tag `v0.1.0` | `faza-8-porzadki` |

Uwaga: KARTA.md w torze równoległym nazywa podpięcie ekranu „fazą 4”, a w promptcie do `/speckit-tasks` każe dać ekran jako ostatnią historię. Plan trzyma ekran na końcu, ale jest ścieżka skrócona: jeśli o 14:30 fazy 4 do 6 nie są gotowe, ekran (faza 7) wchodzi zaraz po fazie 3, bo sama US1 wystarcza do pokazania liczby kontrolnej na produkcji.

## 8. `/speckit-analyze` i `/speckit-checklist` (opcjonalne, ok. 5 minut)

Sprawdzenie, czy każde wymaganie ze `spec.md` ma zadanie w `tasks.md`, czy 5 testów z BRIEF jest zaplanowanych jako pierwsze zadania w swoich fazach i czy nic nie łamie konstytucji (np. obliczenia w route handlerze).

## 9. PR #1 z artefaktami (Bramka 1)

Komendy z KARTA.md: commit „spec: konstytucja, specyfikacja, plan, zadania”, push `spec-mvp`, `gh pr create --fill --reviewer "@copilot"`, przeczytać review i komentarz bota Vercel, `gh pr merge --squash --delete-branch`, `git switch main`, `git pull`.

## 10. `/speckit-implement`, faza po fazie (Bramka 2)

Cykl dla każdej fazy:

1. `git switch -c faza-<n>-<nazwa>`
2. „Wykonaj tylko fazę *n* z tasks.md, zatrzymaj się i pokaż diff” (pierwszy raz: fazy 1 do 3).
3. Sprawdzić, że test powstał przed kodem i najpierw był czerwony.
4. `npm test`, `npm run typecheck`, `npm run build` lokalnie.
5. Commit po polsku, push, PR z Copilotem jako recenzentem, poprawki po review (zanotować jedną do maila), scalenie.
6. Po scaleniu fazy 3: kontrola produkcji `…/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01`. Z pliku danych rata wyjdzie ok. 2 495,85 zł; 2 494,72 zł daje test ze stałą stopą 3,55 %.
7. Po ostatniej fazie `/speckit-converge`: porównuje kod z artefaktami i dopisuje brakujące zadania.

Tor równoległy od 14:00: ekran w Claude Design według promptu z KARTA.md, do promptu warto dopisać parametr `nadplaty` z pkt 5. Eksport czeka do fazy 7.

Wydanie MVP: scalenie do `main`, `git tag v0.1.0`, `git push --tags`, produkcja pokazuje ekran z wynikiem.

## 11. Karta zmiany (Bramka 3)

Karta przychodzi od prowadzącego, więc jej treść nie jest znana. Kolejność: dopisek w `spec.md` i nowa faza w `tasks.md` (albo `/speckit-converge`), test (czerwony), poprawka, PR, review, scalenie, `git tag v0.2.0`, `git push --tags`, mail do prowadzącego (adres produkcyjny, adres repo, jedno zdanie o poprawce po review Copilota).

## 12. Ryzyka

| Ryzyko | Jak ograniczyć |
| --- | --- |
| Rata różna od liczby kontrolnej | zamiana pp na ułamek jest w route handlerze, stopa roczna / 12, zaokrąglanie tylko raty i odsetek w `zaokraglijDoGrosza`; test ze stałą serią, nie z pliku |
| Przesunięcie dat przez strefę czasową | daty jako napisy YYYY-MM-DD liczone arytmetyką na roku i miesiącu, bez `new Date()` w domenie; testy w Europe/Warsaw |
| Suma kapitału ≠ kwota po zaokrągleniach | ostatnia rata spłaca całe saldo; test niezmiennika dla każdego scenariusza |
| Czerwony build na Vercel | `npm run build` przed każdym PR, Actions uruchamia ten sam build |
| Brak czasu | zasada awaryjna z 14:45 i ścieżka skrócona z pkt 7 |
| Brak Copilota jako recenzenta | `skrypty/review-pr.ps1 <numer>` |

## Przyjęte decyzje

1. Odpowiedzi z pkt 5 przyjęte w całości. Dla raty *n* obowiązuje wartość wskaźnika z dnia raty *n*; WIBOR 3M bierze wartość z raty 1, 4, 7, … i trzyma ją przez 3 raty. Nadpłaty w formacie `nadplaty=12:10000:obniz,24:5000:skroc`.
2. Seria wskaźnika jest argumentem `policzHarmonogram(parametry, seria)`.
3. Ekran zostaje ostatnią historią (faza 7), ze ścieżką skróconą z pkt 7.
