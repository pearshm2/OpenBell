import { getSessionUser } from "@/lib/session";
import { isSameOrigin, unauthorized } from "@/lib/auth";
import { normalizeSymbol } from "@/lib/symbol";
import { removeStock } from "@/lib/saved";

export async function DELETE(req: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (!isSameOrigin(req)) return Response.json({ error: "Forbidden." }, { status: 403 });
  const symbol = normalizeSymbol((await params).symbol);
  if (!symbol) return Response.json({ error: "Invalid symbol." }, { status: 400 });
  await removeStock(user.id, symbol);
  return Response.json({ symbol, saved: false });
}
