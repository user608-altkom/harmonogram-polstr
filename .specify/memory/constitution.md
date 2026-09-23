<!--
Raport synchronizacji
- Wersja: szablon → 1.0.0 (pierwsze wypełnienie)
- Dodane zasady: I–VII, sekcje „Ograniczenia techniczne” i „Proces wytwarzania”
- Szablony: plan-template.md (Constitution Check czyta zasady z tego pliku) ✅, spec-template.md ✅, tasks-template.md ✅
- Otwarte TODO: brak
-->

# Konstytucja projektu Harmonogram na POLSTR

## Zasady podstawowe

### I. Domena czysta i odizolowana

Cała logika obliczeń mieszka w `src/domena/`. Funkcje domeny są czyste: bez React, bez I/O (odczytu plików, sieci), bez `Date.now()` i `new Date()` zależnego od strefy, bez `console.log`. Seria wskaźnika trafia do domeny jako argument funkcji, nie jako import, żeby testy mogły podać serię stałą.

### II. Cienki route handler

`app/api/harmonogram/route.ts` parsuje query string, przelicza jednostki kontraktu wejścia (złote na grosze, punkty procentowe na ułamek), pobiera serię z `src/dane/`, woła domenę i zwraca JSON. Nie liczy rat, nie zaokrągla wyników i nie iteruje po ratach.

### III. Najpierw test (bezwzględnie)

Każda zmiana logiki obliczeń zaczyna się od testu vitest w `tests/`, który najpierw nie przechodzi. Każda taka zmiana ma test z liczbą kontrolną (konkretna kwota, konkretna rata). Testy obejmują tylko domenę i dane, ekran nie ma testów jednostkowych.

### IV. Pieniądze w groszach, jedno miejsce zaokrąglania

Kwoty w domenie są liczbami całkowitymi w groszach, nazwy pól kończą się na `Gr`. Zaokrąglanie do grosza odbywa się wyłącznie w funkcji `zaokraglijDoGrosza` w module domenowym. Ostatnia rata wyrównuje, tak aby suma części kapitałowych i nadpłat była równa kwocie kredytu.

### V. TypeScript strict i prostota

TypeScript w trybie strict, bez `any`, `as unknown as`, `@ts-ignore` i `!` na wartościach, które mogą być `undefined`. Style tylko przez Tailwind, bez bibliotek UI. Nowa zależność wymaga uzasadnienia w opisie PR.

### VI. Wydanie przez PR i review

Jedna faza z `tasks.md` to jedna gałąź i jeden PR z Copilotem jako recenzentem. Kolejna faza zaczyna się po review i scaleniu poprzedniej. Push do `main` to produkcja na Vercel.

### VII. Język polski

Dokumenty, komentarze, nazwy domenowe (bez skrótów, np. `rataKapitalowa`, nie `rk`) i jednolinijkowe komunikaty commitów są po polsku.

## Ograniczenia techniczne

- Next.js App Router, React 19, TypeScript 5 strict, Tailwind 4, vitest, Node.js 22 lub nowszy.
- Brak bazy danych: serie wskaźników pochodzą z `dane/*.json` i nie są edytowane w trakcie ćwiczenia.
- Daty jako napisy `YYYY-MM-DD`, testy w strefie Europe/Warsaw.

## Proces wytwarzania

- Przed zgłoszeniem gotowości fazy: `npm test`, `npm run typecheck` i `npm run build` są zielone lokalnie i w GitHub Actions.
- Review stosuje reguły z `.github/instructions/review.instructions.md` (kategorie BŁĄD, RYZYKO, STYL).
- Wersje produkcyjne oznaczamy tagami `v0.1.0` (MVP), `v0.2.0` (karta zmiany).

## Zarządzanie

Konstytucja ma pierwszeństwo przed innymi praktykami w repo; AGENTS.md jest jej rozwinięciem dla agenta. Każdy PR i każde review sprawdza zgodność z zasadami I–VII. Zmiana zasady wymaga PR z uzasadnieniem i podbicia wersji: MAJOR przy usunięciu lub odwróceniu zasady, MINOR przy nowej zasadzie, PATCH przy doprecyzowaniu.

**Wersja**: 1.0.0 | **Przyjęta**: 2026-09-23 | **Ostatnia zmiana**: 2026-09-23
