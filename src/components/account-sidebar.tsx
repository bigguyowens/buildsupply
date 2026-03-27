"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { label: "Dashboard",     href: "/account",          icon: "▦",  roles: null },
  { label: "Order History", href: "/account/orders",   icon: "📦", roles: null },
  { label: "My Quotes",     href: "/account/quotes",   icon: "📋", roles: null },
  { label: "Returns",       href: "/account/returns",  icon: "↩️",  roles: null },
  { label: "Wishlists",     href: "/account/wishlist", icon: "♡",  roles: null },
  { label: "My Company",    href: "/account/company",  icon: "🏢", roles: ["company_admin", "admin"] },
  { label: "Profile",       href: "/account/profile",  icon: "👤", roles: null },
  { label: "---" },
  { label: "CRM",           href: "/crm",              icon: "📊", roles: ["account_manager", "admin"] },
  { label: "Admin Panel",   href: "/admin",            icon: "⚙️", roles: ["admin"] },
];

export function AccountSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside style={{ width: 240, flexShrink: 0 }}>
      <div style={{ background: "white", borderRadius: 8, border: "1px solid var(--color-border)", overflow: "hidden", position: "sticky", top: 24 }}>

        {/* Avatar + name */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "var(--color-accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 18, marginBottom: 10,
          }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <p style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>{user.firstName} {user.lastName}</p>
          <p style={{ color: "var(--color-muted)", fontSize: 12, margin: "2px 0 0" }}>{user.email}</p>
        </div>

        {/* Nav */}
        <nav>
          {NAV.filter(item =>
            item.label === "---" || !item.roles || item.roles.includes(user.role)
          ).map((item, i) => {
            if (item.label === "---") {
              return <div key="sep" style={{ height: 1, background: "var(--color-border)", margin: "4px 0" }} />;
            }
            const active = item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href!);
            const isToolLink = ["CRM", "Admin Panel"].includes(item.label);
            return (
              <Link key={item.href} href={item.href!} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "11px 16px", fontSize: 14, textDecoration: "none",
                borderBottom: "1px solid var(--color-border)",
                background: active ? "#fffbeb" : "transparent",
                color: active ? "var(--color-accent)" : isToolLink ? "var(--color-muted)" : "var(--color-foreground)",
                fontWeight: active ? 700 : isToolLink ? 500 : 400,
                borderLeft: active ? "3px solid var(--color-accent)" : "3px solid transparent",
                transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 15, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--color-border)" }}>
          <form action={logoutAction}>
            <button type="submit" style={{
              width: "100%", padding: "8px 0", borderRadius: 6,
              border: "1px solid var(--color-border)", background: "transparent",
              color: "var(--color-muted)", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              Sign Out
            </button>
          </form>
        </div>

      </div>
    </aside>
  );
}
