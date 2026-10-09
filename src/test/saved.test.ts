import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { DELETE as removeRoute } from "@/app/api/saved/[symbol]/route";
import { POST as saveRoute } from "@/app/api/saved/route";
import { GET as quotesRoute } from "@/app/api/quotes/route";
import { completeOnboarding } from "@/app/onboarding/actions";
import { listSaved } from "@/lib/saved";
import { expectRedirect, req, signedInUser } from "./helpers";

const post = (symbol: string, headers: Record<string, string> = {}) =>
  saveRoute(req("/api/saved", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ symbol }),
  }));

describe("5. Save and remove", () => {
  it("POST /api/saved adds a row, a second POST doesn't duplicate, DELETE removes it", async () => {
    const userId = await signedInUser();

    expect((await post("nvda")).status).toBe(201);
    expect(await db.savedStock.count({ where: { userId } })).toBe(1);

    expect((await post("NVDA")).status).toBe(201);
    expect(await db.savedStock.count({ where: { userId } })).toBe(1);

    const res = await removeRoute(req("/api/saved/NVDA", { method: "DELETE" }), {
      params: Promise.resolve({ symbol: "NVDA" }),
    });
    expect(res.status).toBe(200);
    expect(await db.savedStock.count({ where: { userId } })).toBe(0);
  });

  it("rejects cross-site writes", async () => {
    await signedInUser();
    expect((await post("AAPL", { origin: "https://evil.example" })).status).toBe(403);
  });
});

describe("6. Onboarding picks", () => {
  it("completing onboarding with 3 picks shows 3 cards on /dashboard", async () => {
    const userId = await signedInUser({ onboarded: false });

    const url = await expectRedirect(() => completeOnboarding(["AAPL", "MSFT", "NVDA"]));
    expect(url).toBe("/dashboard");

    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.onboardedAt).not.toBeNull();

    const symbols = await listSaved(userId);
    expect(symbols.sort()).toEqual(["AAPL", "MSFT", "NVDA"]);

    // The dashboard renders one card per saved symbol from this batched call.
    const res = await quotesRoute(req(`/api/quotes?symbols=${symbols.join(",")}`));
    const { quotes } = await res.json();
    expect(quotes).toHaveLength(3);
    expect(quotes.every((q: { quote: unknown }) => q.quote)).toBe(true);
  });

  it("skipping sets onboarded_at and saves nothing", async () => {
    const userId = await signedInUser({ onboarded: false });
    await expectRedirect(() => completeOnboarding([]));
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).onboardedAt).not.toBeNull();
    expect(await listSaved(userId)).toEqual([]);
  });
});
