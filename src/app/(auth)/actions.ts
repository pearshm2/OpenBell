"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate, registerUser, type FieldErrors } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { createSession } from "@/lib/session";
import { safeNextPath } from "@/lib/symbol";

export type AuthState = { errors?: FieldErrors; values?: { name?: string; email?: string } };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "");

export async function signupAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const input = { name: str(fd, "name"), email: str(fd, "email"), password: str(fd, "password") };
  const result = await registerUser(input);
  if ("errors" in result) return { errors: result.errors, values: { name: input.name, email: input.email } };
  await createSession(result.userId);
  redirect("/onboarding");
}

export async function loginAction(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = str(fd, "email");
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "local";
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return { errors: { form: "Too many attempts. Wait a minute and try again." }, values: { email } };
  }
  const userId = await authenticate(email, str(fd, "password"));
  if (!userId) return { errors: { form: "Incorrect email or password." }, values: { email } };
  await createSession(userId);
  redirect(safeNextPath(fd.get("next")) ?? "/dashboard");
}
