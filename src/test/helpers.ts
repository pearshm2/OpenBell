import { expect } from "vitest";
import { registerUser } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { db } from "@/db";
import { RedirectError } from "./setup";

export function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

/** Runs a server action / guard that should redirect, and returns the target URL. */
export async function expectRedirect(fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof RedirectError) return e.url;
    throw e;
  }
  expect.fail("expected a redirect");
}

/** A same-origin request as the browser would send it. */
export function req(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost:3000${path}`, {
    ...init,
    headers: { host: "localhost:3000", origin: "http://localhost:3000", ...(init.headers ?? {}) },
  });
}

/** Creates a user and signs them in (sets the session cookie). */
export async function signedInUser(opts: { onboarded?: boolean } = {}) {
  const res = await registerUser({ name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse" });
  if (!("userId" in res)) throw new Error("signup failed");
  if (opts.onboarded !== false) {
    await db.user.update({ where: { id: res.userId }, data: { onboardedAt: new Date() } });
  }
  await createSession(res.userId);
  return res.userId;
}
