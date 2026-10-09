"use client";

import { useState, useTransition } from "react";
import { LogoMark } from "@/components/Logo";
import { Change } from "@/components/Change";
import { money } from "@/lib/format";
import type { CardData } from "@/lib/stocks/types";
import { completeOnboarding } from "./actions";
import styles from "./onboarding.module.css";

const STEPS = ["Welcome", "Pick stocks", "Done"];

export function Onboarding({ firstName, tiles }: { firstName: string; tiles: CardData[] }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const finish = (picks: string[]) => startTransition(() => completeOnboarding(picks));
  const toggle = (s: string) =>
    setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <span className="logo"><LogoMark /><span>Openbell</span></span>
        <button type="button" className="btn btn-ghost" onClick={() => finish([])} disabled={pending}>
          Skip for now
        </button>
      </header>

      <div className={styles.progress} role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step + 1}
        aria-label={`Step ${step + 1} of 3: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <span key={s} className={i <= step ? styles.barOn : styles.bar} />
        ))}
      </div>
      <p className="caption mono" style={{ margin: "10px 0 0" }}>Step {step + 1} of 3</p>

      <main className={styles.body}>
        {step === 0 && (
          <section className={styles.center}>
            <h1 className={styles.h1}>Welcome to Openbell, {firstName}.</h1>
            <p className={styles.lede}>
              Search any US stock to see its opening price, today&apos;s move and a chart. Save the
              ones you follow and they&apos;ll be waiting on your dashboard.
            </p>
            <div className={styles.actions}>
              <button type="button" className="btn btn-primary" onClick={() => setStep(1)}>Get started</button>
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <h1 className={styles.h1}>Pick a few stocks to start</h1>
            <p className={styles.lede}>They&apos;ll appear on your dashboard. You can change them any time.</p>
            <div className={styles.grid} role="group" aria-label="Starter stocks">
              {tiles.map((t) => {
                const on = picked.includes(t.symbol);
                return (
                  <button key={t.symbol} type="button" aria-pressed={on} onClick={() => toggle(t.symbol)}
                    className={`${styles.tile} ${on ? styles.tileOn : ""}`}>
                    <span className={styles.tileTop}>
                      <span className="mono" style={{ fontSize: 17, fontWeight: 500 }}>{t.symbol}</span>
                      <span className={styles.check} aria-hidden="true">{on ? "✓" : "+"}</span>
                    </span>
                    <span className="caption">{t.name}</span>
                    {t.quote ? (
                      <span className={styles.tilePrice}>
                        <span className="mono">{money(t.quote.current)}</span>
                        <Change change={t.quote.change} percent={t.quote.changePercent} className={styles.tileChange} />
                      </span>
                    ) : (
                      <span className="caption">Price unavailable</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className={styles.footer}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>Back</button>
              <span className="muted" aria-live="polite">{picked.length} selected</span>
              <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>Continue</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className={styles.center}>
            <h1 className={styles.h1}>You&apos;re all set.</h1>
            <p className={styles.lede}>
              {picked.length
                ? `${picked.length} stock${picked.length === 1 ? "" : "s"} will be on your dashboard: ${picked.join(", ")}.`
                : "Your dashboard is ready. Use Search to add stocks whenever you like."}
            </p>
            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button type="button" className="btn btn-primary" onClick={() => finish(picked)} disabled={pending}>
                {pending ? "Saving…" : "Go to dashboard"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
