'use client';

import { useAdminTheme } from "./admin-theme-wrapper";

export function AdminThemeToggle() {
  const { theme, toggle } = useAdminTheme();
  return (
    <button
      onClick={toggle}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "8px 10px", borderRadius: 6,
        background: "transparent", border: "none", cursor: "pointer",
        color: "#64748b", fontSize: 13, fontWeight: 600,
        transition: "all 0.15s",
      }}
    >
      <span style={{ fontSize: 15 }}>{theme === "dark" ? "☀️" : "🌙"}</span>
      {theme === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
