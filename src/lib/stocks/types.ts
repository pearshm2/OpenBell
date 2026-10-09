export type Quote = {
  symbol: string;
  current: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  /** Unix seconds of the last trade */
  time: number;
};

export type Profile = { symbol: string; name: string; exchange: string };
export type SearchHit = { symbol: string; name: string };
export type Range52 = { high: number; low: number } | null;

export type SearchResult = { symbol: string; name: string; price: number | null };
export type StockDetail = { quote: Quote; profile: Profile; range52: Range52 };
export type CardData = { symbol: string; name: string; quote: Quote | null; error?: string };

export const RANGES = ["1D", "1W", "1M", "1Y", "5Y"] as const;
export type Range = (typeof RANGES)[number];
/** t = unix seconds, c = close, v = volume (when the source has it) */
export type CandlePoint = { t: number; c: number; v?: number };

export interface QuoteProvider {
  search(q: string): Promise<SearchHit[]>;
  quote(symbol: string): Promise<Quote>;
  profile(symbol: string): Promise<Profile>;
  range52(symbol: string): Promise<Range52>;
}

export interface CandleProvider {
  candles(symbol: string, range: Range): Promise<CandlePoint[]>;
  sparklines?(symbols: string[]): Promise<Record<string, CandlePoint[]>>;
}

export class StockError extends Error {
  constructor(
    public status: 404 | 429 | 503,
    message: string,
  ) {
    super(message);
  }
}

export const BUSY_MESSAGE = "Prices are busy, try again in a minute.";
export const notFound = (symbol: string) =>
  new StockError(404, `No stock found for '${symbol}'`);
export const busy = () => new StockError(429, BUSY_MESSAGE);
export const unavailable = () => new StockError(503, BUSY_MESSAGE);
