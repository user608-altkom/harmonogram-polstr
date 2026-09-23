# Specyfikacja zmiany: CR-A, wybór skutku nadpłaty

**Gałąź**: `cr-a-tryb-nadplaty`

**Utworzona**: 2026-09-23

**Status**: Zatwierdzona do realizacji

**Wejście**: karta zmiany CR-A (poziom A), zgłaszający: Departament Produktów Hipotecznych. Podstawa: art. 39 ust. 1 ustawy z 23 marca 2017 r. o kredycie hipotecznym (https://lexlege.pl/kredyt-hipot-i-nadzor/art-39/).

**Powiązanie**: rozszerza historię 4 (nadpłaty) z [001-harmonogram-splat/spec.md](../001-harmonogram-splat/spec.md).

## Kontekst

Umowa pozwala klientowi wybrać skutek nadpłaty: skrócenie okresu przy niezmienionej racie albo obniżenie raty przy niezmienionym okresie. Doradca pokazuje klientowi oba warianty obok siebie.

Stan wyjściowy (v0.1.0): tryb nadpłaty już istnieje (faza 6, `obnizRate` / `skrocOkres`), ale jest obowiązkowy; nadpłata bez trybu kończy się błędem. Karta wymaga trybu domyślnego „skróć okres”.

## Historia użytkownika: tryb przy każdej nadpłacie (Priorytet: P1)

Doradca dodaje nadpłatę i wybiera tryb „skróć okres” albo „obniż ratę”; jeśli nie wybierze, obowiązuje „skróć okres”.

**Test niezależny**: przypadek testowy z karty w `tests/nadplata-tryb.test.ts`.

**Scenariusze akceptacji** (kredyt 300 000 zł, 240 rat równych, WIBOR 3M 4,55 % + 2,11 pp = 6,66 %, nadpłata 30 000 zł po 1. racie):

1. **Zakładając** nadpłatę bez podanego trybu, **gdy** liczę harmonogram, **wtedy** wynik jest identyczny jak dla „skróć okres”.
2. **Zakładając** tryb „obniż ratę”, **gdy** liczę harmonogram, **wtedy** rata przed nadpłatą wynosi 2 265,07 zł, saldo po 1. racie i nadpłacie 269 399,93 zł, nowa rata od 2. raty 2 038,11 zł, razem 240 rat.
3. **Zakładając** tryb „skróć okres”, **gdy** liczę harmonogram, **wtedy** rata 2 265,07 zł bez zmian, razem 196 rat (195 po nadpłacie), ostatnia rata wyrównująca 2 200,53 zł.
4. **Zakładając** dowolny tryb, **gdy** sumuję części kapitałowe i nadpłaty, **wtedy** suma równa się kwocie kredytu.

## Wymagania funkcjonalne

- **FR-A1**: Każda nadpłata MOŻE mieć tryb `obnizRate` albo `skrocOkres`; brak trybu MUSI oznaczać `skrocOkres` (w domenie i w API).
- **FR-A2**: Parametr API `nadplaty` MUSI przyjmować pozycję bez trybu: `numerRaty:kwota` (np. `1:30000`) obok `numerRaty:kwota:obniz|skroc`.
- **FR-A3**: Zachowanie trybów „obniż ratę” i „skróć okres” oraz niezmiennik sumy kapitału bez zmian względem FR-008–FR-010 z 001.
- **FR-A4**: README MUSI opisywać konwencję: nadpłata następuje po racie danego miesiąca, odsetki tej raty liczone są od salda sprzed nadpłaty.

## Kryteria sukcesu

- **SC-A1**: Test `nadplata.tryb` z liczbami z karty przechodzi, reszta testów zielona.
- **SC-A2**: Produkcja po tagu `v0.2.0` zwraca dla `nadplaty=1:30000` ten sam harmonogram co dla `nadplaty=1:30000:skroc`. (API bierze WIBOR 3M z `dane/`, nie stałe 4,55 % z karty, więc liczba rat różni się od 196; liczby z karty sprawdza test domeny ze stałą serią.)

## Założenia

- Ekran już ma wybór trybu przy każdej nadpłacie z domyślnym „skróć okres”; zmiana ekranu nie jest potrzebna.
- Rekompensata za nadpłatę (art. 40) poza zakresem.
