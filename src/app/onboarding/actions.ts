"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { requireUser } from "@/lib/auth";
import { saveStocks } from "@/lib/saved";
import { STARTER_SYMBOLS } from "./starters";

/** Finish or skip: save any picks, mark onboarding done, go to the dashboard. */
export async function completeOnboarding(picks: string[]) {
  const user = await requireUser({ onboarded: false });
  const valid = picks.filter((s) => (STARTER_SYMBOLS as readonly string[]).includes(s));
  if (valid.length) await saveStocks(user.id, valid);
  await db.user.update({ where: { id: user.id }, data: { onboardedAt: new Date() } });
  redirect("/dashboard");
}
