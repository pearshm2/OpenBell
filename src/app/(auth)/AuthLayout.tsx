import { LogoMark } from "@/components/Logo";
import styles from "./auth.module.css";

const SAMPLE = [
  { s: "NVDA", open: "129.95", up: true },
  { s: "AAPL", open: "189.10", up: true },
  { s: "TSLA", open: "238.40", up: false },
];

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.split}>
      <section className={styles.brand}>
        <span className="logo">
          <LogoMark />
          <span>Openbell</span>
        </span>
        <div>
          <h2 className={styles.hero}>
            Know the open <em>before</em> the bell.
          </h2>
          <p className={styles.lede}>
            Search any US stock, see where it opened and where it is now, and keep the ones you
            watch on one dashboard.
          </p>
        </div>
        <div className={styles.ticker} aria-hidden="true">
          {SAMPLE.map((t) => (
            <div key={t.s} className={styles.tick}>
              <b>{t.s}</b>
              <span className="muted">
                Open <span className="mono">${t.open}</span>{" "}
                <span className={t.up ? "up" : "down"}>{t.up ? "▲" : "▼"}</span>
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className={styles.formSide}>{children}</section>
    </div>
  );
}
