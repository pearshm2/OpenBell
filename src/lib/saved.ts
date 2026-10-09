import { db } from "@/db";

export async function listSaved(userId: string) {
  const rows = await db.savedStock.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { symbol: true },
  });
  return rows.map((r) => r.symbol);
}

export async function isSaved(userId: string, symbol: string) {
  return (await db.savedStock.count({ where: { userId, symbol } })) > 0;
}

/** Idempotent: saving twice leaves one row. */
export async function saveStocks(userId: string, symbols: string[]) {
  await db.savedStock.createMany({
    data: symbols.map((symbol) => ({ userId, symbol })),
    skipDuplicates: true,
  });
}

export async function removeStock(userId: string, symbol: string) {
  await db.savedStock.deleteMany({ where: { userId, symbol } });
}
