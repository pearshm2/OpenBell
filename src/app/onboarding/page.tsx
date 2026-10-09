import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getQuotes } from "@/lib/stocks";
import { Onboarding } from "./Onboarding";
import { STARTER_SYMBOLS } from "./starters";

export const metadata: Metadata = { title: "Welcome · Openbell" };

export default async function OnboardingPage() {
  const user = await requireUser({ onboarded: false });
  if (user.onboardedAt) redirect("/dashboard"); // shown once
  const tiles = await getQuotes([...STARTER_SYMBOLS]);
  return <Onboarding firstName={user.name.split(" ")[0]} tiles={tiles} />;
}
