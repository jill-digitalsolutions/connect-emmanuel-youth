"use client";

import { useCallback, useEffect, useState } from "react";

const THEME_KEY = "connect-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // ignore (e.g. private browsing storage restrictions)
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}
