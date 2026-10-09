"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { money } from "@/lib/format";
import type { SearchResult } from "@/lib/stocks/types";
import type { SearchPageData } from "@/lib/search-page";
import { StockDetailPanel } from "./StockDetail";
import styles from "./search.module.css";

export function SearchView({ q, results: initialResults, detail, saved, message }: SearchPageData) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const [live, setLive] = useState<{ term: string; results: SearchResult[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const selected = detail?.quote.symbol;

  // Live results while typing (debounced).
  useEffect(() => {
    const term = text.trim();
    if (!term || term === q) return;
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((d: { results: SearchResult[] }) => setLive({ term, results: d.results }))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [text, q]);

  const term = text.trim();
  // Server results for the submitted query; live results while typing something else.
  const results = !term ? [] : term === q ? initialResults : (live?.results ?? initialResults);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = text.trim();
    if (term) router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  return (
    <main className="container page">
      <form role="search" onSubmit={submit} className={styles.searchBar}>
        <label htmlFor="q" className="sr-only">Search by symbol or company</label>
        <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input id="q" name="q" className={`input ${styles.searchInput}`} value={text} autoFocus={!q}
          onChange={(e) => setText(e.target.value)} placeholder="Search a symbol or company, e.g. NVDA or Apple"
          autoComplete="off" spellCheck={false} />
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className={styles.layout}>
        <section aria-label="Results" className={`card ${styles.results}`}>
          <div className={styles.resultsHead}>
            <span className="caption">{text.trim() ? "Results" : "Start typing to search"}</span>
            {searching && <span className="caption">Searching…</span>}
          </div>
          {results.length > 0 ? (
            <ul className={styles.resultList}>
              {results.map((r) => (
                <li key={r.symbol}>
                  <Link href={`/search?q=${encodeURIComponent(r.symbol)}`}
                    className={`${styles.resultRow} ${r.symbol === selected ? styles.resultOn : ""}`}
                    aria-current={r.symbol === selected ? "true" : undefined}>
                    <span style={{ minWidth: 0 }}>
                      <span className="mono" style={{ fontWeight: 500 }}>{r.symbol}</span>
                      <span className={`caption ${styles.resultName}`}>{r.name}</span>
                    </span>
                    <span className="mono">{r.price != null ? money(r.price) : "—"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            text.trim() && !searching && <p className="caption" style={{ padding: "0 16px 16px", margin: 0 }}>{text.trim() === q ? `No matches for "${q}".` : "No matches yet. Press Search to look up an exact symbol."}</p>
          )}
        </section>

        <section aria-label="Stock detail" className={styles.detailCol}>
          {detail ? (
            <StockDetailPanel detail={detail} initiallySaved={saved} />
          ) : (
            <div className={`card ${styles.placeholder}`}>
              {message ? (
                <p style={{ margin: 0, fontSize: 17 }} role={message.startsWith("No stock") ? "alert" : undefined}>{message}</p>
              ) : (
                <>
                  <h1 style={{ fontSize: 22 }}>Look up a stock</h1>
                  <p className="muted" style={{ margin: 0 }}>Type a symbol like <span className="mono">AAPL</span> and press Enter to see its opening price, today&apos;s move and chart.</p>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
