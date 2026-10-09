import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as quoteRoute } from "@/app/api/quote/[symbol]/route";
import { SearchView } from "@/app/(app)/search/SearchView";
import { requireUser } from "@/lib/auth";
import { loadSearch } from "@/lib/search-page";
import { finnhub, mapQuote } from "@/lib/stocks/finnhub";
import { StockError } from "@/lib/stocks/types";
import { expectRedirect, req, signedInUser } from "./helpers";

describe("3. Search a symbol", () => {
  it("signed in, /search?q=AAPL shows the mocked opening price", async () => {
    await signedInUser();
    const user = await requireUser();
    const data = await loadSearch(user.id, "aapl");

    expect(data.detail?.quote.symbol).toBe("AAPL");
    expect(data.detail?.quote.open).toBe(189.1); // from the mock provider fixture

    const html = renderToString(<SearchView {...data} />);
    expect(html).toContain('data-testid="opening-price"');
    expect(html).toContain("$189.10");
    expect(html).toContain("Apple Inc");
  });

  it("unknown symbol shows a friendly message instead of an error page", async () => {
    const userId = await signedInUser();
    const data = await loadSearch(userId, "ZZZZ");
    expect(data.detail).toBeNull();
    expect(data.message).toBe("No stock found for 'ZZZZ'");
  });

  it("company names match too", async () => {
    const userId = await signedInUser();
    const data = await loadSearch(userId, "nvidia");
    expect(data.results.map((r) => r.symbol)).toContain("NVDA");
  });
});

describe("7. Unknown symbol (unit)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("provider c = 0 with no t maps to a 404 'No stock found'", () => {
    const zero = { c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 };
    let err: unknown;
    try {
      mapQuote("XYZ", zero);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(StockError);
    expect((err as StockError).status).toBe(404);
    expect((err as StockError).message).toBe("No stock found for 'XYZ'");
  });

  it("the Finnhub client turns a zeroed quote into the 404, and maps 429 to 'busy'", async () => {
    vi.stubEnv("FINNHUB_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ c: 0, d: null, dp: null, h: 0, l: 0, o: 0, pc: 0, t: 0 })));
    await expect(finnhub.quote("XYZ")).rejects.toMatchObject({ status: 404 });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 429 })));
    await expect(finnhub.quote("AAPL")).rejects.toMatchObject({ status: 429, message: "Prices are busy, try again in a minute." });
  });

  it("GET /api/quote/:symbol answers 404 JSON for unknown symbols", async () => {
    await signedInUser();
    const res = await quoteRoute(req("/api/quote/XYZQ"), { params: Promise.resolve({ symbol: "XYZQ" }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "No stock found for 'XYZQ'" });
  });
});

describe("Access helpers", () => {
  it("requireUser sends un-onboarded users to /onboarding", async () => {
    await signedInUser({ onboarded: false });
    expect(await expectRedirect(() => requireUser())).toBe("/onboarding");
  });
});
