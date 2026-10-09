import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listSaved } from "@/lib/saved";
import { DashboardGrid } from "./DashboardGrid";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Dashboard · Openbell" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const symbols = await listSaved(user.id);
  return (
    <main className="container page">
      <div className={styles.head}>
        <div>
          <h1 className={styles.h1}>{greeting()}, {user.name.split(" ")[0]}</h1>
          <p className="muted" style={{ margin: "6px 0 0" }}>
            {symbols.length
              ? `You're watching ${symbols.length} stock${symbols.length === 1 ? "" : "s"}.`
              : "Your saved stocks will show up here."}
          </p>
        </div>
        <Link href="/search" className="btn btn-primary">+ Add stock</Link>
      </div>
      <DashboardGrid initialSymbols={symbols} />
    </main>
  );
}
