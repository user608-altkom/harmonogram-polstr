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
  kwotaGr: number;
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

/** Stopa wskaźnika obowiązująca w danym dniu: ostatni wpis serii z `od <= data`. */
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
  rozbierzDate(parametry.pierwszaRata);
}

/** Harmonogram spłat dla parametrów kredytu i serii wskaźnika. */
export function policzHarmonogram(parametry: ParametryKredytu, seria: WpisSerii[]): Harmonogram {
  sprawdzParametry(parametry);

  const stopaRoczna = stopaWskaznikaNaDzien(seria, parametry.pierwszaRata) + parametry.marza;
  const rataRownaGr = rataAnnuitetowa(parametry.kwotaGr, stopaRoczna, parametry.liczbaRat);

  const raty: Rata[] = [];
  let saldoGr = parametry.kwotaGr;

  for (let numer = 1; numer <= parametry.liczbaRat; numer++) {
    const czescOdsetkowaGr = zaokraglijDoGrosza((saldoGr * stopaRoczna) / MIESIECY_W_ROKU);
    const ostatnia = numer === parametry.liczbaRat;
    const czescKapitalowaGr = ostatnia ? saldoGr : Math.min(saldoGr, rataRownaGr - czescOdsetkowaGr);
    saldoGr -= czescKapitalowaGr;

    raty.push({
      numer,
      data: dataRaty(parametry.pierwszaRata, numer),
      stopaRoczna,
      czescKapitalowaGr,
      czescOdsetkowaGr,
      rataGr: czescKapitalowaGr + czescOdsetkowaGr,
      nadplataGr: 0,
      saldoPoSplacieGr: saldoGr,
    });
  }

  return podsumuj(raty);
}

function podsumuj(raty: Rata[]): Harmonogram {
  return {
    raty,
    sumaOdsetekGr: raty.reduce((suma, rata) => suma + rata.czescOdsetkowaGr, 0),
    rataPierwszaGr: raty[0]?.rataGr ?? 0,
    rataOstatniaGr: raty[raty.length - 1]?.rataGr ?? 0,
  };
}
