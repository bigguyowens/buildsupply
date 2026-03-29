'use client';

import { createContext, useContext, useEffect, useState } from "react";

const KEY = "admin-theme";

type Theme = "light" | "dark";
type AdminCtx = { theme: Theme; toggle: () => void; sidebarOpen: boolean; toggleSidebar: () => void; closeSidebar: () => void };
const Ctx = createContext<AdminCtx>({ theme: "light", toggle: () => {}, sidebarOpen: false, toggleSidebar: () => {}, closeSidebar: () => {} });

export function useAdminTheme() { return useContext(Ctx); }

export function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme) || "light";
    setTheme(saved);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem(KEY, next);
  }

  return (
    <Ctx.Provider value={{ theme, toggle, sidebarOpen, toggleSidebar: () => setSidebarOpen(o => !o), closeSidebar: () => setSidebarOpen(false) }}>
      <div data-admin-theme={theme} style={{ display: "flex", minHeight: "100vh", width: "100%", position: "relative" }}>

        {/* Mobile overlay */}
        <div
          className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Mobile hamburger button — fixed top-left, CSS shows/hides */}
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(o => !o)}
          aria-label="Toggle menu"
          style={{
            position: "fixed", top: 14, left: 14, zIndex: 1100,
            background: "#0d0d0d", border: "none", borderRadius: 6,
            padding: "8px 10px", cursor: "pointer",
            flexDirection: "column", gap: 4, alignItems: "center",
          }}
        >
          <span style={{ display: "block", width: 18, height: 2, background: "#f5c700", borderRadius: 1 }} />
          <span style={{ display: "block", width: 18, height: 2, background: "#f5c700", borderRadius: 1 }} />
          <span style={{ display: "block", width: 18, height: 2, background: "#f5c700", borderRadius: 1 }} />
        </button>

        {children}
      </div>
    </Ctx.Provider>
  );
}
