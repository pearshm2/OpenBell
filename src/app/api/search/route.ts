import { getSessionUser } from "@/lib/session";
import { unauthorized } from "@/lib/auth";
import { stockErrorResponse } from "@/lib/api";
import { searchStocks } from "@/lib/stocks";

export async function GET(req: Request) {
  if (!(await getSessionUser())) return unauthorized();
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 50) ?? "";
  try {
    return Response.json({ results: await searchStocks(q) });
  } catch (e) {
    return stockErrorResponse(e);
  }
}
