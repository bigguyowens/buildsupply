"use client";

import { CRMGlobalSearch } from "./crm-global-search";
import { useCRMTheme } from "./crm-theme-wrapper";

export function CRMMobileShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const { sidebarOpen, toggleSidebar, closeSidebar } = useCRMTheme();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--crm-bg)", width: "100%" }}>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={closeSidebar}
      />

      {/* Sidebar wrapper */}
      <div className={`crm-sidebar-wrap${sidebarOpen ? " open" : ""}`}
        style={{ flexShrink: 0 }}>
        {sidebar}
      </div>

      {/* Main content */}
      <div className="crm-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div className="crm-topbar" style={{
          background: "var(--crm-surface)",
          borderBottom: "1px solid var(--crm-border)",
          padding: "0 28px", height: 56,
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          {/* Left: hamburger + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="mobile-menu-btn"
              onClick={toggleSidebar}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 4, alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 4,
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: "block", width: 20, height: 2, background: "var(--crm-text)", borderRadius: 1 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "var(--crm-text)", borderRadius: 1 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "var(--crm-text)", borderRadius: 1 }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, color: "var(--crm-muted)", fontWeight: 600 }}>CRM Live</span>
            </div>
          </div>

          {/* Center: global search */}
          <div style={{ flex: 1, maxWidth: 480, margin: "0 16px" }}>
            <CRMGlobalSearch />
          </div>

          {/* Right: date */}
          <span style={{ fontSize: 12, color: "var(--crm-muted2)" }} className="hide-mobile">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {/* Page content */}
        <main className="crm-main" style={{ flex: 1, padding: 28, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
