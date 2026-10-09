"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, signupAction, type AuthState } from "./actions";
import styles from "./auth.module.css";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? loginAction : signupAction,
    {},
  );
  const e = state.errors ?? {};
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <div className={`card ${styles.formCard}`}>
      <nav className="segmented" aria-label="Account">
        <Link href={`/login${nextQs}`} aria-current={mode === "login" ? "page" : undefined}>Log in</Link>
        <Link href={`/signup${nextQs}`} aria-current={mode === "signup" ? "page" : undefined}>Sign up</Link>
      </nav>

      <div>
        <h1 className={styles.formTitle}>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted" style={{ margin: "6px 0 0" }}>
          {mode === "login" ? "Log in to see today's opening prices." : "Free, and takes under a minute."}
        </p>
      </div>

      <form action={action} className={styles.form} noValidate>
        {next && <input type="hidden" name="next" value={next} />}
        {e.form && <p className="form-error" role="alert">{e.form}</p>}

        {mode === "signup" && (
          <div className="field">
            <label htmlFor="name">Name</label>
            <input id="name" name="name" className="input" autoComplete="name" required
              defaultValue={state.values?.name} aria-invalid={!!e.name} aria-describedby={e.name ? "name-err" : undefined} />
            {e.name && <span id="name-err" className="field-error">{e.name}</span>}
          </div>
        )}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" required
            defaultValue={state.values?.email} aria-invalid={!!e.email} aria-describedby={e.email ? "email-err" : undefined} />
          {e.email && <span id="email-err" className="field-error">{e.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" className="input" required minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-invalid={!!e.password} aria-describedby={e.password ? "pw-err" : mode === "signup" ? "pw-hint" : undefined} />
          {e.password ? (
            <span id="pw-err" className="field-error">{e.password}</span>
          ) : (
            mode === "signup" && <span id="pw-hint" className="caption">At least 8 characters.</span>
          )}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
          {pending ? "One moment…" : mode === "login" ? "Log in" : "Create account"}
        </button>
      </form>

      <p className="caption" style={{ margin: 0, textAlign: "center" }}>
        {mode === "login" ? (
          <>New to Openbell? <Link href={`/signup${nextQs}`}>Create an account</Link></>
        ) : (
          <>Already have an account? <Link href={`/login${nextQs}`}>Log in</Link></>
        )}
      </p>
    </div>
  );
}
