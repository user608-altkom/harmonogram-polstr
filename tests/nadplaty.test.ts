import { describe, expect, it } from 'vitest';
import {
  BladParametrow,
  policzHarmonogram,
  rataAnnuitetowa,
  zaokraglijDoGrosza,
  type Harmonogram,
  type Nadplata,
  type ParametryKredytu,
} from '../src/domena/harmonogram';

const SERIA_STALA = [{ od: '2000-01-01', stopa: 0.0355 }];
const STOPA = 0.0355 + 0.0211;

const ROWNE: ParametryKredytu = {
  kwotaGr: 400_000_00,
  liczbaRat: 300,
  marza: 0.0211,
  typRat: 'rowne',
  wskaznik: 'POLSTR_1M',
  pierwszaRata: '2026-10-01',
};
const MALEJACE: ParametryKredytu = { ...ROWNE, typRat: 'malejace' };

function nadplata(tryb: Nadplata['tryb'], kwotaGr = 10_000_00, numerRaty = 12): Nadplata {
  return { numerRaty, kwotaGr, tryb };
}

function sumaKapitaluINadplat(harmonogram: Harmonogram): number {
  return harmonogram.raty.reduce((suma, rata) => suma + rata.czescKapitalowaGr + rata.nadplataGr, 0);
}

function sprawdzNiezmienniki(harmonogram: Harmonogram): void {
  expect(sumaKapitaluINadplat(harmonogram)).toBe(400_000_00);
  expect(harmonogram.raty[harmonogram.raty.length - 1]?.saldoPoSplacieGr).toBe(0);
}

describe('nadpłaty przy ratach równych', () => {
  const bezNadplat = policzHarmonogram(ROWNE, SERIA_STALA);

  it('obniż ratę: 10 000 zł po racie 12 → nadal 300 rat, niższa rata przeliczona na 288 rat', () => {
    const harmonogram = policzHarmonogram({ ...ROWNE, nadplaty: [nadplata('obnizRate')] }, SERIA_STALA);
    const dwunasta = harmonogram.raty[11];
    expect(dwunasta?.nadplataGr).toBe(10_000_00);
    expect(dwunasta?.saldoPoSplacieGr).toBe((bezNadplat.raty[11]?.saldoPoSplacieGr ?? 0) - 10_000_00);
    expect(harmonogram.raty).toHaveLength(300);
    const nowaRata = rataAnnuitetowa(dwunasta?.saldoPoSplacieGr ?? 0, STOPA, 288);
    expect(harmonogram.raty[12]?.rataGr).toBe(nowaRata);
    expect(harmonogram.raty[100]?.rataGr).toBe(nowaRata);
    expect(nowaRata).toBeLessThan(249472);
    expect(harmonogram.sumaOdsetekGr).toBeLessThan(bezNadplat.sumaOdsetekGr);
    sprawdzNiezmienniki(harmonogram);
  });

  it('skróć okres: ta sama nadpłata → rata 2 494,72 zł bez zmian, mniej rat, niższe odsetki', () => {
    const harmonogram = policzHarmonogram({ ...ROWNE, nadplaty: [nadplata('skrocOkres')] }, SERIA_STALA);
    expect(harmonogram.raty[12]?.rataGr).toBe(249472);
    expect(harmonogram.raty.length).toBeLessThan(300);
    expect(harmonogram.raty.length).toBeGreaterThan(250);
    expect(harmonogram.rataOstatniaGr).toBeLessThanOrEqual(249472);
    expect(harmonogram.rataOstatniaGr).toBeGreaterThan(0);
    const obnizRate = policzHarmonogram({ ...ROWNE, nadplaty: [nadplata('obnizRate')] }, SERIA_STALA);
    expect(harmonogram.sumaOdsetekGr).toBeLessThan(obnizRate.sumaOdsetekGr);
    sprawdzNiezmienniki(harmonogram);
  });

  it('kilka nadpłat po tej samej racie sumuje się w polu nadpłaty', () => {
    const harmonogram = policzHarmonogram(
      { ...ROWNE, nadplaty: [nadplata('obnizRate', 1_000_00), nadplata('skrocOkres', 2_000_00)] },
      SERIA_STALA,
    );
    expect(harmonogram.raty[11]?.nadplataGr).toBe(3_000_00);
    sprawdzNiezmienniki(harmonogram);
  });

  it('nadpłata równa saldu kończy harmonogram na tej racie', () => {
    const saldoPoDwunastej = bezNadplat.raty[11]?.saldoPoSplacieGr ?? 0;
    const harmonogram = policzHarmonogram(
      { ...ROWNE, nadplaty: [nadplata('skrocOkres', saldoPoDwunastej)] },
      SERIA_STALA,
    );
    expect(harmonogram.raty).toHaveLength(12);
    sprawdzNiezmienniki(harmonogram);
  });
});

describe('nadpłaty przy ratach malejących', () => {
  it('obniż ratę: część kapitałowa przeliczona od salda na 288 rat', () => {
    const harmonogram = policzHarmonogram({ ...MALEJACE, nadplaty: [nadplata('obnizRate')] }, SERIA_STALA);
    const saldo = 400_000_00 - 12 * 133333 - 10_000_00;
    expect(harmonogram.raty[11]?.saldoPoSplacieGr).toBe(saldo);
    expect(harmonogram.raty).toHaveLength(300);
    expect(harmonogram.raty[12]?.czescKapitalowaGr).toBe(zaokraglijDoGrosza(saldo / 288));
    sprawdzNiezmienniki(harmonogram);
  });

  it('skróć okres: część kapitałowa 1 333,33 zł bez zmian, 293 raty', () => {
    const harmonogram = policzHarmonogram({ ...MALEJACE, nadplaty: [nadplata('skrocOkres')] }, SERIA_STALA);
    expect(harmonogram.raty[12]?.czescKapitalowaGr).toBe(133333);
    // saldo 374 000,04 zł / 1 333,33 zł = 280,5 → 281 rat po nadpłacie
    expect(harmonogram.raty).toHaveLength(12 + 281);
    sprawdzNiezmienniki(harmonogram);
  });
});

describe('walidacja nadpłat', () => {
  it.each([
    ['większa niż saldo', nadplata('obnizRate', 500_000_00)],
    ['numer raty 0', nadplata('obnizRate', 1_000_00, 0)],
    ['numer raty poza harmonogramem', nadplata('obnizRate', 1_000_00, 301)],
    ['kwota zerowa', nadplata('obnizRate', 0)],
  ])('%s → BladParametrow', (_opis, blednaNadplata) => {
    expect(() => policzHarmonogram({ ...ROWNE, nadplaty: [blednaNadplata] }, SERIA_STALA)).toThrow(BladParametrow);
  });

  it('nadpłata po racie, której nie ma po skróceniu okresu → BladParametrow', () => {
    const nadplaty = [nadplata('skrocOkres', 200_000_00), nadplata('obnizRate', 1_000_00, 299)];
    expect(() => policzHarmonogram({ ...ROWNE, nadplaty }, SERIA_STALA)).toThrow(BladParametrow);
  });
});
