# Szybka weryfikacja

## Wymagania

Node.js 22+, `npm install` wykonane.

## 1. Testy domeny

```
npm test
npm run typecheck
npm run build
```

Oczekiwane: wszystkie testy zielone, w tym liczba kontrolna (rata 2 494,72 zł, ostatnia 2 492,53 zł) w `tests/raty-rowne.test.ts`.

## 2. API lokalnie

```
npm run dev
```

- http://localhost:3000/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01 → 300 rat; `rataPierwszaGr` = 249585 (seria z pliku, 3,55472 %).
- To samo z `&nadplaty=12:10000:skroc` → mniej niż 300 rat, niższa `sumaOdsetekGr`.
- `kwota=-1` → status 400 z polem `blad`.

Kontrakt: [contracts/api-harmonogram.md](contracts/api-harmonogram.md).

## 3. Ekran

http://localhost:3000: wpisz 400 000, 300, 2026-10-01, 2,11, POLSTR 1M, raty równe, „Policz”. Widać ratę pierwszą 2 495,85 zł, tabelę 300 rat, „Eksport CSV” pobiera plik.

## 4. Produkcja

Po scaleniu do `main` te same kroki na adresie `https://harmonogram-polstr-….vercel.app`.
