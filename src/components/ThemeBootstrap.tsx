import { useEffect } from "react";

export const THEME_STORAGE_KEY = "ndunda_theme";

export function applyStoredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  document.documentElement.classList.toggle("dark", stored === "dark");
}

export function ThemeBootstrap() {
  useEffect(() => {
    applyStoredTheme();
  }, []);

  return null;
}
