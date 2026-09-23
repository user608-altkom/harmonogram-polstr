import { describe, expect, it } from 'vitest';
import { BladParametrow, policzHarmonogram, type Harmonogram, type ParametryKredytu } from '../src/domena/harmonogram';

// Karta zmiany CR-A: 300 000 zł, 240 rat równych, WIBOR 3M 4,55 % + marża 2,11 pp = 6,66 %,
// nadpłata 30 000 zł po zaksięgowaniu 1. raty.
const SERIA_STALA = [{ od: '2000-01-01', stopa: 0.0455 }];

const KREDYT: ParametryKredytu = {
  kwotaGr: 300_000_00,
  liczbaRat: 240,
  marza: 0.0211,
  typRat: 'rowne',
  wskaznik: 'WIBOR_3M',
  pierwszaRata: '2026-10-01',
};

function sumaKapitaluINadplat(harmonogram: Harmonogram): number {
  return harmonogram.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr + rata.nadplataGr, 0);
}

describe('nadplata.tryb (karta zmiany CR-A)', () => {
  it('rata przed nadpłatą 2 265,07 zł, saldo po 1. racie i nadpłacie 269 399,93 zł', () => {
    const harmonogram = policzHarmonogram(
      { ...KREDYT, nadplaty: [{ numerRaty: 1, kwotaGr: 30_000_00, tryb: 'obnizRate' }] },
      SERIA_STALA,
    );
    expect(harmonogram.rataPierwszaGr).toBe(226507);
    expect(harmonogram.raty[0]?.nadplataGr).toBe(30_000_00);
    expect(harmonogram.raty[0]?.saldoPoSplacieGr).toBe(269_399_93);
  });

  it('„obniż ratę”: nowa rata od 2. raty 2 038,11 zł, razem 240 rat, suma kapitału = kwota', () => {
    const harmonogram = policzHarmonogram(
      { ...KREDYT, nadplaty: [{ numerRaty: 1, kwotaGr: 30_000_00, tryb: 'obnizRate' }] },
      SERIA_STALA,
    );
    expect(harmonogram.raty).toHaveLength(240);
    expect(harmonogram.raty[1]?.rataGr).toBe(203811);
    expect(harmonogram.raty[238]?.rataGr).toBe(203811);
    expect(sumaKapitaluINadplat(harmonogram)).toBe(300_000_00);
    expect(harmonogram.raty[239]?.saldoPoSplacieGr).toBe(0);
  });

  it('„skróć okres”: rata 2 265,07 zł bez zmian, 196 rat, ostatnia wyrównująca 2 200,53 zł', () => {
    const harmonogram = policzHarmonogram(
      { ...KREDYT, nadplaty: [{ numerRaty: 1, kwotaGr: 30_000_00, tryb: 'skrocOkres' }] },
      SERIA_STALA,
    );
    expect(harmonogram.raty).toHaveLength(196);
    expect(harmonogram.raty[1]?.rataGr).toBe(226507);
    expect(harmonogram.raty[194]?.rataGr).toBe(226507);
    expect(harmonogram.rataOstatniaGr).toBe(220053);
    expect(sumaKapitaluINadplat(harmonogram)).toBe(300_000_00);
    expect(harmonogram.raty[195]?.saldoPoSplacieGr).toBe(0);
  });

  it('brak trybu oznacza „skróć okres”', () => {
    const bezTrybu = policzHarmonogram(
      { ...KREDYT, nadplaty: [{ numerRaty: 1, kwotaGr: 30_000_00 }] },
      SERIA_STALA,
    );
    const skrocOkres = policzHarmonogram(
      { ...KREDYT, nadplaty: [{ numerRaty: 1, kwotaGr: 30_000_00, tryb: 'skrocOkres' }] },
      SERIA_STALA,
    );
    expect(bezTrybu).toEqual(skrocOkres);
    expect(bezTrybu.raty).toHaveLength(196);
  });

  it('nadpłata bez trybu po ostatniej racie (saldo zero) → BladParametrow', () => {
    expect(() =>
      policzHarmonogram({ ...KREDYT, nadplaty: [{ numerRaty: 240, kwotaGr: 1_00 }] }, SERIA_STALA),
    ).toThrow(BladParametrow);
  });
});
