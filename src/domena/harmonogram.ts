/**
 * Moduł domenowy kalkulatora harmonogramu spłat: czyste funkcje, bez React i bez I/O.
 *
 * Konwencje (specs/001-harmonogram-splat/research.md):
 * - kwoty w groszach jako liczby całkowite, zaokrąglane wyłącznie w `zaokraglijDoGrosza`,
 * - stopy jako ułamki, odsetki za okres = saldo × stopa roczna / 12,
 * - daty jako napisy YYYY-MM-DD liczone arytmetycznie, bez obiektu Date.
 */

import type { WpisSerii } from '../dane/wskazniki';

export type TrybNadplaty = 'obnizRate' | 'skrocOkres';

export interface Nadplata {
  /** Numer raty, po której zapłacie następuje nadpłata. */
  numerRaty: number;
  /** Kwota nadpłaty w groszach (liczba całkowita dodatnia). */
  kwotaGr: number;
  /** `obnizRate`: ta sama liczba rat, niższa rata; `skrocOkres`: ta sama rata, mniej rat. */
  tryb: TrybNadplaty;
}

export interface ParametryKredytu {
  /** Kwota kredytu w groszach (liczba całkowita). */
  kwotaGr: number;
  liczbaRat: number;
  /** Marża banku jako ułamek, np. 0.0211 dla 2,11 pp. */
  marza: number;
  typRat: 'rowne' | 'malejace';
  wskaznik: 'POLSTR_1M' | 'WIBOR_3M';
  /** Data pierwszej raty w formacie YYYY-MM-DD. */
  pierwszaRata: string;
  nadplaty?: Nadplata[];
}

export interface Rata {
  numer: number;
  data: string;
  /** Wskaźnik plus marża, ułamek. */
  stopaRoczna: number;
  czescKapitalowaGr: number;
  czescOdsetkowaGr: number;
  /** Część kapitałowa plus odsetkowa, bez nadpłaty. */
  rataGr: number;
  nadplataGr: number;
  saldoPoSplacieGr: number;
}

export interface Harmonogram {
  raty: Rata[];
  sumaOdsetekGr: number;
  rataPierwszaGr: number;
  rataOstatniaGr: number;
}

/** Błąd danych wejściowych; route handler zamienia go na status 400. */
export class BladParametrow extends Error {
  override name = 'BladParametrow';
}

const MIESIECY_W_ROKU = 12;
const WZORZEC_DATY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Jedyne miejsce zaokrąglania do grosza w całym module. */
export function zaokraglijDoGrosza(kwota: number): number {
  return Math.round(kwota) + 0;
}

function dniWMiesiacu(rok: number, miesiac: number): number {
  if (miesiac === 2) {
    const przestepny = (rok % 4 === 0 && rok % 100 !== 0) || rok % 400 === 0;
    return przestepny ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(miesiac) ? 30 : 31;
}

function rozbierzDate(data: string): { rok: number; miesiac: number; dzien: number } {
  const dopasowanie = WZORZEC_DATY.exec(data);
  if (!dopasowanie) throw new BladParametrow(`data: oczekiwano YYYY-MM-DD, otrzymano „${data}”`);
  const rok = Number(dopasowanie[1]);
  const miesiac = Number(dopasowanie[2]);
  const dzien = Number(dopasowanie[3]);
  if (miesiac < 1 || miesiac > 12 || dzien < 1 || dzien > dniWMiesiacu(rok, miesiac)) {
    throw new BladParametrow(`data: nieistniejący dzień „${data}”`);
  }
  return { rok, miesiac, dzien };
}

/** Data raty o podanym numerze: ten sam dzień miesiąca, w krótszym miesiącu jego ostatni dzień. */
export function dataRaty(pierwszaRata: string, numer: number): string {
  const { rok, miesiac, dzien } = rozbierzDate(pierwszaRata);
  const miesiacLiczonyOdZera = miesiac - 1 + (numer - 1);
  const rokRaty = rok + Math.floor(miesiacLiczonyOdZera / MIESIECY_W_ROKU);
  const miesiacRaty = (miesiacLiczonyOdZera % MIESIECY_W_ROKU) + 1;
  const dzienRaty = Math.min(dzien, dniWMiesiacu(rokRaty, miesiacRaty));
  return `${rokRaty}-${String(miesiacRaty).padStart(2, '0')}-${String(dzienRaty).padStart(2, '0')}`;
}

/**
 * Stopa wskaźnika obowiązująca w danym dniu: ostatni wpis serii z `od <= data`.
 * Seria musi być uporządkowana rosnąco po `od`; dla danych z `dane/` pilnuje tego tests/smoke.test.ts.
 */
export function stopaWskaznikaNaDzien(seria: WpisSerii[], data: string): number {
  let obowiazujacy: WpisSerii | undefined;
  for (const wpis of seria) {
    if (wpis.od <= data) obowiazujacy = wpis;
    else break;
  }
  if (!obowiazujacy) throw new BladParametrow(`brak wartości wskaźnika na dzień ${data}`);
  return obowiazujacy.stopa;
}

/** Rata annuitetowa w groszach dla salda, stopy rocznej i liczby pozostałych rat. */
export function rataAnnuitetowa(saldoGr: number, stopaRoczna: number, liczbaRat: number): number {
  const stopaMiesieczna = stopaRoczna / MIESIECY_W_ROKU;
  if (stopaMiesieczna === 0) return zaokraglijDoGrosza(saldoGr / liczbaRat);
  return zaokraglijDoGrosza((saldoGr * stopaMiesieczna) / (1 - Math.pow(1 + stopaMiesieczna, -liczbaRat)));
}

function sprawdzParametry(parametry: ParametryKredytu): void {
  if (!Number.isInteger(parametry.kwotaGr) || parametry.kwotaGr <= 0) {
    throw new BladParametrow('kwota: liczba dodatnia');
  }
  if (!Number.isInteger(parametry.liczbaRat) || parametry.liczbaRat <= 0) {
    throw new BladParametrow('liczba rat: liczba całkowita dodatnia');
  }
  if (!Number.isFinite(parametry.marza) || parametry.marza < 0) {
    throw new BladParametrow('marża: ułamek nieujemny');
  }
  if (parametry.typRat !== 'rowne' && parametry.typRat !== 'malejace') {
    throw new BladParametrow('typ rat: rowne albo malejace');
  }
  rozbierzDate(parametry.pierwszaRata);
  for (const nadplata of parametry.nadplaty ?? []) {
    if (
      !Number.isInteger(nadplata.numerRaty) ||
      nadplata.numerRaty < 1 ||
      nadplata.numerRaty > parametry.liczbaRat
    ) {
      throw new BladParametrow(`nadpłata: numer raty od 1 do ${parametry.liczbaRat}`);
    }
    if (!Number.isInteger(nadplata.kwotaGr) || nadplata.kwotaGr <= 0) {
      throw new BladParametrow('nadpłata: kwota dodatnia');
    }
    if (nadplata.tryb !== 'obnizRate' && nadplata.tryb !== 'skrocOkres') {
      throw new BladParametrow('nadpłata: tryb obnizRate albo skrocOkres');
    }
  }
}

/**
 * Numer raty, w której dniu odczytujemy wskaźnik dla raty `numer`:
 * POLSTR 1M zmienia się co miesiąc, więc funkcja zwraca po prostu `numer`;
 * WIBOR 3M zmienia się co kwartał liczony od pierwszej raty, więc zwraca 1, 4, 7, … (początek kwartału).
 */
function numerRatyUstalajacejStope(wskaznik: ParametryKredytu['wskaznik'], numer: number): number {
  if (wskaznik === 'WIBOR_3M') return numer - ((numer - 1) % 3);
  return numer;
}

/** Harmonogram spłat dla parametrów kredytu i serii wskaźnika. */
export function policzHarmonogram(parametry: ParametryKredytu, seria: WpisSerii[]): Harmonogram {
  sprawdzParametry(parametry);

  const nadplaty = parametry.nadplaty ?? [];
  const raty: Rata[] = [];
  let saldoGr = parametry.kwotaGr;
  // Liczba rat maleje po nadpłacie w trybie „skróć okres”.
  let planowanaLiczbaRat = parametry.liczbaRat;
  // Wartość wskaźnika z poprzedniej raty; undefined wymusza wyliczenie raty równej w pierwszej iteracji,
  // więc początkowe 0 w rataRownaGr nigdy nie trafia do wyniku.
  let wskaznikPoprzedniejRaty: number | undefined;
  let rataRownaGr = 0;
  // Raty malejące: stała część kapitałowa, zmiana stopy wpływa tylko na odsetki.
  let czescKapitalowaMalejacaGr = zaokraglijDoGrosza(parametry.kwotaGr / parametry.liczbaRat);
  // Nadpłata w trybie „obniż ratę” wymusza przeliczenie raty przed kolejną ratą.
  let wymusPrzeliczenieRaty = false;

  for (let numer = 1; numer <= planowanaLiczbaRat; numer++) {
    const pozostaleRaty = planowanaLiczbaRat - numer + 1;
    const dataWskaznika = dataRaty(parametry.pierwszaRata, numerRatyUstalajacejStope(parametry.wskaznik, numer));
    // Porównujemy wartość wprost z serii (bez arytmetyki), więc zmiana wpisu zawsze wymusza przeliczenie.
    const wartoscWskaznika = stopaWskaznikaNaDzien(seria, dataWskaznika);
    const stopaRoczna = wartoscWskaznika + parametry.marza;
    if (parametry.typRat === 'rowne' && (wymusPrzeliczenieRaty || wartoscWskaznika !== wskaznikPoprzedniejRaty)) {
      rataRownaGr = rataAnnuitetowa(saldoGr, stopaRoczna, pozostaleRaty);
    }
    if (parametry.typRat === 'malejace' && wymusPrzeliczenieRaty) {
      czescKapitalowaMalejacaGr = zaokraglijDoGrosza(saldoGr / pozostaleRaty);
    }
    wskaznikPoprzedniejRaty = wartoscWskaznika;
    wymusPrzeliczenieRaty = false;

    const czescOdsetkowaGr = zaokraglijDoGrosza((saldoGr * stopaRoczna) / MIESIECY_W_ROKU);
    const planowanaCzescKapitalowaGr =
      parametry.typRat === 'rowne' ? rataRownaGr - czescOdsetkowaGr : czescKapitalowaMalejacaGr;
    const ostatnia = numer === planowanaLiczbaRat;
    const czescKapitalowaGr = ostatnia ? saldoGr : Math.min(saldoGr, planowanaCzescKapitalowaGr);
    saldoGr -= czescKapitalowaGr;

    let nadplataGr = 0;
    for (const nadplata of nadplaty) {
      if (nadplata.numerRaty !== numer) continue;
      if (nadplata.kwotaGr > saldoGr) {
        throw new BladParametrow(`nadpłata po racie ${numer}: kwota większa niż saldo ${saldoGr} gr`);
      }
      saldoGr -= nadplata.kwotaGr;
      nadplataGr += nadplata.kwotaGr;
      if (nadplata.tryb === 'obnizRate') {
        wymusPrzeliczenieRaty = true;
      } else {
        const ratDoSplaty =
          parametry.typRat === 'rowne'
            ? liczbaRatAnnuitetu(saldoGr, stopaRoczna, rataRownaGr)
            : Math.ceil(saldoGr / czescKapitalowaMalejacaGr);
        planowanaLiczbaRat = Math.min(planowanaLiczbaRat, numer + ratDoSplaty);
      }
    }

    raty.push({
      numer,
      data: dataRaty(parametry.pierwszaRata, numer),
      stopaRoczna,
      czescKapitalowaGr,
      czescOdsetkowaGr,
      rataGr: czescKapitalowaGr + czescOdsetkowaGr,
      nadplataGr,
      saldoPoSplacieGr: saldoGr,
    });

    if (saldoGr === 0) break;
  }

  const poOstatniejRacie = nadplaty.find((nadplata) => nadplata.numerRaty > raty.length);
  if (poOstatniejRacie) {
    throw new BladParametrow(
      `nadpłata po racie ${poOstatniejRacie.numerRaty}: kredyt jest spłacony po racie ${raty.length}`,
    );
  }

  return podsumuj(raty);
}

/**
 * Liczba rat annuitetowych potrzebnych do spłaty salda przy danej racie: ⌈−ln(1 − S·r/A) / ln(1 + r)⌉.
 * Tolerancja 1e-9 chroni przed dodatkową ratą z samego błędu zmiennoprzecinkowego.
 */
export function liczbaRatAnnuitetu(saldoGr: number, stopaRoczna: number, rataGr: number): number {
  if (saldoGr === 0) return 0;
  const stopaMiesieczna = stopaRoczna / MIESIECY_W_ROKU;
  if (stopaMiesieczna === 0) return Math.ceil(saldoGr / rataGr);
  const liczba = -Math.log(1 - (saldoGr * stopaMiesieczna) / rataGr) / Math.log(1 + stopaMiesieczna);
  // Rata nie pokrywa odsetek: skrócenie jest niewykonalne, zostaje dotychczasowa liczba rat.
  if (!Number.isFinite(liczba)) return Number.POSITIVE_INFINITY;
  return Math.ceil(liczba - 1e-9);
}

function podsumuj(raty: Rata[]): Harmonogram {
  return {
    raty,
    sumaOdsetekGr: raty.reduce((suma, rata) => suma + rata.czescOdsetkowaGr, 0),
    rataPierwszaGr: raty[0]?.rataGr ?? 0,
    rataOstatniaGr: raty[raty.length - 1]?.rataGr ?? 0,
  };
}
