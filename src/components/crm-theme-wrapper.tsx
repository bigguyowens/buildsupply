'use client';

import { createContext, useContext, useEffect, useState } from "react";

const KEY = "crm-theme";
type Theme = "light" | "dark";

type CRMCtx = {
  theme: Theme;
  toggle: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
};

const Ctx = createContext<CRMCtx>({
  theme: "light", toggle: () => {},
  sidebarOpen: false, toggleSidebar: () => {}, closeSidebar: () => {},
});

export function useCRMTheme() { return useContext(Ctx); }

export function CRMThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme]           = useState<Theme>("light");
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
    <Ctx.Provider value={{
      theme, toggle,
      sidebarOpen,
      toggleSidebar: () => setSidebarOpen(o => !o),
      closeSidebar:  () => setSidebarOpen(false),
    }}>
      <div data-crm-theme={theme} style={{ display: "flex", minHeight: "100vh", width: "100%" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}
