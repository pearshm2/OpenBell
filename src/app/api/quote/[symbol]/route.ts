import { getSessionUser } from "@/lib/session";
import { unauthorized } from "@/lib/auth";
import { stockErrorResponse } from "@/lib/api";
import { normalizeSymbol } from "@/lib/symbol";
import { getQuote, notFound } from "@/lib/stocks";

export async function GET(_req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const raw = (await params).symbol;
  const symbol = normalizeSymbol(raw);
  try {
    if (!symbol) throw notFound(raw);
    return Response.json(await getQuote(symbol));
  } catch (e) {
    return stockErrorResponse(e);
  }
}
