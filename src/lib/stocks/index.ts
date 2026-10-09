import { cached } from "./cache";
import { finnhub } from "./finnhub";
import { mockCandles, mockQuotes } from "./mock";
import { twelveData } from "./twelvedata";
import {
  StockError,
  type CandlePoint,
  type CandleProvider,
  type CardData,
  type Profile,
  type Quote,
  type QuoteProvider,
  type Range,
  type Range52,
  type SearchResult,
  type StockDetail,
} from "./types";

export * from "./types";

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;

/** Demo mode: STOCK_PROVIDER=mock, or no Finnhub key configured. */
export function isDemoMode() {
  return process.env.STOCK_PROVIDER === "mock" || !process.env.FINNHUB_API_KEY;
}

function quotes(): QuoteProvider {
  return isDemoMode() ? mockQuotes : finnhub;
}

function candleSource(): CandleProvider | null {
  if (isDemoMode()) return mockCandles;
  return process.env.TWELVE_DATA_API_KEY ? twelveData : null;
}

export function getQuote(symbol: string): Promise<Quote> {
  return cached(`quote:${symbol}`, 30 * SEC, () => quotes().quote(symbol));
}

export function getProfile(symbol: string): Promise<Profile> {
  return cached(`profile:${symbol}`, 24 * HOUR, () => quotes().profile(symbol));
}

export async function getRange52(symbol: string): Promise<Range52> {
  try {
    return await cached(`range52:${symbol}`, 12 * HOUR, () => quotes().range52(symbol));
  } catch {
    return null; // optional stat; never fail the page over it
  }
}

/** Matches with a price each (prices for the top few, to respect provider limits). */
export async function searchStocks(q: string, limit = 8): Promise<SearchResult[]> {
  const query = q.trim();
  if (!query) return [];
  const hits = await cached(`search:${query.toLowerCase()}`, 24 * HOUR, () => quotes().search(query));
  const top = hits.slice(0, limit);
  const prices = await Promise.all(
    top.map((h) => getQuote(h.symbol).then((q) => q.current, () => null)),
  );
  return top.map((h, i) => ({ ...h, price: prices[i] }));
}

export async function getStockDetail(symbol: string): Promise<StockDetail> {
  const quote = await getQuote(symbol); // throws 404 for unknown symbols
  const [profile, range52] = await Promise.all([
    getProfile(symbol).catch(() => ({ symbol, name: symbol, exchange: "—" })),
    getRange52(symbol),
  ]);
  return { quote, profile, range52 };
}

/** Batched quotes for the dashboard; one bad symbol doesn't sink the rest. */
export async function getQuotes(symbols: string[]): Promise<CardData[]> {
  return Promise.all(
    symbols.map(async (symbol) => {
      try {
        const [quote, profile] = await Promise.all([
          getQuote(symbol),
          getProfile(symbol).catch(() => ({ name: symbol })),
        ]);
        return { symbol, name: profile.name, quote };
      } catch (e) {
        return {
          symbol,
          name: symbol,
          quote: null,
          error: e instanceof StockError ? e.message : "Price unavailable",
        };
      }
    }),
  );
}

/** null = no chart history source configured. */
export async function getCandles(symbol: string, range: Range): Promise<CandlePoint[] | null> {
  const src = candleSource();
  if (!src) return null;
  return cached(`candles:${symbol}:${range}`, range === "1D" ? 5 * MIN : HOUR, () =>
    src.candles(symbol, range),
  );
}

export async function getSparklines(symbols: string[]): Promise<Record<string, CandlePoint[]> | null> {
  const src = candleSource();
  if (!src?.sparklines || !symbols.length) return src ? {} : null;
  const key = `spark:${[...symbols].sort().join(",")}`;
  return cached(key, 10 * MIN, () => src.sparklines!(symbols));
}
