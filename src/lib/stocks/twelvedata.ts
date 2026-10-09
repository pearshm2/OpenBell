import { busy, notFound, unavailable, type CandlePoint, type CandleProvider, type Range } from "./types";

const BASE = "https://api.twelvedata.com/time_series";

const RANGE_PARAMS: Record<Range, { interval: string; outputsize: number }> = {
  "1D": { interval: "5min", outputsize: 90 },
  "1W": { interval: "1h", outputsize: 40 },
  "1M": { interval: "1day", outputsize: 23 },
  "1Y": { interval: "1day", outputsize: 252 },
  "5Y": { interval: "1week", outputsize: 261 },
};

type Series = { status?: string; code?: number; values?: { datetime: string; close: string; volume?: string }[] };

async function fetchSeries(symbol: string, interval: string, outputsize: number) {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw unavailable();
  const url = new URL(BASE);
  url.search = new URLSearchParams({
    symbol,
    interval,
    outputsize: String(outputsize),
    timezone: "UTC",
    apikey: key,
  }).toString();
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(10000), cache: "no-store" });
  } catch {
    throw unavailable();
  }
  if (res.status === 429) throw busy();
  if (!res.ok) throw unavailable();
  return (await res.json()) as Series | Record<string, Series>;
}

function toPoints(symbol: string, s: Series, range: Range): CandlePoint[] {
  if (s.status === "error") {
    if (s.code === 429) throw busy();
    if (s.code === 400 || s.code === 404) throw notFound(symbol);
    throw unavailable();
  }
  // Twelve Data returns newest first; datetimes are UTC because we asked for timezone=UTC.
  let points = (s.values ?? [])
    .map((v) => ({
      t: Date.parse(v.datetime.replace(" ", "T") + "Z") / 1000,
      c: Number(v.close),
      ...(v.volume ? { v: Number(v.volume) } : {}),
    }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.c))
    .reverse();
  if (range === "1D" && points.length) {
    // Keep only the latest trading session (a US session fits inside one UTC date).
    const lastDay = new Date(points.at(-1)!.t * 1000).toISOString().slice(0, 10);
    points = points.filter((p) => new Date(p.t * 1000).toISOString().slice(0, 10) === lastDay);
  }
  return points;
}

export const twelveData: CandleProvider = {
  async candles(symbol, range) {
    const { interval, outputsize } = RANGE_PARAMS[range];
    return toPoints(symbol, (await fetchSeries(symbol, interval, outputsize)) as Series, range);
  },

  /** One request for many symbols' intraday lines (dashboard sparklines). */
  async sparklines(symbols) {
    const { interval, outputsize } = RANGE_PARAMS["1D"];
    const data = await fetchSeries(symbols.join(","), interval, outputsize);
    const bySymbol: Record<string, Series> =
      symbols.length === 1 ? { [symbols[0]]: data as Series } : (data as Record<string, Series>);
    const out: Record<string, CandlePoint[]> = {};
    for (const sym of symbols) {
      try {
        out[sym] = bySymbol[sym] ? toPoints(sym, bySymbol[sym], "1D") : [];
      } catch {
        out[sym] = [];
      }
    }
    return out;
  },
};
