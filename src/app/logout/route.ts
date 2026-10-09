import { isSameOrigin } from "@/lib/auth";
import { destroySession } from "@/lib/session";

// POST only (a GET link could be triggered cross-site). 303 turns the POST into a GET of /login.
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new Response("Forbidden", { status: 403 });
  await destroySession();
  return new Response(null, { status: 303, headers: { Location: "/login" } });
}
