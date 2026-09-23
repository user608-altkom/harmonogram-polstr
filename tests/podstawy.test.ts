import { describe, expect, it } from 'vitest';
import {
  BladParametrow,
  dataRaty,
  rataAnnuitetowa,
  stopaWskaznikaNaDzien,
  zaokraglijDoGrosza,
} from '../src/domena/harmonogram';

describe('zaokraglijDoGrosza', () => {
  it('zaokrągla ułamek grosza do najbliższego grosza', () => {
    expect(zaokraglijDoGrosza(188666.67)).toBe(188667);
    expect(zaokraglijDoGrosza(133333.33)).toBe(133333);
    expect(zaokraglijDoGrosza(100.5)).toBe(101);
  });

  it('nie zmienia liczb całkowitych i nie zwraca ujemnego zera', () => {
    expect(zaokraglijDoGrosza(249472)).toBe(249472);
    expect(Object.is(zaokraglijDoGrosza(-0.2), 0)).toBe(true);
  });
});

describe('dataRaty', () => {
  it('pierwsza rata ma datę pierwszej raty', () => {
    expect(dataRaty('2026-10-01', 1)).toBe('2026-10-01');
  });

  it('kolejne raty przypadają co miesiąc, z przejściem roku', () => {
    expect(dataRaty('2026-10-01', 2)).toBe('2026-11-01');
    expect(dataRaty('2026-10-01', 4)).toBe('2027-01-01');
    expect(dataRaty('2026-10-01', 300)).toBe('2051-09-01');
  });

  it('dzień 31 w krótszym miesiącu przechodzi na ostatni dzień miesiąca', () => {
    expect(dataRaty('2027-01-31', 2)).toBe('2027-02-28');
    expect(dataRaty('2027-01-31', 3)).toBe('2027-03-31');
    expect(dataRaty('2027-01-31', 4)).toBe('2027-04-30');
    expect(dataRaty('2028-01-30', 2)).toBe('2028-02-29');
  });
});

describe('stopaWskaznikaNaDzien', () => {
  const seria = [
    { od: '2026-01-01', stopa: 0.05 },
    { od: '2026-02-01', stopa: 0.04 },
  ];

  it('w dniu wpisu obowiązuje nowy wpis, dzień wcześniej poprzedni', () => {
    expect(stopaWskaznikaNaDzien(seria, '2026-02-01')).toBe(0.04);
    expect(stopaWskaznikaNaDzien(seria, '2026-01-31')).toBe(0.05);
    expect(stopaWskaznikaNaDzien(seria, '2026-01-01')).toBe(0.05);
  });

  it('po ostatnim wpisie obowiązuje ostatnia znana wartość', () => {
    expect(stopaWskaznikaNaDzien(seria, '2040-06-15')).toBe(0.04);
  });

  it('data przed pierwszym wpisem to błąd parametrów', () => {
    expect(() => stopaWskaznikaNaDzien(seria, '2025-12-31')).toThrow(BladParametrow);
  });
});

describe('rataAnnuitetowa', () => {
  it('liczba kontrolna z BRIEF.md: 400 000 zł, 300 rat, 5,66 % → 2 494,72 zł', () => {
    expect(rataAnnuitetowa(400_000_00, 0.0355 + 0.0211, 300)).toBe(249472);
  });

  it('przy stopie zerowej dzieli saldo przez liczbę rat', () => {
    expect(rataAnnuitetowa(300_00, 0, 3)).toBe(100_00);
  });
});
