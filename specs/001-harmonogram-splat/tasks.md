---
description: "Lista zadań: kalkulator harmonogramu spłat na POLSTR 1M i WIBOR 3M"
---

# Zadania: Kalkulator harmonogramu spłat na POLSTR 1M i WIBOR 3M

**Wejście**: dokumenty z `specs/001-harmonogram-splat/`

**Wymagane**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/api-harmonogram.md](contracts/api-harmonogram.md)

**Testy**: obowiązkowe (konstytucja, zasada III). Test każdej historii powstaje pierwszy i musi najpierw nie przechodzić.

**Organizacja**: jedna faza = jedna gałąź `faza-<n>-<nazwa>` i jeden PR z review Copilota. Fazy 1–3 idą w jednym PR.

## Format: `[ID] [P?] [Historia] Opis`

- **[P]**: można wykonać równolegle (inny plik, brak zależności)
- **[US<n>]**: historia ze spec.md

---

## Faza 1: Setup (wspólna infrastruktura)

**Cel**: brak zadań. Szkielet Next.js, vitest, Tailwind, workflow Actions i dane `dane/*.json` już istnieją.

---

## Faza 2: Foundational (warunki wstępne)

**Cel**: typy i funkcje pomocnicze domeny, na których opierają się wszystkie historie.

**⚠️ KRYTYCZNE**: żadna historia nie startuje przed końcem tej fazy.

- [ ] T001 Zdefiniować typy `TrybNadplaty`, `Nadplata`, `ParametryKredytu` (z `nadplaty?`), `Rata`, `Harmonogram` i klasę `BladParametrow` według data-model.md w src/domena/harmonogram.ts
- [ ] T002 [P] Napisać testy `zaokraglijDoGrosza` (połówki, ujemne zero, liczby całkowite bez zmian) w tests/podstawy.test.ts
- [ ] T003 [P] Napisać testy `dataRaty` (kolejne miesiące, przejście roku, 31 stycznia → 28/29 lutego → 31 marca, rok przestępny) w tests/podstawy.test.ts
- [ ] T004 [P] Napisać testy `stopaWskaznikaNaDzien` (dzień wpisu, dzień przed kolejnym wpisem, po ostatnim wpisie, przed pierwszym wpisem → błąd) w tests/podstawy.test.ts
- [ ] T005 Zaimplementować `zaokraglijDoGrosza`, `dataRaty`, `stopaWskaznikaNaDzien` w src/domena/harmonogram.ts (T002–T004 zielone)

**Punkt kontrolny**: funkcje pomocnicze przetestowane, `npm test` zielony.

---

## Faza 3: Historia 1 — raty równe przy stałej stopie (P1) 🎯 MVP

**Cel**: harmonogram rat równych ze stałą serią i endpoint `GET /api/harmonogram`.

**Test niezależny**: liczba kontrolna z BRIEF.md w vitest oraz zapytanie z quickstart.md.

### Testy historii 1 ⚠️ najpierw, muszą nie przechodzić

- [ ] T006 [P] [US1] Test liczby kontrolnej: 400 000 zł, 300 rat, seria stała `[{ od: '2000-01-01', stopa: 0.0355 }]`, marża 0.0211 → rata 249472 gr (±5 gr), ostatnia rata 249253 gr, 300 rat, daty od 2026-10-01 w tests/raty-rowne.test.ts
- [ ] T007 [P] [US1] Test niezmiennika: suma części kapitałowych = kwota, saldo po ostatniej racie = 0, `sumaOdsetekGr` = suma odsetek rat, oraz przypadek jednej raty i stopy zerowej w tests/raty-rowne.test.ts
- [ ] T008 [P] [US1] Test `rataAnnuitetowa` na liczbie kontrolnej w tests/podstawy.test.ts

### Implementacja historii 1

- [ ] T009 [US1] Zaimplementować `rataAnnuitetowa` w src/domena/harmonogram.ts
- [ ] T010 [US1] Zaimplementować `policzHarmonogram(parametry, seria)` dla rat równych (walidacja parametrów, pętla rat, ostatnia rata wyrównująca) w src/domena/harmonogram.ts
- [ ] T011 [US1] Zaktualizować route handler: przekazać `seriaWskaznika(parametry.wskaznik)`, `BladParametrow` → 400, usunąć ścieżkę 501 w app/api/harmonogram/route.ts
- [ ] T012 [US1] Usunąć test szkieletu „zgłasza brak implementacji” w tests/smoke.test.ts

**Punkt kontrolny**: liczba kontrolna zielona, API zwraca JSON lokalnie i na podglądzie Vercel.

---

## Faza 4: Historia 2 — zmienny wskaźnik z serii (P2)

**Cel**: stopa z serii per rata, POLSTR co miesiąc, WIBOR co kwartał, przeliczenie raty równej po zmianie stopy.

**Test niezależny**: seria z dwiema wartościami, porównanie POLSTR 1M i WIBOR 3M.

### Testy historii 2 ⚠️

- [ ] T013 [P] [US2] Test POLSTR 1M: seria 6 % od 2000-01-01 i 4 % od 2027-01-01, pierwsza rata 2026-11-01 → raty 1–2 ze stopą 6 % + marża, od raty 3 (2027-01-01) 4 % + marża i rata równa = `rataAnnuitetowa(saldo po racie 2, nowa stopa, N − 2)` w tests/raty-rowne.test.ts
- [ ] T014 [P] [US2] Test WIBOR 3M na tej samej serii → raty 1–3 ze starą stopą, zmiana dopiero w racie 4, stopa stała w ratach 4–6 w tests/raty-rowne.test.ts
- [ ] T015 [P] [US2] Test serii z pliku: raty po ostatnim wpisie mają ostatnią znaną wartość; POLSTR z pliku daje pierwszą ratę 249585 gr (2 495,85 zł) w tests/raty-rowne.test.ts

### Implementacja historii 2

- [ ] T016 [US2] Dodać wybór daty wskaźnika dla raty (POLSTR: data raty, WIBOR: data raty otwierającej kwartał) i przeliczanie annuitetu przy zmianie stopy w src/domena/harmonogram.ts

**Punkt kontrolny**: US1 i US2 zielone.

---

## Faza 5: Historia 3 — raty malejące (P3)

**Cel**: typ rat `malejace`.

**Test niezależny**: liczby kontrolne z research.md D5.

### Testy historii 3 ⚠️

- [ ] T017 [P] [US3] Test: 400 000 zł, 300 rat malejących, stała stopa 3,55 % + 2,11 pp → część kapitałowa 133333 gr (raty 1–299), ostatnia 133433 gr, pierwsza rata 322000 gr, raty nierosnące, suma kapitału = kwota w tests/raty-malejace.test.ts

### Implementacja historii 3

- [ ] T018 [US3] Dodać gałąź rat malejących w `policzHarmonogram` w src/domena/harmonogram.ts

**Punkt kontrolny**: US1–US3 zielone.

---

## Faza 6: Historia 4 — nadpłaty (P4)

**Cel**: nadpłaty w trybach „obniż ratę” i „skróć okres”, parametr `nadplaty` w API.

**Test niezależny**: testy obu trybów dla rat równych i malejących.

### Testy historii 4 ⚠️

- [ ] T019 [P] [US4] Test „obniż ratę” (raty równe): nadpłata 10 000 zł po racie 12 → 300 rat, rata od 13 = `rataAnnuitetowa(saldo po nadpłacie, stopa, 288)`, niższa niż bez nadpłaty, suma kapitału + nadpłat = kwota w tests/nadplaty.test.ts
- [ ] T020 [P] [US4] Test „skróć okres” (raty równe): ta sama nadpłata → rata 13+ równa racie bez nadpłaty, mniej niż 300 rat, niższa suma odsetek w tests/nadplaty.test.ts
- [ ] T021 [P] [US4] Test obu trybów dla rat malejących oraz nadpłaty spłacającej całe saldo w tests/nadplaty.test.ts
- [ ] T022 [P] [US4] Test walidacji: nadpłata większa niż saldo, numer raty 0 lub > N, kwota ≤ 0 → `BladParametrow` w tests/nadplaty.test.ts

### Implementacja historii 4

- [ ] T023 [US4] Zaimplementować nadpłaty i planowaną liczbę rat po skróceniu okresu w src/domena/harmonogram.ts
- [ ] T024 [US4] Parsować parametr `nadplaty` (`numerRaty:kwotaZl:obniz|skroc`) w app/api/harmonogram/route.ts

**Punkt kontrolny**: US1–US4 zielone, API przyjmuje nadpłaty.

---

## Faza 7: Historia 5 — ekran www (P5)

**Cel**: ekran w app/page.tsx podłączony do route handlera.

**Test niezależny**: ręcznie według quickstart.md, pkt 3 (ekran bez testów jednostkowych).

- [ ] T025 [US5] Komponent `'use client'` z Tailwind: formularz (kwota, liczba rat, data pierwszej raty, marża, wskaźnik, typ rat, lista nadpłat), przycisk „Policz” w app/page.tsx
- [ ] T026 [US5] `fetch('/api/harmonogram?…')`, podsumowanie (rata pierwsza i ostatnia, suma odsetek), tabela rat, komunikat błędu z API w app/page.tsx
- [ ] T027 [US5] Eksport CSV w przeglądarce (separator `;`, BOM UTF-8) w app/page.tsx
- [ ] T028 [US5] Sprawdzić ekran ręcznie na liczbie kontrolnej lokalnie i na podglądzie Vercel

**Punkt kontrolny**: MVP kompletne.

---

## Faza 8: Porządki

- [ ] T029 [P] Opisać użycie API i ekranu w README.md
- [ ] T030 `npm run lint`, `npm test`, `npm run typecheck`, `npm run build` zielone; przejść quickstart.md
- [ ] T031 Po scaleniu do `main`: `git tag v0.1.0`, `git push --tags`

---

## Zależności i kolejność

- Faza 1 → Faza 2 → Faza 3 (US1) → Faza 4 (US2) → Faza 5 (US3) → Faza 6 (US4) → Faza 7 (US5) → Faza 8.
- US2–US4 zmieniają ten sam plik src/domena/harmonogram.ts, więc idą po kolei.
- US5 zależy tylko od US1 (kontrakt API); ścieżka skrócona z PLAN-REALIZACJI.md pozwala wykonać fazę 7 zaraz po fazie 3.
- W każdej fazie: testy → implementacja → `npm test`, `npm run typecheck`, `npm run build` → PR → review → scalenie.

## Strategia

1. MVP: fazy 1–3, liczba kontrolna, deploy.
2. Przyrosty: US2, US3, US4 — każda z własnym PR i deployem.
3. Ekran i porządki, tag `v0.1.0`.
