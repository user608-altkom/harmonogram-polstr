import { describe, expect, it } from 'vitest';
import { policzHarmonogram, type Harmonogram, type ParametryKredytu } from '../src/domena/harmonogram';

const SERIA_STALA = [{ od: '2000-01-01', stopa: 0.0355 }];

const LICZBA_KONTROLNA: ParametryKredytu = {
  kwotaGr: 400_000_00,
  liczbaRat: 300,
  marza: 0.0211,
  typRat: 'rowne',
  wskaznik: 'POLSTR_1M',
  pierwszaRata: '2026-10-01',
};

function sumaKapitalu(harmonogram: Harmonogram): number {
  return harmonogram.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr, 0);
}

describe('raty równe przy stałej stopie (liczba kontrolna z BRIEF.md)', () => {
  const harmonogram = policzHarmonogram(LICZBA_KONTROLNA, SERIA_STALA);

  it('rata równa wynosi 2 494,72 zł, ostatnia rata wyrównująca 2 492,53 zł', () => {
    expect(harmonogram.raty).toHaveLength(300);
    expect(Math.abs(harmonogram.rataPierwszaGr - 249472)).toBeLessThanOrEqual(5);
    expect(harmonogram.raty[298]?.rataGr).toBe(249472);
    expect(harmonogram.rataOstatniaGr).toBe(249253);
  });

  it('pierwsza rata: odsetki 1 886,67 zł, kapitał 608,05 zł, daty co miesiąc', () => {
    const pierwsza = harmonogram.raty[0];
    expect(pierwsza).toMatchObject({
      numer: 1,
      data: '2026-10-01',
      czescOdsetkowaGr: 188667,
      czescKapitalowaGr: 60805,
      rataGr: 249472,
      nadplataGr: 0,
      saldoPoSplacieGr: 400_000_00 - 60805,
    });
    expect(pierwsza?.stopaRoczna).toBeCloseTo(0.0566, 10);
    expect(harmonogram.raty[299]?.data).toBe('2051-09-01');
  });

  it('suma części kapitałowych równa kwocie, saldo końcowe zero, suma odsetek zgodna z ratami', () => {
    expect(sumaKapitalu(harmonogram)).toBe(400_000_00);
    expect(harmonogram.raty[299]?.saldoPoSplacieGr).toBe(0);
    const sumaOdsetek = harmonogram.raty.reduce((suma, rata) => suma + rata.czescOdsetkowaGr, 0);
    expect(harmonogram.sumaOdsetekGr).toBe(sumaOdsetek);
    for (const rata of harmonogram.raty) {
      expect(rata.rataGr).toBe(rata.czescKapitalowaGr + rata.czescOdsetkowaGr);
    }
  });

  it('jedna rata spłaca całą kwotę z odsetkami za miesiąc', () => {
    const jedna = policzHarmonogram({ ...LICZBA_KONTROLNA, liczbaRat: 1 }, SERIA_STALA);
    expect(jedna.raty).toHaveLength(1);
    expect(jedna.raty[0]).toMatchObject({ czescKapitalowaGr: 400_000_00, czescOdsetkowaGr: 188667, saldoPoSplacieGr: 0 });
  });

  it('przy stopie zerowej rata to kwota podzielona przez liczbę rat, ostatnia wyrównuje', () => {
    const zerowa = policzHarmonogram(
      { ...LICZBA_KONTROLNA, kwotaGr: 1000_00, liczbaRat: 3, marza: 0 },
      [{ od: '2000-01-01', stopa: 0 }],
    );
    expect(zerowa.raty.map((rata) => rata.rataGr)).toEqual([33333, 33333, 33334]);
    expect(zerowa.sumaOdsetekGr).toBe(0);
  });

  it('błędne parametry kończą się błędem', () => {
    expect(() => policzHarmonogram({ ...LICZBA_KONTROLNA, kwotaGr: 0 }, SERIA_STALA)).toThrow('kwota');
    expect(() => policzHarmonogram({ ...LICZBA_KONTROLNA, liczbaRat: 2.5 }, SERIA_STALA)).toThrow('liczba rat');
    expect(() => policzHarmonogram({ ...LICZBA_KONTROLNA, pierwszaRata: '1999-12-01' }, SERIA_STALA)).toThrow();
  });
});
