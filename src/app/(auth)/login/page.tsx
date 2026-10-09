import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { safeNextPath } from "@/lib/symbol";
import { AuthForm } from "../AuthForm";
import { AuthLayout } from "../AuthLayout";

export const metadata: Metadata = { title: "Log in · Openbell" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getSessionUser()) redirect("/dashboard");
  const next = safeNextPath((await searchParams).next) ?? undefined;
  return (
    <AuthLayout>
      <AuthForm mode="login" next={next} />
    </AuthLayout>
  );
}
