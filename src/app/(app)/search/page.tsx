import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { loadSearch } from "@/lib/search-page";
import { SearchView } from "./SearchView";

export const metadata: Metadata = { title: "Search · Openbell" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const data = await loadSearch(user.id, (await searchParams).q);
  return <SearchView key={data.q} {...data} />;
}
