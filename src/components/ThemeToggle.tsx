"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle-btn ${isDark ? "theme-dark" : "theme-light"} ${className}`}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Current: ${isDark ? "Dark" : "Light"} mode (Click to switch)`}
      type="button"
    >
      <span className="theme-toggle-icon-wrap">
        {isDark ? (
          <Moon size={15} className="theme-icon moon-icon" />
        ) : (
          <Sun size={15} className="theme-icon sun-icon" />
        )}
      </span>
      <span className="theme-toggle-label">{isDark ? "Dark" : "Light"}</span>
    </button>
  );
};
