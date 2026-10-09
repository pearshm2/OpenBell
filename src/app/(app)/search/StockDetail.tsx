"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Change } from "@/components/Change";
import { compactNumber, money } from "@/lib/format";
import { RANGES, type CandlePoint, type Range, type StockDetail } from "@/lib/stocks/types";
import { PriceChart } from "./PriceChart";
import styles from "./search.module.css";

type ChartState = { range: Range; points: CandlePoint[]; available: boolean; error?: string };

export function StockDetailPanel({ detail, initiallySaved }: { detail: StockDetail; initiallySaved: boolean }) {
  const { quote: q, profile, range52 } = detail;
  const [saved, setSaved] = useState(initiallySaved);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState<Range>("1D");
  const [chart, setChart] = useState<ChartState | null>(null);
  const [dayVolume, setDayVolume] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/candles/${encodeURIComponent(q.symbol)}?range=${range}`)
      .then(async (r) => {
        const d = await r.json();
        if (!live) return;
        if (!r.ok) return setChart({ range, points: [], available: true, error: d.error });
        setChart({ range, points: d.points, available: d.available });
        if (range === "1D" && d.points.length && d.points.every((p: CandlePoint) => p.v != null)) {
          setDayVolume(d.points.reduce((s: number, p: CandlePoint) => s + (p.v ?? 0), 0));
        }
      })
      .catch(() => live && setChart({ range, points: [], available: true, error: "Couldn't load the chart." }));
    return () => {
      live = false;
    };
  }, [q.symbol, range]);

  async function toggleSave() {
    setSaving(true);
    const res = saved
      ? await fetch(`/api/saved/${encodeURIComponent(q.symbol)}`, { method: "DELETE" })
      : await fetch("/api/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: q.symbol }),
        });
    if (res.ok) setSaved(!saved);
    setSaving(false);
  }

  const loading = !chart || chart.range !== range;
  const stats: [string, string][] = [
    ["Open", money(q.open)],
    ["Previous close", money(q.prevClose)],
    ["Day high", money(q.high)],
    ["Day low", money(q.low)],
    ["Volume", dayVolume != null ? compactNumber(dayVolume) : "—"],
    ["52-week range", range52 ? `${money(range52.low)} – ${money(range52.high)}` : "—"],
  ];

  return (
    <article className={`card ${styles.detail}`}>
      <header className={styles.detailHead}>
        <div style={{ minWidth: 0 }}>
          <div className={styles.titleRow}>
            <h1 className="mono" style={{ fontSize: 26, fontWeight: 500 }}>{q.symbol}</h1>
            <span className={styles.exchange}>{profile.exchange}</span>
          </div>
          <p className="muted" style={{ margin: "2px 0 0" }}>{profile.name}</p>
        </div>
        <button type="button" onClick={toggleSave} disabled={saving} aria-pressed={saved}
          className={`btn ${saved ? "btn-secondary" : "btn-primary"}`}>
          {saved ? "✓ Saved" : "Save to dashboard"}
        </button>
      </header>

      <div className={styles.priceBlock}>
        <span className="mono" style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.1 }} data-testid="current-price">
          {money(q.current)}
        </span>
        <Change change={q.change} percent={q.changePercent} className={styles.bigChange} />
        <AsOf time={q.time} />
      </div>

      <div className={styles.openCallout}>
        <span className="caption">Opening price</span>
        <span className="mono" style={{ fontSize: 20 }} data-testid="opening-price">{money(q.open)}</span>
      </div>

      <div className={styles.chartHead}>
        <div className="segmented" role="group" aria-label="Chart range">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={r === range} onClick={() => setRange(r)}>{r}</button>
          ))}
        </div>
        <span className="caption"><span className={styles.dashKey} aria-hidden="true" /> Open {money(q.open)}</span>
      </div>

      <div className={styles.chartBox} aria-busy={loading}>
        {loading ? (
          <div className="skeleton" style={{ height: "100%" }} />
        ) : chart.error ? (
          <p className={styles.chartMsg}>{chart.error}</p>
        ) : !chart.available ? (
          <p className={styles.chartMsg}>Price history isn&apos;t set up yet (add a TWELVE_DATA_API_KEY).</p>
        ) : chart.points.length < 2 ? (
          <p className={styles.chartMsg}>No price history for this range.</p>
        ) : (
          <PriceChart points={chart.points} open={q.open} range={range}
            up={range === "1D" ? q.change >= 0 : chart.points.at(-1)!.c >= chart.points[0].c} />
        )}
      </div>

      <dl className={styles.stats}>
        {stats.map(([k, v]) => (
          <div key={k} className={styles.stat}>
            <dt className="caption">{k}</dt>
            <dd className="mono">{v}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

const noop = () => () => {};

function AsOf({ time }: { time: number }) {
  // Only format on the client so it uses the viewer's local time zone.
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  if (!isClient || !time) return <span className="caption" />;
  const text = new Date(time * 1000).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short",
  });
  return <span className="caption">as of {text}</span>;
}
