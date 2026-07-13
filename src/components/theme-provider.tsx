"use client";

import * as React from "react";

type Theme = "light" | "dark";
type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  React.useEffect(() => {
    const saved = window.localStorage.getItem("corretop-theme");
    const nextTheme: Theme = saved === "dark" ? "dark" : "light";
    setThemeState(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem("corretop-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
