import { NextResponse } from 'next/server';
import { seriaWskaznika } from '../../../src/dane/wskazniki';
import {
  BladParametrow,
  policzHarmonogram,
  type Nadplata,
  type ParametryKredytu,
  type TrybNadplaty,
} from '../../../src/domena/harmonogram';

// Route handler jest cienki: parsuje parametry z query string, woła domenę, zwraca JSON.
// Żadnych obliczeń finansowych w tym pliku. Przeliczenie jednostek wejścia
// (złote na grosze, punkty procentowe na ułamek) to część parsowania kontraktu API.

const PRZYKLAD =
  '/api/harmonogram?kwota=400000&liczbaRat=300&marza=2.11&wskaznik=POLSTR_1M&typRat=rowne&pierwszaRata=2026-10-01';

// Krótkie klucze `obniz` i `skroc` to format kontraktu query string (contracts/api-harmonogram.md),
// mapowane na pełne nazwy domenowe `TrybNadplaty`.
const TRYBY_NADPLATY: Record<string, TrybNadplaty> = { obniz: 'obnizRate', skroc: 'skrocOkres' };

/** Parametr `nadplaty=12:10000:obniz,24:5000` (numer raty:kwota w złotych[:tryb], bez trybu „skróć okres”). */
function parsujNadplaty(tekst: string | null): Nadplata[] | string {
  if (!tekst) return [];
  const nadplaty: Nadplata[] = [];
  for (const pozycja of tekst.split(',')) {
    const [numer, kwota, tryb, ...nadmiar] = pozycja.split(':');
    const numerRaty = Number(numer);
    const kwotaZl = Number(kwota);
    // Tryb jest opcjonalny (CR-A): bez niego domena przyjmuje „skróć okres”.
    const trybNadplaty = tryb === undefined ? undefined : TRYBY_NADPLATY[tryb];
    const zaDuzoCzlonow = nadmiar.length > 0;
    const zlyNumerRaty = !Number.isInteger(numerRaty);
    const zlaKwota = !Number.isFinite(kwotaZl) || kwotaZl <= 0;
    // Pusty albo nieznany tryb (np. „12:10000:” albo „12:10000:xyz”) to błąd, a nie tryb domyślny.
    const zlyTryb = tryb !== undefined && !trybNadplaty;
    if (zaDuzoCzlonow || zlyNumerRaty || zlaKwota || zlyTryb) {
      return `nadplaty: lista numerRaty:kwota[:obniz|skroc] rozdzielona przecinkami, np. 12:10000:obniz,24:5000 (błąd w „${pozycja}”)`;
    }
    const kwotaGr = Math.round(kwotaZl * 100);
    nadplaty.push(trybNadplaty ? { numerRaty, kwotaGr, tryb: trybNadplaty } : { numerRaty, kwotaGr });
  }
  return nadplaty;
}

function parsujParametry(szukane: URLSearchParams): ParametryKredytu | string {
  const kwota = Number(szukane.get('kwota'));
  const liczbaRat = Number(szukane.get('liczbaRat'));
  const marza = Number(szukane.get('marza'));
  const wskaznik = szukane.get('wskaznik');
  const typRat = szukane.get('typRat');
  const pierwszaRata = szukane.get('pierwszaRata') ?? '';

  if (!Number.isFinite(kwota) || kwota <= 0) return 'kwota: liczba dodatnia w złotych, np. 400000';
  if (!Number.isInteger(liczbaRat) || liczbaRat <= 0) return 'liczbaRat: liczba całkowita dodatnia, np. 300';
  if (!Number.isFinite(marza) || marza < 0) return 'marza: punkty procentowe, np. 2.11';
  if (wskaznik !== 'POLSTR_1M' && wskaznik !== 'WIBOR_3M') return 'wskaznik: POLSTR_1M albo WIBOR_3M';
  if (typRat !== 'rowne' && typRat !== 'malejace') return 'typRat: rowne albo malejace';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pierwszaRata)) return 'pierwszaRata: data YYYY-MM-DD';
  const nadplaty = parsujNadplaty(szukane.get('nadplaty'));
  if (typeof nadplaty === 'string') return nadplaty;

  return {
    kwotaGr: Math.round(kwota * 100),
    liczbaRat,
    marza: marza / 100,
    wskaznik,
    typRat,
    pierwszaRata,
    nadplaty,
  };
}

export function GET(request: Request) {
  const parametry = parsujParametry(new URL(request.url).searchParams);
  if (typeof parametry === 'string') {
    return NextResponse.json({ blad: parametry, przyklad: PRZYKLAD }, { status: 400 });
  }

  try {
    return NextResponse.json(policzHarmonogram(parametry, seriaWskaznika(parametry.wskaznik)));
  } catch (blad) {
    if (blad instanceof BladParametrow) {
      return NextResponse.json({ blad: blad.message, przyklad: PRZYKLAD }, { status: 400 });
    }
    throw blad;
  }
}
