# Plan implementacji: Kalkulator harmonogramu spłat na POLSTR 1M i WIBOR 3M

**Gałąź**: `spec-mvp` | **Data**: 2026-09-23 | **Specyfikacja**: [spec.md](spec.md)

**Wejście**: specyfikacja z `specs/001-harmonogram-splat/spec.md`, wytyczne: Next.js App Router, bez nowych zależności; domena w `src/domena/`, dane w `src/dane/`, cienki route handler, ekran `'use client'`; testy vitest tylko domeny i danych.

## Podsumowanie

Czysta funkcja `policzHarmonogram(parametry, seria)` w `src/domena/harmonogram.ts` liczy harmonogram w groszach: raty równe (annuitet przeliczany przy zmianie stopy i nadpłacie) i malejące, stopa = wskaźnik z serii + marża, nadpłaty w dwóch trybach, rata wyrównująca na końcu. Route handler `GET /api/harmonogram` parsuje query string, dobiera serię przez `seriaWskaznika()` i zwraca JSON. Ekran `app/page.tsx` to komponent kliencki z formularzem, tabelą i eksportem CSV.

## Kontekst techniczny

**Język/wersja**: TypeScript 5.9 (strict, `noUncheckedIndexedAccess`), Node.js 22+

**Główne zależności**: Next.js 16.3 (App Router), React 19.2, Tailwind 4; bez nowych zależności

**Przechowywanie**: brak; serie wskaźników z `dane/*.json` przez import JSON

**Testy**: vitest 4, katalog `tests/`, strefa Europe/Warsaw

**Platforma docelowa**: Vercel (produkcja z `main`, podglądy z PR), przeglądarka

**Typ projektu**: aplikacja web (Next.js: route handler + strona)

**Cele wydajności**: harmonogram 360 rat liczony w < 10 ms; odpowiedź API < 2 s na Vercel

**Ograniczenia**: kwoty w groszach, jedno miejsce zaokrąglania, domena bez I/O i bez `Date`

**Skala/zakres**: jeden endpoint, jeden ekran, do 420 rat, do kilkunastu nadpłat

## Konstytucja: kontrola zgodności

*Bramka: przed fazą 0 i ponownie po fazie 1.*

| Zasada | Jak plan ją spełnia | Wynik |
| --- | --- | --- |
| I. Domena czysta | cała logika w `src/domena/harmonogram.ts`, seria jako argument, daty jako napisy liczone arytmetycznie | ✅ |
| II. Cienki route handler | handler tylko parsuje (zł → gr, pp → ułamek, `nadplaty`), woła `seriaWskaznika` i `policzHarmonogram` | ✅ |
| III. Najpierw test | każde zadanie implementacyjne w `tasks.md` poprzedza test, liczby kontrolne w [research.md](research.md) | ✅ |
| IV. Grosze, jedno zaokrąglanie | `zaokraglijDoGrosza` jedyne `Math.round` w domenie; niezmiennik sumy kapitału w testach | ✅ |
| V. Strict i prostota | brak nowych zależności, Tailwind, bez `any` | ✅ |
| VI. PR i review | fazy z `tasks.md` mapują się na gałęzie `faza-<n>-<nazwa>` | ✅ |
| VII. Język polski | nazwy domenowe i dokumenty po polsku | ✅ |

Ponowna kontrola po projekcie (faza 1): bez zmian, brak naruszeń do uzasadnienia.

## Struktura projektu

### Dokumentacja (ta funkcja)

```text
specs/001-harmonogram-splat/
├── spec.md
├── plan.md               # ten plik
├── research.md           # faza 0
├── data-model.md         # faza 1
├── quickstart.md         # faza 1
├── contracts/
│   └── api-harmonogram.md
├── checklists/
│   └── requirements.md
└── tasks.md              # /speckit-tasks
```

### Kod źródłowy

```text
src/
├── domena/
│   └── harmonogram.ts     # typy i czyste funkcje: zaokraglijDoGrosza, dataRaty,
│                          # stopaWskaznikaNaDzien, rataAnnuitetowa, policzHarmonogram
└── dane/
    └── wskazniki.ts       # seriaWskaznika() (bez zmian)
app/
├── api/harmonogram/route.ts  # parsowanie query string, JSON
└── page.tsx                  # ekran 'use client'
tests/
├── smoke.test.ts             # dane wskaźników, strefa czasowa
├── podstawy.test.ts          # zaokrąglanie, daty rat, wybór wpisu serii
├── raty-rowne.test.ts        # US1 + US2
├── raty-malejace.test.ts     # US3
└── nadplaty.test.ts          # US4
```

**Decyzja o strukturze**: jeden projekt Next.js zgodny ze szkieletem; nie dzielimy domeny na wiele plików, bo cała logika mieści się w jednym module.

## Śledzenie złożoności

Brak naruszeń konstytucji.
