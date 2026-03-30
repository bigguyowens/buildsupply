"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { useCRMTheme } from "./crm-theme-wrapper";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { label: "Dashboard",      href: "/crm",                icon: "▦",  exact: true, roles: null },
  { label: "Analytics",      href: "/crm/analytics",      icon: "📈", roles: null },
  { label: "AM Performance", href: "/crm/am-performance", icon: "🏆", roles: ["admin", "manager"] },
  { label: "---" },
  { label: "Companies",      href: "/crm/companies",      icon: "🏢", roles: null },
  { label: "Customers",      href: "/crm/customers",      icon: "👥", roles: null },
  { label: "Projects",       href: "/crm/projects",       icon: "📁", roles: null },
  { label: "---" },
  { label: "Orders",         href: "/crm/orders",         icon: "🛒", roles: null },
  { label: "Returns",        href: "/crm/returns",        icon: "↩️",  roles: null },
  { label: "Tasks",          href: "/crm/tasks",          icon: "✅", roles: null },
  { label: "Quotes",         href: "/crm/quotes",         icon: "📋", roles: null },
  { label: "---" },
  { label: "Inventory",      href: "/crm/inventory",      icon: "📦", roles: null },
  { label: "---" },
  { label: "Contact Queue",  href: "/crm/contacts",       icon: "✉️",  roles: null },
  { label: "---" },
  { label: "Health Score",   href: "/crm/health-score",  icon: "❤️",  roles: ["admin"] },
];

// Whitecap palette
const C = {
  sidebar: "#0d0d0d",
  accent:  "#f5c700",
  muted:   "#6b6b6b",
  border:  "#1f1f1f",
  hover:   "#1a1a1a",
};

export function CRMSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const { theme, toggle } = useCRMTheme();

  return (
    <aside style={{ width: 230, flexShrink: 0, background: C.sidebar, minHeight: "100vh",
      display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>

      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.accent, borderRadius: 4,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: "#000" }}>B</span>
          </div>
          <div>
            <p style={{ color: "var(--crm-surface)", fontWeight: 800, fontSize: 15, margin: 0, letterSpacing: "-0.02em" }}>
              <span style={{ color: C.accent }}>Build</span>Supply
            </p>
            <p style={{ color: C.muted, fontSize: 10, margin: 0, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.12em" }}>CRM Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.14em", padding: "8px 10px 6px", margin: 0 }}>Navigation</p>

        {NAV.filter(item => item.label === "---" || !item.roles || item.roles.includes(user.role)).map((item, i) => {
          if (item.label === "---") {
            return <div key={`sep-${i}`} style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "6px 10px" }} />;
          }
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href!);
          return (
            <Link key={item.href} href={item.href!} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 6, marginBottom: 2,
              textDecoration: "none", fontSize: 13, fontWeight: active ? 700 : 500,
              background: active ? "rgba(245,199,0,0.12)" : "transparent",
              color: active ? C.accent : "#a0a0a0",
              borderLeft: `3px solid ${active ? C.accent : "transparent"}`,
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        <div style={{ height: 1, background: C.border, margin: "12px 10px" }} />
        <p style={{ color: C.muted, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.14em", padding: "0 10px 6px", margin: 0 }}>Quick Links</p>
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 6, textDecoration: "none",
          fontSize: 12, color: C.muted, fontWeight: 500 }}>
          <span>⚙️</span> Admin Panel
        </Link>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10,
          padding: "9px 12px", borderRadius: 6, textDecoration: "none",
          fontSize: 12, color: C.muted, fontWeight: 500 }}>
          <span>🏠</span> Back to Site
        </Link>
      </nav>

      {/* User footer */}
      <div style={{ padding: "12px 10px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
          background: C.hover, borderRadius: 6, marginBottom: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 800, color: "#000", flexShrink: 0 }}>
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#e0e0e0", fontSize: 12, fontWeight: 700, margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.firstName} {user.lastName}
            </p>
            <p style={{ color: C.muted, fontSize: 10, margin: 0, textTransform: "capitalize" }}>
              {user.role.replace("_", " ")}
            </p>
          </div>
        </div>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          style={{ width: "100%", padding: "7px 0", background: "transparent",
            border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6,
            fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 6,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
        <form action={logoutAction}>
          <button type="submit" style={{ width: "100%", padding: "7px 0", background: "transparent",
            border: `1px solid ${C.border}`, color: C.muted, borderRadius: 6,
            fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Sign Out</button>
        </form>
      </div>
    </aside>
  );
}
