"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import type { SessionUser } from "@/lib/auth";

export function SiteChrome({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const hiddenRoutes = ["/crm", "/admin"];
  const hide = hiddenRoutes.some(r => pathname.startsWith(r));
  if (hide) return null;
  return (
    <>
      <Header session={session} />
    </>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const hiddenRoutes = ["/crm", "/admin"];
  const hide = hiddenRoutes.some(r => pathname.startsWith(r));
  if (hide) return null;
  return <Footer />;
}
