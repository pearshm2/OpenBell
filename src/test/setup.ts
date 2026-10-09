// Test environment: separate database, mock stock provider, and stand-ins for
// the Next.js request APIs (cookies, headers, redirect) used by server code.
import { config } from "dotenv";
import { afterAll, beforeEach, vi } from "vitest";

config({ path: ".env.test", override: true });
process.env.STOCK_PROVIDER = "mock";

export const cookieJar = new Map<string, string>();
export const requestHeaders = new Map<string, string>();

export class RedirectError extends Error {
  constructor(public url: string) {
    super(`NEXT_REDIRECT ${url}`);
  }
}

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    has: (name: string) => cookieJar.has(name),
    set: (name: string, value: string) => void cookieJar.set(name, value),
    delete: (name: string) => void cookieJar.delete(name),
  }),
  headers: async () => new Headers([...requestHeaders]),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new RedirectError(url);
  },
  useRouter: () => ({ push: () => {}, replace: () => {}, refresh: () => {} }),
  usePathname: () => "/",
}));

beforeEach(async () => {
  const { db } = await import("@/db");
  const { clearStockCache } = await import("@/lib/stocks/cache");
  const { resetRateLimits } = await import("@/lib/rate-limit");
  await db.$executeRawUnsafe('TRUNCATE "saved_stocks", "sessions", "users" CASCADE');
  cookieJar.clear();
  requestHeaders.clear();
  clearStockCache();
  resetRateLimits();
});

afterAll(async () => {
  const { db } = await import("@/db");
  await db.$disconnect();
});
