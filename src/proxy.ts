import { NextResponse, type NextRequest } from "next/server";

// Fast cookie-presence check on every request. Pages and API routes still
// verify the session against the database before showing anything.
const PUBLIC = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.includes(pathname)) return NextResponse.next();
  if (req.cookies.has("ob_session")) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const login = new URL("/login", req.url);
  if (pathname !== "/" && pathname !== "/logout") login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
