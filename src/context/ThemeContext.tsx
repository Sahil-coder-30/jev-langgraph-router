"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read stored preference or default to 'system'
    const stored = (localStorage.getItem("theme") as ThemeMode) || "system";
    setMode(stored);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyThemeState = (targetMode: ThemeMode) => {
      let isDark = false;
      if (targetMode === "dark") {
        isDark = true;
      } else if (targetMode === "light") {
        isDark = false;
      } else {
        // System preference
        isDark = mediaQuery.matches;
      }

      const active = isDark ? "dark" : "light";
      setResolvedTheme(active);
      document.documentElement.setAttribute("data-theme", active);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyThemeState(stored);

    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentStored = (localStorage.getItem("theme") as ThemeMode) || "system";
      if (currentStored === "system") {
        const isDark = e.matches;
        const active = isDark ? "dark" : "light";
        setResolvedTheme(active);
        document.documentElement.setAttribute("data-theme", active);
        if (isDark) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem("theme", newMode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark =
      newMode === "dark" || (newMode === "system" && mediaQuery.matches);

    const active = isDark ? "dark" : "light";
    setResolvedTheme(active);
    document.documentElement.setAttribute("data-theme", active);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
