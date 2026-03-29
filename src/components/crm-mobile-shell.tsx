"use client";

import { useState } from "react";

export function CRMMobileShell({
  sidebar,
  children,
}: {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f2f2f2" }}>

      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar wrapper — becomes drawer on mobile */}
      <div className={`crm-sidebar-wrap${sidebarOpen ? " open" : ""}`}
        style={{ flexShrink: 0 }}>
        {sidebar}
      </div>

      {/* Main content */}
      <div className="crm-content" style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>

        {/* Top bar */}
        <div className="crm-topbar" style={{
          background: "#fff", borderBottom: "1px solid #e5e5e5",
          padding: "0 28px", height: 56, display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          {/* Left: hamburger (mobile) + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Hamburger — only shown via CSS on mobile */}
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                padding: 4, alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 4,
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: "block", width: 20, height: 2, background: "#0d0d0d", borderRadius: 1 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "#0d0d0d", borderRadius: 1 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "#0d0d0d", borderRadius: 1 }} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600 }}>CRM Live</span>
            </div>
          </div>

          {/* Right: date */}
          <span style={{ fontSize: 12, color: "#9ca3af" }} className="hide-mobile">
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
