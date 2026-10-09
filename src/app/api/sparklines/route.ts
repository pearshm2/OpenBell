import { getSessionUser } from "@/lib/session";
import { unauthorized } from "@/lib/auth";
import { normalizeSymbol } from "@/lib/symbol";
import { getSparklines } from "@/lib/stocks";

export async function GET(req: Request) {
  if (!(await getSessionUser())) return unauthorized();
  const raw = new URL(req.url).searchParams.get("symbols") ?? "";
  const symbols = [...new Set(raw.split(",").map(normalizeSymbol).filter((s): s is string => !!s))].slice(0, 30);
  try {
    const lines = await getSparklines(symbols);
    return Response.json({ available: lines !== null, lines: lines ?? {} });
  } catch {
    return Response.json({ available: false, lines: {} });
  }
}
