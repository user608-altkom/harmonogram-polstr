---
description: "Lista zadań: CR-A, wybór skutku nadpłaty"
---

# Zadania: CR-A, wybór skutku nadpłaty

**Wejście**: [spec.md](spec.md), [plan.md](plan.md)

**Organizacja**: jedna faza, gałąź `cr-a-tryb-nadplaty`, jeden PR z review, tag `v0.2.0`.

## Faza 1: Historia CR-A — tryb przy każdej nadpłacie (P1)

### Testy ⚠️ najpierw, muszą nie przechodzić

- [X] TA01 [CR-A] Test `nadplata.tryb` z liczbami z karty (rata 2 265,07 zł, saldo 269 399,93 zł, „obniż ratę” 2 038,11 zł i 240 rat, „skróć okres” 196 rat i ostatnia 2 200,53 zł, suma kapitału = kwota, brak trybu = „skróć okres”) w tests/nadplata-tryb.test.ts

### Implementacja

- [X] TA02 [CR-A] `Nadplata.tryb` opcjonalny, domyślnie `skrocOkres` w walidacji i pętli nadpłat w src/domena/harmonogram.ts
- [X] TA03 [CR-A] Parser `nadplaty` przyjmuje `numerRaty:kwota` bez trybu w app/api/harmonogram/route.ts
- [X] TA04 [P] [CR-A] Tryb opcjonalny w specs/001-harmonogram-splat/contracts/api-harmonogram.md i data-model.md
- [X] TA05 [P] [CR-A] Konwencja „nadpłata po racie miesiąca, odsetki od salda sprzed nadpłaty” i przykład bez trybu w README.md

### Wydanie

- [X] TA06 `npm test`, `npm run typecheck`, `npm run build` zielone; PR z odhaczonymi kryteriami 1–4, review, scalenie
- [ ] TA07 `git tag v0.2.0`, `git push --tags`, sprawdzenie produkcji (`nadplaty=1:30000` daje to samo co `nadplaty=1:30000:skroc`)

## Zależności

TA01 → TA02 → TA03; TA04 i TA05 równolegle po TA02; TA06 → TA07.
