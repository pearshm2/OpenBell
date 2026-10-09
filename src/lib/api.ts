import { StockError } from "./stocks";

/** Maps provider errors to the friendly JSON responses from the handoff. */
export function stockErrorResponse(e: unknown) {
  if (e instanceof StockError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
