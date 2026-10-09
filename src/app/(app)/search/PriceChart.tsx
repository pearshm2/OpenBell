"use client";

import { useEffect, useRef, useState } from "react";
import { money } from "@/lib/format";
import type { CandlePoint, Range } from "@/lib/stocks/types";

const H = 280;
const PAD = { top: 16, right: 64, bottom: 28, left: 8 };

function fmtTime(t: number, range: Range) {
  const d = new Date(t * 1000);
  if (range === "1D") return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (range === "1W") return d.toLocaleDateString(undefined, { weekday: "short", hour: "numeric" });
  if (range === "5Y") return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PriceChart({ points, open, range, up }: { points: CandlePoint[]; open: number; range: Range; up: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const closes = points.map((p) => p.c);
  let min = Math.min(...closes, open);
  let max = Math.max(...closes, open);
  const padY = (max - min) * 0.08 || max * 0.01;
  min -= padY;
  max += padY;

  const innerW = w - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.c).toFixed(1)}`).join("");
  const area = `${line}L${x(points.length - 1).toFixed(1)},${PAD.top + innerH}L${PAD.left},${PAD.top + innerH}Z`;
  const color = up ? "var(--up)" : "var(--down)";
  const gridVals = [0, 1, 2, 3].map((k) => min + ((max - min) * k) / 3);
  // Hide axis labels that would collide with the "Open" label.
  const labelClear = (v: number) => Math.abs(y(v) - y(open)) > 14;
  const ticks = [0, Math.floor((points.length - 1) / 2), points.length - 1];

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left - PAD.left) / innerW;
    setHover(Math.min(points.length - 1, Math.max(0, Math.round(rel * (points.length - 1)))));
  }

  const hp = hover != null ? points[hover] : null;
  const first = points[0];
  const last = points.at(-1)!;

  return (
    <div ref={ref} style={{ position: "relative", height: H }}>
      <svg width={w} height={H} role="img" onPointerMove={onMove} onPointerLeave={() => setHover(null)}
        aria-label={`${range} price chart from ${money(first.c)} to ${money(last.c)}; opening price ${money(open)}`}>
        <defs>
          <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {gridVals.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + innerW} y1={y(v)} y2={y(v)} stroke="var(--divider)" />
            {labelClear(v) && <text x={w - PAD.right + 8} y={y(v) + 4} fill="var(--text-muted)" fontSize="11" fontFamily="var(--font-mono)">
              {v.toFixed(2)}
            </text>}
          </g>
        ))}
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 8} fill="var(--text-muted)" fontSize="11"
            textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}>
            {fmtTime(points[i].t, range)}
          </text>
        ))}
        <path d={area} fill="url(#chartFill)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {/* Opening price: dashed reference line (brief requirement) */}
        <line x1={PAD.left} x2={PAD.left + innerW} y1={y(open)} y2={y(open)}
          stroke="var(--text-muted)" strokeWidth="1.25" strokeDasharray="5 5" data-testid="open-line" />
        <text x={w - PAD.right + 8} y={y(open) + 4} fill="var(--text)" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
          Open
        </text>
        {hp && hover != null && (
          <g pointerEvents="none">
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--border-input)" />
            <circle cx={x(hover)} cy={y(hp.c)} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hp && hover != null && (
        <div style={{
          position: "absolute", top: 0, left: Math.min(Math.max(x(hover) - 70, 0), w - 150), width: 140,
          background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: 8,
          padding: "6px 10px", fontSize: 13, pointerEvents: "none",
        }}>
          <div className="mono">{money(hp.c)}</div>
          <div className="caption">{fmtTime(hp.t, range === "1D" ? "1D" : "1M")}</div>
        </div>
      )}
    </div>
  );
}
