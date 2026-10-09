import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET as quoteRoute } from "@/app/api/quote/[symbol]/route";
import { GET as quotesRoute } from "@/app/api/quotes/route";
import { requireUser } from "@/lib/auth";
import { proxy } from "@/proxy";
import { expectRedirect, req } from "./helpers";
import { cookieJar } from "./setup";

describe("4. Signed-out block", () => {
  it("/search and /dashboard redirect to /login", () => {
    for (const path of ["/search?q=AAPL", "/dashboard"]) {
      const res = proxy(new NextRequest(`http://localhost:3000${path}`));
      const location = new URL(res.headers.get("location")!);
      expect(res.status).toBe(307);
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    }
  });

  it("the page guard itself also redirects without a valid session", async () => {
    cookieJar.set("ob_session", "forged-or-expired-token");
    expect(await expectRedirect(() => requireUser())).toBe("/login");
  });

  it("/api/quote/AAPL returns 401", async () => {
    const viaProxy = proxy(new NextRequest("http://localhost:3000/api/quote/AAPL"));
    expect(viaProxy.status).toBe(401);

    const res = await quoteRoute(req("/api/quote/AAPL"), { params: Promise.resolve({ symbol: "AAPL" }) });
    expect(res.status).toBe(401);
    expect((await quotesRoute(req("/api/quotes?symbols=AAPL"))).status).toBe(401);
  });

  it("login and signup stay public", () => {
    for (const path of ["/login", "/signup"]) {
      const res = proxy(new NextRequest(`http://localhost:3000${path}`));
      expect(res.headers.get("location")).toBeNull();
    }
  });
});
