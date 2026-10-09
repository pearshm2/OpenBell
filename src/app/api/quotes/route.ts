import { getSessionUser } from "@/lib/session";
import { unauthorized } from "@/lib/auth";
import { normalizeSymbol } from "@/lib/symbol";
import { getQuotes } from "@/lib/stocks";

export async function GET(req: Request) {
  if (!(await getSessionUser())) return unauthorized();
  const symbols = parseSymbols(new URL(req.url).searchParams.get("symbols"));
  return Response.json({ quotes: await getQuotes(symbols) });
}

function parseSymbols(raw: string | null) {
  const list = (raw ?? "").split(",").map(normalizeSymbol).filter((s): s is string => !!s);
  return [...new Set(list)].slice(0, 30);
}
