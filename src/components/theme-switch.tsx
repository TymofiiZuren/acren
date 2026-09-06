"use client";

import { useSyncExternalStore } from "react";
import { parseTheme, THEME_STORAGE_KEY } from "@/lib/theme";

const themeEvent = "acren-theme-change";
const serverTheme = () => "dark" as const;
const currentTheme = () => parseTheme(document.documentElement.dataset.theme);
const subscribe = (notify: () => void) => {
  window.addEventListener(themeEvent, notify);
  return () => window.removeEventListener(themeEvent, notify);
};

export function ThemeSwitch() {
  const theme = useSyncExternalStore(subscribe, currentTheme, serverTheme);
  const next = theme === "dark" ? "light" : "dark";
  const changeTheme = () => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch {}
    window.dispatchEvent(new Event(themeEvent));
  };
  return <button type="button" className="button-quiet" data-preserve-draft="true" onClick={changeTheme}>Switch to {next} theme</button>;
}
