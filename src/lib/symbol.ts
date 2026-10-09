const SYMBOL_RE = /^[A-Z][A-Z0-9.\-]{0,9}$/;

/** Uppercases and trims ticker input; returns null if it can't be a symbol. */
export function normalizeSymbol(input: string | null | undefined): string | null {
  const s = (input ?? "").trim().toUpperCase();
  return SYMBOL_RE.test(s) ? s : null;
}

/** Only allow same-site relative paths as post-login destinations. */
export function safeNextPath(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.startsWith("/login") || next.startsWith("/signup")) return null;
  return next;
}
