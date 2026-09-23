import { describe, expect, it } from 'vitest';
import { policzHarmonogram, type ParametryKredytu } from '../src/domena/harmonogram';

const SERIA_STALA = [{ od: '2000-01-01', stopa: 0.0355 }];

const PARAMETRY: ParametryKredytu = {
  kwotaGr: 400_000_00,
  liczbaRat: 300,
  marza: 0.0211,
  typRat: 'malejace',
  wskaznik: 'POLSTR_1M',
  pierwszaRata: '2026-10-01',
};

describe('raty malejące przy stałej stopie 5,66 %', () => {
  const harmonogram = policzHarmonogram(PARAMETRY, SERIA_STALA);

  it('część kapitałowa 1 333,33 zł, ostatnia 1 334,33 zł, pierwsza rata 3 220,00 zł', () => {
    expect(harmonogram.raty).toHaveLength(300);
    for (const rata of harmonogram.raty.slice(0, 299)) {
      expect(rata.czescKapitalowaGr).toBe(133333);
    }
    expect(harmonogram.raty[299]?.czescKapitalowaGr).toBe(133433);
    expect(harmonogram.raty[0]?.czescOdsetkowaGr).toBe(188667);
    expect(harmonogram.rataPierwszaGr).toBe(322000);
  });

  it('raty nie rosną, suma kapitału równa kwocie, saldo końcowe zero', () => {
    for (let indeks = 1; indeks < 299; indeks++) {
      expect(harmonogram.raty[indeks]?.rataGr).toBeLessThanOrEqual(harmonogram.raty[indeks - 1]?.rataGr ?? 0);
    }
    const sumaKapitalu = harmonogram.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr, 0);
    expect(sumaKapitalu).toBe(400_000_00);
    expect(harmonogram.raty[299]?.saldoPoSplacieGr).toBe(0);
  });

  it('suma odsetek mniejsza niż przy ratach równych', () => {
    const rowne = policzHarmonogram({ ...PARAMETRY, typRat: 'rowne' }, SERIA_STALA);
    expect(harmonogram.sumaOdsetekGr).toBeLessThan(rowne.sumaOdsetekGr);
  });

  it('jedna rata malejąca: cały kapitał i odsetki za miesiąc (1 886,67 zł)', () => {
    const jedna = policzHarmonogram({ ...PARAMETRY, liczbaRat: 1 }, SERIA_STALA);
    expect(jedna.raty).toHaveLength(1);
    expect(jedna.raty[0]).toMatchObject({ czescKapitalowaGr: 400_000_00, czescOdsetkowaGr: 188667, rataGr: 401_886_67 });
  });

  it('zmiana wskaźnika zmienia odsetki, a nie część kapitałową', () => {
    const zmienny = policzHarmonogram(PARAMETRY, [
      { od: '2000-01-01', stopa: 0.06 },
      { od: '2027-01-01', stopa: 0.04 },
    ]);
    expect(zmienny.raty[3]?.czescKapitalowaGr).toBe(133333);
    expect(zmienny.raty[3]?.stopaRoczna).toBeCloseTo(0.0611, 10);
  });
});
