import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/db";

export const SESSION_COOKIE = "ob_session";
const IDLE_MS = 7 * 24 * 60 * 60 * 1000; // expires after 7 days idle
const REFRESH_AFTER_MS = 60 * 60 * 1000; // slide the expiry at most once an hour

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    // The cookie outlives the idle window; the database row decides validity.
    maxAge: 30 * 24 * 60 * 60,
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({
    data: { id: hashToken(token), userId, expiresAt: new Date(Date.now() + IDLE_MS) },
  });
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions());
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

export type SessionUser = { id: string; name: string; email: string; onboardedAt: Date | null };

/** Returns the signed-in user, or null. Slides the idle expiry forward. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: { id: true, name: true, email: true, onboardedAt: true } } },
  });
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  if (session.expiresAt.getTime() - now < IDLE_MS - REFRESH_AFTER_MS) {
    await db.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(now + IDLE_MS) },
    });
  }
  return session.user;
});
