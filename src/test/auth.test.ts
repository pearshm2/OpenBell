import { describe, expect, it } from "vitest";
import { db } from "@/db";
import { loginAction, signupAction } from "@/app/(auth)/actions";
import { POST as logout } from "@/app/logout/route";
import { registerUser } from "@/lib/auth";
import { SESSION_COOKIE, hashToken } from "@/lib/session";
import { expectRedirect, form, req } from "./helpers";
import { cookieJar } from "./setup";

describe("1. Sign up", () => {
  it("creates a user with a hashed password, sets a session, redirects to /onboarding", async () => {
    const url = await expectRedirect(() =>
      signupAction({}, form({ name: "Grace Hopper", email: "Grace@Example.com", password: "cobol-1959" })),
    );
    expect(url).toBe("/onboarding");

    const user = await db.user.findUniqueOrThrow({ where: { email: "grace@example.com" } });
    expect(user.passwordHash).not.toContain("cobol-1959");
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);

    const token = cookieJar.get(SESSION_COOKIE)!;
    expect(token).toBeTruthy();
    const session = await db.session.findUnique({ where: { id: hashToken(token) } });
    expect(session?.userId).toBe(user.id);
  });

  it("rejects a duplicate email and short passwords", async () => {
    await registerUser({ name: "A", email: "a@example.com", password: "12345678" });
    const dup = await signupAction({}, form({ name: "B", email: "A@example.com", password: "12345678" }));
    expect(dup.errors?.email).toMatch(/already exists/);
    const short = await signupAction({}, form({ name: "C", email: "c@example.com", password: "short" }));
    expect(short.errors?.password).toMatch(/8 characters/);
    expect(cookieJar.size).toBe(0);
  });
});

describe("2. Log in / log out", () => {
  it("correct credentials redirect to /dashboard; POST /logout clears the session", async () => {
    await registerUser({ name: "Ada", email: "ada@example.com", password: "correct-horse" });

    const url = await expectRedirect(() =>
      loginAction({}, form({ email: "ADA@example.com", password: "correct-horse" })),
    );
    expect(url).toBe("/dashboard");
    const token = cookieJar.get(SESSION_COOKIE)!;
    expect(await db.session.count({ where: { id: hashToken(token) } })).toBe(1);

    const res = await logout(req("/logout", { method: "POST" }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/login");
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
    expect(await db.session.count()).toBe(0);
  });

  it("returns the user to the page they first asked for", async () => {
    await registerUser({ name: "Ada", email: "ada@example.com", password: "correct-horse" });
    const url = await expectRedirect(() =>
      loginAction({}, form({ email: "ada@example.com", password: "correct-horse", next: "/search?q=NVDA" })),
    );
    expect(url).toBe("/search?q=NVDA");
  });
});

describe("8. Wrong password", () => {
  it("shows the generic error and sets no session", async () => {
    await registerUser({ name: "Ada", email: "ada@example.com", password: "correct-horse" });
    const wrongPw = await loginAction({}, form({ email: "ada@example.com", password: "wrong-horse" }));
    const noUser = await loginAction({}, form({ email: "nobody@example.com", password: "whatever1" }));
    expect(wrongPw.errors?.form).toBe("Incorrect email or password.");
    expect(noUser.errors?.form).toBe(wrongPw.errors?.form);
    expect(cookieJar.has(SESSION_COOKIE)).toBe(false);
    expect(await db.session.count()).toBe(0);
  });
});
