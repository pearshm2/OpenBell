import { StockError } from "./types";

type Entry = { value: unknown; freshUntil: number };
const store = new Map<string, Entry>();
const MAX_ENTRIES = 5000;

/**
 * Returns a cached value while fresh; otherwise calls `load`. If the provider is
 * rate-limited or down, falls back to the last value we had (stale is better than nothing).
 */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.freshUntil > Date.now()) return hit.value as T;
  try {
    const value = await load();
    if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!);
    store.set(key, { value, freshUntil: Date.now() + ttlMs });
    return value;
  } catch (e) {
    if (hit && e instanceof StockError && e.status !== 404) return hit.value as T;
    throw e;
  }
}

export function clearStockCache() {
  store.clear();
}
