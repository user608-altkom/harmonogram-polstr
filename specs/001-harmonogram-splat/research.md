# Badania i decyzje: harmonogram spłat

Wszystkie niejasności z kontekstu technicznego są rozstrzygnięte poniżej (przyjęte w PLAN-REALIZACJI.md, pkt 5).

## D1. Wartość wskaźnika dla raty

- **Decyzja**: POLSTR 1M: wpis serii obowiązujący w dniu raty *n*. WIBOR 3M: wpis obowiązujący w dniu raty otwierającej kwartał, czyli raty 1 + 3·⌊(*n*−1)/3⌋; wartość trzymana przez 3 raty.
- **Uzasadnienie**: BRIEF mówi „POLSTR 1M zmienia się co miesiąc w dniu raty, WIBOR 3M co kwartał”; kwartał liczony od pierwszej raty jest najprostszy i nie wymaga kalendarza kwartałów.
- **Alternatywy**: wartość z początku okresu odsetkowego (dzień poprzedniej raty); kwartały kalendarzowe dla WIBOR. Odrzucone jako bardziej złożone bez wymogu w BRIEF.

## D2. Wybór wpisu serii

- **Decyzja**: ostatni wpis z `od <= data` (porównanie napisów YYYY-MM-DD). Data przed pierwszym wpisem to błąd. Po ostatnim wpisie obowiązuje ostatni.
- **Uzasadnienie**: reguła z README („wpis obowiązuje od dnia `od` do dnia przed kolejnym”). Napisy ISO porównują się leksykograficznie.

## D3. Daty rat

- **Decyzja**: rata *n* = pierwsza rata + (*n*−1) miesięcy, ten sam dzień miesiąca, a w krótszym miesiącu jego ostatni dzień. Arytmetyka na roku, miesiącu i dniu, bez obiektu `Date`.
- **Uzasadnienie**: domena bez zależności od strefy czasowej (Vercel działa w UTC).

## D4. Rata równa i zaokrąglanie

- **Decyzja**: annuitet A = S·r / (1 − (1+r)^−N), r = stopa roczna / 12, zaokrąglony do grosza. Odsetki okresu = zaokrąglenie(S·r). Część kapitałowa = A − odsetki. Ostatnia rata: część kapitałowa = całe saldo. A przeliczamy tylko przy zmianie stopy i po nadpłacie „obniż ratę”, nie co miesiąc (inaczej zaokrąglenia przesuwałyby ratę o grosz). Przy r = 0: A = S / N.
- **Liczba kontrolna** (sprawdzona): 400 000 zł, 300 rat, 3,55 % + 2,11 pp → A = 2 494,72 zł, ostatnia rata 2 492,53 zł. Z pliku (3,55472 %) A = 2 495,85 zł.
- **Alternatywy**: odsetki dzienne (rzeczywista liczba dni / 365) — odrzucone, BRIEF wymaga saldo × stopa / 12.

## D5. Rata malejąca

- **Decyzja**: część kapitałowa K = zaokrąglenie(S / N), stała; ostatnia rata spłaca resztę salda. Po nadpłacie „obniż ratę” K = zaokrąglenie(S / pozostałe raty).
- **Liczba kontrolna**: 400 000 zł, 300 rat, 5,66 % → K = 1 333,33 zł, odsetki pierwszej raty 1 886,67 zł, pierwsza rata 3 220,00 zł, ostatnia część kapitałowa 1 334,33 zł (400 000,00 − 299 × 1 333,33).

## D6. Nadpłaty

- **Decyzja**: nadpłata po racie *m* zmniejsza saldo po racie *m*; kilka nadpłat po tej samej racie stosujemy po kolei. „Obniż ratę”: liczba rat bez zmian, rata (albo K) przeliczona od nowego salda i liczby pozostałych rat. „Skróć okres”: rata (albo K) bez zmian, harmonogram kończy się wcześniej, ostatnia rata wyrównuje. Nowa planowana liczba rat, liczona od salda po nadpłacie: przy ratach równych ⌈−ln(1 − S·r/A) / ln(1+r)⌉ (dla r = 0: ⌈S/A⌉), przy malejących ⌈S/K⌉. Nadpłata większa niż saldo, numer raty spoza 1..N albo po spłaceniu kredytu to błąd.
- **Przy zmianie stopy po „skróć okres”**: annuitet przeliczamy na liczbę pozostałych rat ze skróconego harmonogramu.
- **Niezmiennik**: Σ części kapitałowych + Σ nadpłat = kwota kredytu.

## D7. Kontrakt API i jednostki

- **Decyzja**: wejście w złotych i punktach procentowych (przyjazne dla formularza), przeliczane w route handlerze; wyjście w groszach (pola `…Gr`), formatowanie w ekranie. Nadpłaty: `nadplaty=12:10000:obniz,24:5000:skroc`.
- **Uzasadnienie**: zasada II konstytucji — przeliczenie jednostek to parsowanie kontraktu, nie obliczenie.

## D8. Ekran

- **Decyzja**: jeden komponent `'use client'` z Tailwind, `fetch('/api/harmonogram?…')`, CSV budowany w przeglądarce (`Blob`, separator `;`, przecinek dziesiętny, BOM UTF-8 dla Excela). Wygląd można podmienić eksportem z Claude Design, zachowując kontrakt.
- **Alternatywy**: biblioteka tabel/CSV — odrzucone (brak nowych zależności).
