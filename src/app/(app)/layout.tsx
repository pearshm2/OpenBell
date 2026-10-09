import { TopNav } from "@/components/TopNav";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <>
      <TopNav userName={user.name} />
      {children}
    </>
  );
}
