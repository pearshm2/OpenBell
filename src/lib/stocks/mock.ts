// Built-in sample data so the app runs (and tests pass) without any API keys.
import { notFound, type CandlePoint, type CandleProvider, type QuoteProvider, type Range } from "./types";

type Fixture = { name: string; exchange: string; prevClose: number; open: number; current: number };

export const FIXTURES: Record<string, Fixture> = {
  AAPL: { name: "Apple Inc", exchange: "NASDAQ", prevClose: 187.44, open: 189.1, current: 191.52 },
  MSFT: { name: "Microsoft Corp", exchange: "NASDAQ", prevClose: 421.9, open: 420.35, current: 417.08 },
  NVDA: { name: "NVIDIA Corp", exchange: "NASDAQ", prevClose: 128.6, open: 129.95, current: 133.21 },
  AMZN: { name: "Amazon.com Inc", exchange: "NASDAQ", prevClose: 186.33, open: 187.02, current: 188.4 },
  GOOGL: { name: "Alphabet Inc Class A", exchange: "NASDAQ", prevClose: 166.21, open: 165.5, current: 164.12 },
  META: { name: "Meta Platforms Inc", exchange: "NASDAQ", prevClose: 588.1, open: 590.0, current: 596.73 },
  TSLA: { name: "Tesla Inc", exchange: "NASDAQ", prevClose: 241.05, open: 238.4, current: 233.67 },
  NFLX: { name: "Netflix Inc", exchange: "NASDAQ", prevClose: 702.5, open: 705.2, current: 711.94 },
  AMD: { name: "Advanced Micro Devices Inc", exchange: "NASDAQ", prevClose: 158.4, open: 157.1, current: 155.32 },
  INTC: { name: "Intel Corp", exchange: "NASDAQ", prevClose: 22.71, open: 22.8, current: 23.05 },
  JPM: { name: "JPMorgan Chase & Co", exchange: "NYSE", prevClose: 212.3, open: 213.0, current: 214.86 },
  V: { name: "Visa Inc Class A", exchange: "NYSE", prevClose: 279.45, open: 280.1, current: 278.6 },
  DIS: { name: "Walt Disney Co", exchange: "NYSE", prevClose: 95.12, open: 95.4, current: 96.38 },
  KO: { name: "Coca-Cola Co", exchange: "NYSE", prevClose: 70.05, open: 69.9, current: 69.52 },
  NKE: { name: "Nike Inc Class B", exchange: "NYSE", prevClose: 82.6, open: 82.9, current: 83.74 },
  COST: { name: "Costco Wholesale Corp", exchange: "NASDAQ", prevClose: 889.2, open: 891.0, current: 896.15 },
};

function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/** Last weekday 4:00 PM ET (20:00 UTC) — a stable "as of" time for demo quotes. */
function lastClose() {
  const d = new Date();
  d.setUTCHours(20, 0, 0, 0);
  if (d.getTime() > Date.now()) d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
  return Math.floor(d.getTime() / 1000);
}

const RANGE_SHAPE: Record<Range, { points: number; stepSec: number; vol: number }> = {
  "1D": { points: 78, stepSec: 300, vol: 0.0025 },
  "1W": { points: 35, stepSec: 3600, vol: 0.006 },
  "1M": { points: 22, stepSec: 86400, vol: 0.014 },
  "1Y": { points: 252, stepSec: 86400, vol: 0.016 },
  "5Y": { points: 260, stepSec: 7 * 86400, vol: 0.035 },
};

function walk(symbol: string, range: Range): CandlePoint[] {
  const f = FIXTURES[symbol];
  const { points, stepSec, vol } = RANGE_SHAPE[range];
  const rand = rng(symbol + range);
  const end = lastClose();
  // Random walk backwards from the current price, then pin the 1D start to the open.
  const closes = [f.current];
  for (let i = 1; i < points; i++) closes.push(closes[i - 1] * (1 + (rand() - 0.5) * 2 * vol));
  closes.reverse();
  if (range === "1D") {
    const drift = f.open - closes[0];
    for (let i = 0; i < points; i++) closes[i] += drift * (1 - i / (points - 1));
  }
  return closes.map((c, i) => ({
    t: end - (points - 1 - i) * stepSec,
    c: Math.round(c * 100) / 100,
    v: Math.round(150_000 + rand() * 900_000),
  }));
}

function fixture(symbol: string) {
  const f = FIXTURES[symbol];
  if (!f) throw notFound(symbol);
  return f;
}

export const mockQuotes: QuoteProvider = {
  async search(q) {
    const needle = q.trim().toLowerCase();
    return Object.entries(FIXTURES)
      .filter(([s, f]) => s.toLowerCase().startsWith(needle) || f.name.toLowerCase().includes(needle))
      .map(([symbol, f]) => ({ symbol, name: f.name }));
  },
  async quote(symbol) {
    const f = fixture(symbol);
    const day = walk(symbol, "1D").map((p) => p.c);
    const change = f.current - f.prevClose;
    return {
      symbol,
      current: f.current,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round((change / f.prevClose) * 10000) / 100,
      open: f.open,
      high: Math.max(...day, f.open, f.current),
      low: Math.min(...day, f.open, f.current),
      prevClose: f.prevClose,
      time: lastClose(),
    };
  },
  async profile(symbol) {
    const f = fixture(symbol);
    return { symbol, name: f.name, exchange: f.exchange };
  },
  async range52(symbol) {
    fixture(symbol);
    const year = walk(symbol, "1Y").map((p) => p.c);
    return { high: Math.max(...year), low: Math.min(...year) };
  },
};

export const mockCandles: CandleProvider = {
  async candles(symbol, range) {
    fixture(symbol);
    return walk(symbol, range);
  },
  async sparklines(symbols) {
    return Object.fromEntries(symbols.map((s) => [s, FIXTURES[s] ? walk(s, "1D") : []]));
  },
};
