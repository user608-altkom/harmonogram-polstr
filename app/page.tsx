'use client';

// Ekran kalkulatora harmonogramu spłat. Cała logika obliczeń jest w src/domena/,
// ekran tylko zbiera parametry, woła GET /api/harmonogram i formatuje wynik.
// Wygląd można podmienić eksportem z Claude Design, zachowując kontrakt z
// specs/001-harmonogram-splat/contracts/api-harmonogram.md.

import { useState, type FormEvent } from 'react';

interface Rata {
  numer: number;
  data: string;
  stopaRoczna: number;
  czescKapitalowaGr: number;
  czescOdsetkowaGr: number;
  rataGr: number;
  nadplataGr: number;
  saldoPoSplacieGr: number;
}

interface Harmonogram {
  raty: Rata[];
  sumaOdsetekGr: number;
  rataPierwszaGr: number;
  rataOstatniaGr: number;
}

interface OdpowiedzBledu {
  blad: string;
}

function jestHarmonogramem(dane: unknown): dane is Harmonogram {
  if (typeof dane !== 'object' || dane === null) return false;
  const kandydat = dane as Partial<Record<keyof Harmonogram, unknown>>;
  return (
    Array.isArray(kandydat.raty) &&
    typeof kandydat.sumaOdsetekGr === 'number' &&
    typeof kandydat.rataPierwszaGr === 'number' &&
    typeof kandydat.rataOstatniaGr === 'number'
  );
}

function jestBledem(dane: unknown): dane is OdpowiedzBledu {
  return typeof dane === 'object' && dane !== null && typeof (dane as Partial<OdpowiedzBledu>).blad === 'string';
}

type TrybNadplaty = 'obniz' | 'skroc';

interface WierszNadplaty {
  id: number;
  numerRaty: string;
  kwota: string;
  tryb: TrybNadplaty;
}

const FORMAT_ZLOTYCH = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  // Polskie locale domyślnie nie grupuje liczb czterocyfrowych (2495,85); BRIEF wymaga separatora tysięcy.
  useGrouping: 'always',
});
const FORMAT_PROCENTU = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 4 });

function zlote(groszy: number): string {
  return `${FORMAT_ZLOTYCH.format(groszy / 100)} zł`;
}

function procent(ulamek: number): string {
  return `${FORMAT_PROCENTU.format(ulamek * 100)} %`;
}

/** Liczba z pola formularza: akceptuje przecinek dziesiętny i spacje tysięcy. */
function liczbaZPola(tekst: string): string {
  return tekst.replace(/\s/g, '').replace(',', '.');
}

function kwotaCsv(groszy: number): string {
  return (groszy / 100).toFixed(2).replace('.', ',');
}

function pobierzCsv(harmonogram: Harmonogram): void {
  const naglowek = ['Nr', 'Data', 'Stopa roczna %', 'Kapitał', 'Odsetki', 'Rata', 'Nadpłata', 'Saldo po spłacie'];
  const wiersze = harmonogram.raty.map((rata) =>
    [
      rata.numer,
      rata.data,
      (rata.stopaRoczna * 100).toFixed(4).replace('.', ','),
      kwotaCsv(rata.czescKapitalowaGr),
      kwotaCsv(rata.czescOdsetkowaGr),
      kwotaCsv(rata.rataGr),
      kwotaCsv(rata.nadplataGr),
      kwotaCsv(rata.saldoPoSplacieGr),
    ].join(';'),
  );
  const tresc = '﻿' + [naglowek.join(';'), ...wiersze].join('\r\n');
  const adres = URL.createObjectURL(new Blob([tresc], { type: 'text/csv;charset=utf-8' }));
  const odnosnik = document.createElement('a');
  odnosnik.href = adres;
  odnosnik.download = 'harmonogram.csv';
  odnosnik.click();
  URL.revokeObjectURL(adres);
}

const POLE = 'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
const ETYKIETA = 'flex flex-col gap-1 text-sm font-medium text-neutral-700';

export default function Strona() {
  const [kwota, ustawKwote] = useState('400000');
  const [liczbaRat, ustawLiczbeRat] = useState('300');
  const [pierwszaRata, ustawPierwszaRate] = useState('2026-10-01');
  const [marza, ustawMarze] = useState('2,11');
  const [wskaznik, ustawWskaznik] = useState<'POLSTR_1M' | 'WIBOR_3M'>('POLSTR_1M');
  const [typRat, ustawTypRat] = useState<'rowne' | 'malejace'>('rowne');
  const [nadplaty, ustawNadplaty] = useState<WierszNadplaty[]>([]);
  const [kolejneId, ustawKolejneId] = useState(1);

  const [harmonogram, ustawHarmonogram] = useState<Harmonogram | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [liczenie, ustawLiczenie] = useState(false);

  function dodajNadplate() {
    ustawNadplaty([...nadplaty, { id: kolejneId, numerRaty: '', kwota: '', tryb: 'skroc' }]);
    ustawKolejneId(kolejneId + 1);
  }

  function zmienNadplate(id: number, zmiana: Partial<WierszNadplaty>) {
    ustawNadplaty(nadplaty.map((wiersz) => (wiersz.id === id ? { ...wiersz, ...zmiana } : wiersz)));
  }

  async function policz(zdarzenie: FormEvent<HTMLFormElement>) {
    zdarzenie.preventDefault();
    const parametry = new URLSearchParams({
      kwota: liczbaZPola(kwota),
      liczbaRat: liczbaZPola(liczbaRat),
      marza: liczbaZPola(marza),
      wskaznik,
      typRat,
      pierwszaRata,
    });
    if (nadplaty.length > 0) {
      parametry.set(
        'nadplaty',
        nadplaty.map((wiersz) => `${liczbaZPola(wiersz.numerRaty)}:${liczbaZPola(wiersz.kwota)}:${wiersz.tryb}`).join(','),
      );
    }

    ustawLiczenie(true);
    ustawBlad(null);
    try {
      const odpowiedz = await fetch(`/api/harmonogram?${parametry.toString()}`);
      const dane: unknown = await odpowiedz.json();
      if (!odpowiedz.ok || !jestHarmonogramem(dane)) {
        ustawHarmonogram(null);
        ustawBlad(jestBledem(dane) ? dane.blad : `Nieoczekiwana odpowiedź serwera (status ${odpowiedz.status}).`);
        return;
      }
      ustawHarmonogram(dane);
    } catch {
      ustawHarmonogram(null);
      ustawBlad('Nie udało się połączyć z serwerem.');
    } finally {
      ustawLiczenie(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8 text-neutral-900">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold sm:text-3xl">Harmonogram spłat kredytu hipotecznego</h1>
        <p className="text-neutral-600">Oprocentowanie zmienne: POLSTR 1M albo WIBOR 3M plus marża banku.</p>
      </header>

      <form onSubmit={policz} className="flex flex-col gap-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className={ETYKIETA}>
            Kwota kredytu (zł)
            <input className={POLE} inputMode="decimal" value={kwota} onChange={(e) => ustawKwote(e.target.value)} required />
          </label>
          <label className={ETYKIETA}>
            Liczba rat
            <input className={POLE} inputMode="numeric" value={liczbaRat} onChange={(e) => ustawLiczbeRat(e.target.value)} required />
          </label>
          <label className={ETYKIETA}>
            Data pierwszej raty
            <input className={POLE} type="date" value={pierwszaRata} onChange={(e) => ustawPierwszaRate(e.target.value)} required />
          </label>
          <label className={ETYKIETA}>
            Marża (pp)
            <input className={POLE} inputMode="decimal" value={marza} onChange={(e) => ustawMarze(e.target.value)} required />
          </label>
          <label className={ETYKIETA}>
            Wskaźnik
            <select className={POLE} value={wskaznik} onChange={(e) => ustawWskaznik(e.target.value as 'POLSTR_1M' | 'WIBOR_3M')}>
              <option value="POLSTR_1M">POLSTR 1M</option>
              <option value="WIBOR_3M">WIBOR 3M</option>
            </select>
          </label>
          <label className={ETYKIETA}>
            Typ rat
            <select className={POLE} value={typRat} onChange={(e) => ustawTypRat(e.target.value as 'rowne' | 'malejace')}>
              <option value="rowne">równe</option>
              <option value="malejace">malejące</option>
            </select>
          </label>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-sm font-semibold text-neutral-800">Nadpłaty</legend>
          {nadplaty.length === 0 && <p className="text-sm text-neutral-500">Brak nadpłat.</p>}
          {nadplaty.map((wiersz) => (
            <div key={wiersz.id} className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
              <label className={ETYKIETA}>
                Po racie nr
                <input className={POLE} inputMode="numeric" placeholder="np. 12" required value={wiersz.numerRaty} onChange={(e) => zmienNadplate(wiersz.id, { numerRaty: e.target.value })} />
              </label>
              <label className={ETYKIETA}>
                Kwota (zł)
                <input className={POLE} inputMode="decimal" placeholder="np. 10000" required value={wiersz.kwota} onChange={(e) => zmienNadplate(wiersz.id, { kwota: e.target.value })} />
              </label>
              <label className={ETYKIETA}>
                Tryb
                <select className={POLE} value={wiersz.tryb} onChange={(e) => zmienNadplate(wiersz.id, { tryb: e.target.value as TrybNadplaty })}>
                  <option value="obniz">obniż ratę</option>
                  <option value="skroc">skróć okres</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => ustawNadplaty(nadplaty.filter((inny) => inny.id !== wiersz.id))}
                className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                Usuń
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={dodajNadplate}
            className="self-start rounded-md border border-dashed border-neutral-400 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            + Dodaj nadpłatę
          </button>
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={liczenie}
            className="rounded-md bg-emerald-700 px-6 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
          >
            {liczenie ? 'Liczę…' : 'Policz'}
          </button>
          {blad && (
            <p role="alert" className="text-sm text-red-700">
              {blad}
            </p>
          )}
        </div>
      </form>

      {harmonogram && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <Kafelek etykieta="Rata pierwsza" wartosc={zlote(harmonogram.rataPierwszaGr)} />
            <Kafelek etykieta="Rata ostatnia" wartosc={zlote(harmonogram.rataOstatniaGr)} />
            <Kafelek etykieta="Suma odsetek" wartosc={zlote(harmonogram.sumaOdsetekGr)} />
            <Kafelek etykieta="Liczba rat" wartosc={String(harmonogram.raty.length)} />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => pobierzCsv(harmonogram)}
              className="rounded-md border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              Eksport CSV
            </button>
          </div>

          <div className="max-h-[70vh] overflow-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-right text-sm tabular-nums">
              <thead className="sticky top-0 bg-neutral-100 text-neutral-700">
                <tr>
                  {['Nr', 'Data', 'Stopa', 'Kapitał', 'Odsetki', 'Rata', 'Nadpłata', 'Saldo'].map((naglowek) => (
                    <th key={naglowek} scope="col" className="px-3 py-2 font-semibold first:text-left">
                      {naglowek}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {harmonogram.raty.map((rata) => (
                  <tr key={rata.numer} className="border-t border-neutral-100 odd:bg-neutral-50/60">
                    <td className="px-3 py-1.5 text-left">{rata.numer}</td>
                    <td className="px-3 py-1.5">{rata.data}</td>
                    <td className="px-3 py-1.5">{procent(rata.stopaRoczna)}</td>
                    <td className="px-3 py-1.5">{zlote(rata.czescKapitalowaGr)}</td>
                    <td className="px-3 py-1.5">{zlote(rata.czescOdsetkowaGr)}</td>
                    <td className="px-3 py-1.5 font-medium">{zlote(rata.rataGr)}</td>
                    <td className="px-3 py-1.5">{rata.nadplataGr > 0 ? zlote(rata.nadplataGr) : '–'}</td>
                    <td className="px-3 py-1.5">{zlote(rata.saldoPoSplacieGr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function Kafelek({ etykieta, wartosc }: { etykieta: string; wartosc: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-neutral-600">{etykieta}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{wartosc}</p>
    </div>
  );
}
