"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Change } from "@/components/Change";
import { Sparkline } from "@/components/Sparkline";
import { money } from "@/lib/format";
import type { CandlePoint, CardData } from "@/lib/stocks/types";
import styles from "./dashboard.module.css";

type Removed = { symbol: string; index: number };

export function DashboardGrid({ initialSymbols }: { initialSymbols: string[] }) {
  const [symbols, setSymbols] = useState(initialSymbols);
  const [cards, setCards] = useState<Record<string, CardData>>({});
  const [lines, setLines] = useState<Record<string, CandlePoint[]>>({});
  const [loading, setLoading] = useState(initialSymbols.length > 0);
  const [error, setError] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Removed | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!initialSymbols.length) return;
    const qs = encodeURIComponent(initialSymbols.join(","));
    // One batched request for every card's price.
    fetch(`/api/quotes?symbols=${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { quotes: CardData[] }) => setCards(Object.fromEntries(d.quotes.map((q) => [q.symbol, q]))))
      .catch(() => setError("Couldn't load prices. Refresh to try again."))
      .finally(() => setLoading(false));
    fetch(`/api/sparklines?symbols=${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: { lines: Record<string, CandlePoint[]> }) => setLines(d.lines))
      .catch(() => {});
  }, [initialSymbols]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  async function remove(symbol: string) {
    const index = symbols.indexOf(symbol);
    setSymbols((s) => s.filter((x) => x !== symbol));
    setRemoved({ symbol, index });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setRemoved(null), 6000);
    const res = await fetch(`/api/saved/${encodeURIComponent(symbol)}`, { method: "DELETE" });
    if (!res.ok) {
      setSymbols((s) => (s.includes(symbol) ? s : [...s.slice(0, index), symbol, ...s.slice(index)]));
      setRemoved(null);
      setError(`Couldn't remove ${symbol}. Try again.`);
    }
  }

  async function undo() {
    if (!removed) return;
    const { symbol, index } = removed;
    setRemoved(null);
    clearTimeout(toastTimer.current);
    setSymbols((s) => [...s.slice(0, index), symbol, ...s.slice(index)]);
    await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
  }

  return (
    <>
      {error && <p className="form-error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {symbols.length === 0 ? (
        <div className={`card ${styles.empty}`}>
          <h2 style={{ fontSize: 20 }}>No saved stocks yet</h2>
          <p className="muted" style={{ margin: 0 }}>Search for a company or ticker and tap “Save to dashboard”.</p>
          <Link href="/search" className="btn btn-primary">Search stocks</Link>
        </div>
      ) : (
        <ul className={styles.grid} aria-busy={loading}>
          {symbols.map((s) =>
            loading ? <SkeletonCard key={s} /> : (
              <StockCard key={s} symbol={s} data={cards[s]} line={lines[s]} onRemove={() => remove(s)} />
            ),
          )}
        </ul>
      )}

      {removed && (
        <div className="toast" role="status">
          <span>Removed <span className="mono">{removed.symbol}</span></span>
          <button type="button" className="btn btn-secondary" onClick={undo}>Undo</button>
        </div>
      )}
    </>
  );
}

function SkeletonCard() {
  return (
    <li className={`card ${styles.cardItem}`} aria-hidden="true">
      <div className={styles.cardTop}>
        <div style={{ display: "grid", gap: 8 }}>
          <div className="skeleton" style={{ width: 64, height: 18 }} />
          <div className="skeleton" style={{ width: 120, height: 13 }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 40 }} />
      <div className="skeleton" style={{ width: 110, height: 26 }} />
      <div className="skeleton" style={{ width: 160, height: 14 }} />
    </li>
  );
}

function StockCard({ symbol, data, line, onRemove }: {
  symbol: string; data?: CardData; line?: CandlePoint[]; onRemove: () => void;
}) {
  const q = data?.quote;
  // Without chart history, fall back to a simple open → now line.
  const values = line?.length ? line.map((p) => p.c) : q ? [q.open, q.current] : [];
  return (
    <li className={`card ${styles.cardItem}`}>
      <div className={styles.cardTop}>
        <div style={{ minWidth: 0 }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 500 }}>{symbol}</div>
          <div className={`caption ${styles.name}`}>{data?.name ?? symbol}</div>
        </div>
        <button type="button" className={styles.bookmark} onClick={onRemove}
          aria-label={`Remove ${symbol} from dashboard`} title="Remove from dashboard">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      {q ? (
        <>
          <Sparkline values={values} up={q.change >= 0} width={260} height={44} fluid
            label={`${symbol} intraday trend, ${q.change >= 0 ? "up" : "down"}`} />
          <div className="mono" style={{ fontSize: 26, fontWeight: 500 }}>{money(q.current)}</div>
          <Change change={q.change} percent={q.changePercent} />
        </>
      ) : (
        <p className="caption" style={{ margin: "8px 0" }}>{data?.error ?? "Price unavailable"}</p>
      )}
      <div className={styles.cardFoot}>
        <span className="caption">Open <span className="mono" style={{ color: "var(--text)" }}>{q ? money(q.open) : "—"}</span></span>
        <Link href={`/search?q=${encodeURIComponent(symbol)}`}>Details →</Link>
      </div>
    </li>
  );
}
