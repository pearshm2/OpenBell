import { getSessionUser } from "@/lib/session";
import { isSameOrigin, unauthorized } from "@/lib/auth";
import { normalizeSymbol } from "@/lib/symbol";
import { listSaved, saveStocks } from "@/lib/saved";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return Response.json({ symbols: await listSaved(user.id) });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!isSameOrigin(req)) return Response.json({ error: "Forbidden." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as { symbol?: string };
  const symbol = normalizeSymbol(body.symbol);
  if (!symbol) return Response.json({ error: "Invalid symbol." }, { status: 400 });
  await saveStocks(user.id, [symbol]);
  return Response.json({ symbol, saved: true }, { status: 201 });
}
