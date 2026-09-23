# Kontrakt: GET /api/harmonogram

## Parametry query string

| Parametr | Wymagany | Format | Przykład | Przeliczenie w handlerze |
| --- | --- | --- | --- | --- |
| `kwota` | tak | liczba > 0, złote | `400000` | × 100 → `kwotaGr` |
| `liczbaRat` | tak | liczba całkowita > 0 | `300` | |
| `marza` | tak | liczba ≥ 0, punkty procentowe | `2.11` | / 100 → `marza` |
| `wskaznik` | tak | `POLSTR_1M` \| `WIBOR_3M` | `POLSTR_1M` | |
| `typRat` | tak | `rowne` \| `malejace` | `rowne` | |
| `pierwszaRata` | tak | `YYYY-MM-DD` | `2026-10-01` | |
| `nadplaty` | nie | lista `numerRaty:kwotaZl:tryb` rozdzielona przecinkami, tryb `obniz` \| `skroc` | `12:10000:obniz,24:5000:skroc` | kwota × 100, `obniz` → `obnizRate`, `skroc` → `skrocOkres` |

Przykład: `/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01`

## Odpowiedź 200

`Harmonogram` z [data-model.md](../data-model.md):

```json
{
  "raty": [
    {
      "numer": 1,
      "data": "2026-10-01",
      "stopaRoczna": 0.0566472,
      "czescKapitalowaGr": 60761,
      "czescOdsetkowaGr": 188824,
      "rataGr": 249585,
      "nadplataGr": 0,
      "saldoPoSplacieGr": 39939239
    }
  ],
  "sumaOdsetekGr": 34876543,
  "rataPierwszaGr": 249585,
  "rataOstatniaGr": 249012
}
```

(Liczby w przykładzie ilustrują kształt, nie są liczbą kontrolną.)

## Odpowiedź 400

Błędny parametr wejścia albo błąd walidacji domeny (np. nadpłata większa niż saldo, data przed pierwszym wpisem serii):

```json
{ "blad": "kwota: liczba dodatnia w złotych, np. 400000", "przyklad": "/api/harmonogram?kwota=400000&…" }
```
