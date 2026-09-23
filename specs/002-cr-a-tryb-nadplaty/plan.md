# Plan implementacji: CR-A, wybór skutku nadpłaty

**Gałąź**: `cr-a-tryb-nadplaty` | **Data**: 2026-09-23 | **Specyfikacja**: [spec.md](spec.md)

## Podsumowanie

Najmniejsza zmiana: pole `Nadplata.tryb` staje się opcjonalne z domyślną wartością `skrocOkres` w `policzHarmonogram`; parser `nadplaty` w route handlerze przyjmuje pozycję bez trybu. Logika obu trybów z fazy 6 (001) zostaje bez zmian, co potwierdzają liczby z karty.

## Kontekst techniczny

Bez zmian względem [001/plan.md](../001-harmonogram-splat/plan.md): TypeScript strict, Next.js 16, vitest, bez nowych zależności.

## Konstytucja: kontrola zgodności

| Zasada | Jak zmiana ją spełnia | Wynik |
| --- | --- | --- |
| I. Domena czysta | domyślny tryb rozstrzygany w domenie, nie w handlerze | ✅ |
| II. Cienki route handler | handler tylko parsuje opcjonalny trzeci człon pozycji | ✅ |
| III. Najpierw test | `tests/nadplata-tryb.test.ts` z liczbami z karty, czerwony przed poprawką | ✅ |
| IV. Grosze, jedno zaokrąglanie | bez zmian | ✅ |
| V. Strict i prostota | typ opcjonalny zamiast nowego typu | ✅ |
| VI. PR i review | gałąź i PR `cr-a-tryb-nadplaty`, tag `v0.2.0` | ✅ |
| VII. Język polski | ✅ | ✅ |

## Decyzje

- **D-A1**: domyślny tryb w domenie (`nadplata.tryb ?? 'skrocOkres'`), żeby wynik był jednakowy dla każdego klienta API i dla testów domeny. Alternatywa: domyślny tryb tylko w parserze API — odrzucona, bo domena przyjmowałaby niepełne dane bez reguły.
- **D-A2**: konwencja z karty „nadpłata po racie miesiąca, odsetki od salda sprzed nadpłaty” jest zgodna z research.md D6 (001); dopisujemy ją do README.

## Pliki

- `tests/nadplata-tryb.test.ts` (nowy)
- `src/domena/harmonogram.ts` (typ `Nadplata`, walidacja, pętla nadpłat)
- `app/api/harmonogram/route.ts` (parser `nadplaty`)
- `specs/001-harmonogram-splat/contracts/api-harmonogram.md`, `data-model.md` (tryb opcjonalny)
- `README.md` (konwencja, przykład bez trybu)
