# Model danych: harmonogram spłat

Wszystkie typy w `src/domena/harmonogram.ts` (poza `WpisSerii` z `src/dane/wskazniki.ts`). Kwoty w groszach jako liczby całkowite, stopy jako ułamki, daty jako napisy `YYYY-MM-DD`.

## WpisSerii (istnieje)

| Pole | Typ | Opis |
| --- | --- | --- |
| `od` | `string` | dzień, od którego obowiązuje wartość |
| `stopa` | `number` | ułamek, np. `0.0355` |

Seria jest uporządkowana rosnąco po `od` (sprawdza `tests/smoke.test.ts`).

## TrybNadplaty

`'obnizRate' | 'skrocOkres'`

## Nadplata

| Pole | Typ | Walidacja |
| --- | --- | --- |
| `numerRaty` | `number` | całkowita, 1..`liczbaRat`, rata musi istnieć w harmonogramie |
| `kwotaGr` | `number` | całkowita > 0, nie większa niż saldo po racie `numerRaty` |
| `tryb` | `TrybNadplaty` | |

## ParametryKredytu

| Pole | Typ | Walidacja |
| --- | --- | --- |
| `kwotaGr` | `number` | całkowita > 0 |
| `liczbaRat` | `number` | całkowita > 0 |
| `marza` | `number` | ułamek ≥ 0, np. `0.0211` |
| `typRat` | `'rowne' \| 'malejace'` | |
| `wskaznik` | `'POLSTR_1M' \| 'WIBOR_3M'` | |
| `pierwszaRata` | `string` | `YYYY-MM-DD` |
| `nadplaty` | `Nadplata[]` | opcjonalne, domyślnie brak |

## Rata

| Pole | Typ | Opis |
| --- | --- | --- |
| `numer` | `number` | 1.. |
| `data` | `string` | data raty |
| `stopaRoczna` | `number` | wskaźnik + marża |
| `czescKapitalowaGr` | `number` | |
| `czescOdsetkowaGr` | `number` | zaokrąglenie(saldo przed ratą × stopa / 12) |
| `rataGr` | `number` | kapitał + odsetki (bez nadpłaty) |
| `nadplataGr` | `number` | suma nadpłat po tej racie, 0 gdy brak |
| `saldoPoSplacieGr` | `number` | saldo po racie i nadpłacie |

## Harmonogram

| Pole | Typ | Opis |
| --- | --- | --- |
| `raty` | `Rata[]` | |
| `sumaOdsetekGr` | `number` | Σ `czescOdsetkowaGr` |
| `rataPierwszaGr` | `number` | `rataGr` pierwszej raty |
| `rataOstatniaGr` | `number` | `rataGr` ostatniej raty |

## Funkcje

| Funkcja | Sygnatura | Uwagi |
| --- | --- | --- |
| `zaokraglijDoGrosza` | `(kwota: number) => number` | jedyne `Math.round` w domenie |
| `dataRaty` | `(pierwszaRata: string, numer: number) => string` | D3 w research.md |
| `stopaWskaznikaNaDzien` | `(seria: WpisSerii[], data: string) => number` | D2, błąd przed pierwszym wpisem |
| `rataAnnuitetowa` | `(saldoGr: number, stopaRoczna: number, liczbaRat: number) => number` | D4 |
| `policzHarmonogram` | `(parametry: ParametryKredytu, seria: WpisSerii[]) => Harmonogram` | rzuca `BladParametrow` przy błędnych danych |

`BladParametrow` to klasa błędu (rozszerza `Error`), którą route handler zamienia na status 400.

## Niezmienniki

- `saldoPoSplacieGr` ostatniej raty = 0.
- Σ `czescKapitalowaGr` + Σ `nadplataGr` = `kwotaGr`.
- Wszystkie kwoty są liczbami całkowitymi ≥ 0.
