'use client';

import { createContext, useContext, useEffect, useState } from "react";

const KEY = "admin-theme";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; toggle: () => void }>({ theme: "light", toggle: () => {} });

export function useAdminTheme() { return useContext(Ctx); }

export function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

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
    <Ctx.Provider value={{ theme, toggle }}>
      <div data-admin-theme={theme} style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}
