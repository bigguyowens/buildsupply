import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AccountSidebar } from "@/components/account-sidebar";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background)" }}>
      {/* Impersonation banner — shown when a staff member is viewing as this customer */}
      <ImpersonationBanner />

      {/* Shared header */}
      <div style={{ background: "var(--color-primary)", borderBottom: "3px solid var(--color-accent)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px" }}>
          <h1 style={{ color: "white", fontSize: 22, fontWeight: 700, margin: 0 }}>My Account</h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, margin: "4px 0 0" }}>
            Welcome back, {user.firstName}!
          </p>
        </div>
      </div>

      {/* Mobile nav pills */}
      <div className="account-mobile-nav" style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 16px", display: "none", gap: 8, overflowX: "auto" }}>
        {[
          { label: "Dashboard",  href: "/account" },
          { label: "Orders",     href: "/account/orders" },
          { label: "Quotes",     href: "/account/quotes" },
          { label: "Returns",    href: "/account/returns" },
          { label: "Wishlists",  href: "/account/wishlist" },
          { label: "Profile",    href: "/account/profile" },
        ].map(item => (
          <a key={item.href} href={item.href} style={{
            flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: "white", border: "1px solid var(--color-border)",
            color: "var(--color-foreground)", textDecoration: "none", whiteSpace: "nowrap",
          }}>{item.label}</a>
        ))}
      </div>

      {/* Two-column layout */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px", display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Persistent sidebar */}
        <div className="account-sidebar-wrapper">
          <AccountSidebar user={user} />
        </div>

        {/* Page content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .account-sidebar-wrapper { display: none; }
          .account-mobile-nav { display: flex !important; }
          main { padding-top: 0 !important; }
        }
      `}</style>
    </div>
  );
}
