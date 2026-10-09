import { redirect } from "next/navigation";
import { db } from "@/db";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword, MIN_PASSWORD_LENGTH, verifyPassword } from "./password";
import { getSessionUser, type SessionUser } from "./session";

export type SignupInput = { name: string; email: string; password: string };
export type FieldErrors = Partial<Record<"name" | "email" | "password" | "form", string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignup(input: SignupInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.name.trim()) errors.name = "Enter your name.";
  if (!EMAIL_RE.test(input.email.trim())) errors.email = "Enter a valid email address.";
  if (input.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  return errors;
}

/** Creates the user, or returns field errors (including a taken email). */
export async function registerUser(
  input: SignupInput,
): Promise<{ userId: string } | { errors: FieldErrors }> {
  const errors = validateSignup(input);
  if (Object.keys(errors).length) return { errors };
  try {
    const user = await db.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        passwordHash: await hashPassword(input.password),
      },
    });
    return { userId: user.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { errors: { email: "An account with this email already exists." } };
    throw e;
  }
}

/** Returns the user id when credentials match, else null. */
export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) {
    // Spend comparable time so response timing doesn't reveal which emails exist.
    await hashPassword(password);
    return null;
  }
  return (await verifyPassword(user.passwordHash, password)) ? user.id : null;
}

/** Page guard: signed in, and (by default) onboarded. */
export async function requireUser(opts: { onboarded?: boolean } = {}): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (opts.onboarded !== false && !user.onboardedAt) redirect("/onboarding");
  return user;
}

export function unauthorized() {
  return Response.json({ error: "Sign in required." }, { status: 401 });
}

/** Rejects cross-site state-changing requests (CSRF) on our JSON routes. */
export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
