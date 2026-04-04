"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SessionProvider } from "next-auth/react";

export type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem("sf-theme");
  return saved === "light" || saved === "dark" ? saved : "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem("sf-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
