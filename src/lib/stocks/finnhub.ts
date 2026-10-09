import {
  busy,
  notFound,
  unavailable,
  type Profile,
  type Quote,
  type QuoteProvider,
  type Range52,
  type SearchHit,
} from "./types";

const BASE = "https://finnhub.io/api/v1";

async function call<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw unavailable();
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-Finnhub-Token": key },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
  } catch {
    throw unavailable();
  }
  if (res.status === 429) throw busy();
  if (!res.ok) throw unavailable();
  return (await res.json()) as T;
}

type FinnhubQuote = { c: number; d: number | null; dp: number | null; o: number; h: number; l: number; pc: number; t: number | null };

/** Finnhub answers unknown symbols with a zeroed quote rather than an error. */
export function mapQuote(symbol: string, q: FinnhubQuote): Quote {
  if (!q || (q.c === 0 && !q.t)) throw notFound(symbol);
  return {
    symbol,
    current: q.c,
    change: q.d ?? 0,
    changePercent: q.dp ?? 0,
    open: q.o,
    high: q.h,
    low: q.l,
    prevClose: q.pc,
    time: q.t ?? 0,
  };
}

// "NASDAQ NMS - GLOBAL MARKET" → "NASDAQ", "NEW YORK STOCK EXCHANGE, INC." → "NYSE"
function shortExchange(raw?: string) {
  const s = (raw ?? "").toUpperCase();
  if (!s) return "—";
  if (s.includes("NASDAQ")) return "NASDAQ";
  if (s.includes("NEW YORK")) return "NYSE";
  if (s.includes("ARCA")) return "NYSE Arca";
  return raw!;
}

export const finnhub: QuoteProvider = {
  async search(q) {
    const data = await call<{ result?: { symbol: string; description: string; type: string }[] }>(
      "/search",
      { q, exchange: "US" },
    );
    const hits: SearchHit[] = [];
    for (const r of data.result ?? []) {
      // Keep plain US listings; skip foreign suffixes like "AAPL.MX".
      if (r.symbol.includes(".") || (r.type && r.type !== "Common Stock" && r.type !== "ETP")) continue;
      hits.push({ symbol: r.symbol, name: r.description });
    }
    return hits;
  },

  async quote(symbol) {
    return mapQuote(symbol, await call<FinnhubQuote>("/quote", { symbol }));
  },

  async profile(symbol): Promise<Profile> {
    const p = await call<{ name?: string; exchange?: string }>("/stock/profile2", { symbol });
    return {
      symbol,
      name: p.name || symbol,
      exchange: shortExchange(p.exchange),
    };
  },

  async range52(symbol): Promise<Range52> {
    const m = await call<{ metric?: Record<string, number> }>("/stock/metric", {
      symbol,
      metric: "all",
    });
    const high = m.metric?.["52WeekHigh"];
    const low = m.metric?.["52WeekLow"];
    return high && low ? { high, low } : null;
  },
};
