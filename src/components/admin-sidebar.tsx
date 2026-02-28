'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";

type NavItem =
  | { type: "link";      label: string; href: string; icon: string }
  | { type: "separator"; label?: string };

const NAV: NavItem[] = [
  { type: "link",      label: "Dashboard",   href: "/admin",              icon: "▦"  },
  { type: "separator" },
  { type: "link",      label: "Orders",      href: "/admin/orders",       icon: "📦" },
  { type: "link",      label: "Customers",   href: "/admin/customers",    icon: "👥" },
  { type: "separator" },
  { type: "link",      label: "Products",    href: "/admin/products",     icon: "🔧" },
  { type: "link",      label: "Categories",  href: "/admin/categories",   icon: "🗂️" },
  { type: "separator" },
  { type: "link",      label: "Wishlists",    href: "/admin/wishlists",   icon: "♡"  },
  { type: "link",      label: "Promotions",   href: "/admin/promotions",  icon: "🎟️" },
  { type: "link",      label: "Contact Forms", href: "/admin/contact",    icon: "✉️"  },
  { type: "separator", label: "Content" },
  { type: "link",      label: "Theme",        href: "/admin/theme",       icon: "🎨" },
  { type: "link",      label: "Homepage",     href: "/admin/homepage",    icon: "🏠" },
  { type: "link",      label: "About Us",     href: "/admin/about",       icon: "🏢" },
  { type: "link",      label: "Contact Page", href: "/admin/contact-cms", icon: "📍" },
  { type: "link",      label: "Blog",         href: "/admin/blog",        icon: "📝" },
  { type: "separator" },
  { type: "link",      label: "Error Logs",  href: "/admin/error-logs",   icon: "🔴" },
];

export function AdminSidebar({ session }: { session: SessionUser }) {
  const pathname = usePathname();

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: "#0f172a", minHeight: "100vh",
      display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh",
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/admin" style={{ textDecoration: "none" }}>
          <p style={{ color: "white", fontWeight: 800, fontSize: 16, margin: 0 }}>
            <span style={{ color: "#f97316" }}>Build</span>Supply
          </p>
          <p style={{ color: "#64748b", fontSize: 11, margin: "2px 0 0", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Admin Panel
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV.map((item, i) => {
          if (item.type === "separator") {
            return item.label
              ? (
                <div key={`sep-${i}`} style={{ padding: "14px 10px 4px" }}>
                  <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#334155" }}>{item.label}</span>
                </div>
              ) : (
                <div key={`sep-${i}`} style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 10px" }} />
              );
          }
          const active = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 6, marginBottom: 1,
              textDecoration: "none", fontSize: 13, fontWeight: 600,
              background: active ? "rgba(249,115,22,0.15)" : "transparent",
              color: active ? "#f97316" : "#94a3b8",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6, textDecoration: "none", color: "#64748b", fontSize: 12, marginBottom: 4 }}>
          ← Back to Site
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {session.firstName[0]}{session.lastName[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#e2e8f0", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.firstName} {session.lastName}
            </p>
          </div>
          <form action={logoutAction}>
            <button type="submit" title="Sign out" style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14, padding: 0 }}>⏻</button>
          </form>
        </div>
      </div>
    </aside>
  );
}
