import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { AuthForm } from "../AuthForm";
import { AuthLayout } from "../AuthLayout";

export const metadata: Metadata = { title: "Sign up · Openbell" };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");
  return (
    <AuthLayout>
      <AuthForm mode="signup" />
    </AuthLayout>
  );
}
