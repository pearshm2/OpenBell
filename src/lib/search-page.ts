import { isSaved } from "@/lib/saved";
import { getStockDetail, searchStocks, StockError, type SearchResult, type StockDetail } from "@/lib/stocks";
import { normalizeSymbol } from "@/lib/symbol";

export type SearchPageData = {
  q: string;
  results: SearchResult[];
  detail: StockDetail | null;
  saved: boolean;
  /** Shown in the detail panel when there's no detail to show */
  message: string | null;
};

export async function loadSearch(userId: string, rawQ: string | undefined): Promise<SearchPageData> {
  const q = (rawQ ?? "").trim().slice(0, 50);
  if (!q) return { q, results: [], detail: null, saved: false, message: null };

  const symbol = normalizeSymbol(q);
  const [res, det] = await Promise.allSettled([
    searchStocks(q),
    symbol ? getStockDetail(symbol) : Promise.reject(null),
  ]);
  let results = res.status === "fulfilled" ? res.value : [];
  const detail = det.status === "fulfilled" ? det.value : null;

  if (detail && !results.some((r) => r.symbol === detail.quote.symbol)) {
    results = [{ symbol: detail.quote.symbol, name: detail.profile.name, price: detail.quote.current }, ...results];
  }

  let message: string | null = null;
  if (!detail) {
    const err = det.status === "rejected" ? det.reason : null;
    if (err instanceof StockError && err.status !== 404) message = err.message;
    else if (res.status === "rejected" && res.reason instanceof StockError) message = res.reason.message;
    else if (results.length) message = "Pick a result to see its details.";
    else message = `No stock found for '${q}'`;
  }

  const saved = detail ? await isSaved(userId, detail.quote.symbol) : false;
  return { q, results, detail, saved, message };
}
