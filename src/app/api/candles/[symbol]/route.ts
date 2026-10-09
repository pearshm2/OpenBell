import { getSessionUser } from "@/lib/session";
import { unauthorized } from "@/lib/auth";
import { stockErrorResponse } from "@/lib/api";
import { normalizeSymbol } from "@/lib/symbol";
import { getCandles, notFound, RANGES, type Range } from "@/lib/stocks";

export async function GET(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const raw = (await params).symbol;
  const symbol = normalizeSymbol(raw);
  const r = new URL(req.url).searchParams.get("range") ?? "1D";
  const range: Range = (RANGES as readonly string[]).includes(r) ? (r as Range) : "1D";
  try {
    if (!symbol) throw notFound(raw);
    const points = await getCandles(symbol, range);
    return Response.json({ symbol, range, points: points ?? [], available: points !== null });
  } catch (e) {
    return stockErrorResponse(e);
  }
}
