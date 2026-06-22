import { AUTH_STORAGE_KEY, THEME_STORAGE_KEY } from "../config/app";
import type { ThemeMode } from "../config/app";

function hasStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage) && Boolean(window.sessionStorage);
}

export function getInitialAuthState() {
  if (!hasStorage()) {
    return false;
  }

  return (
    window.localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
}

export function persistAuthSession(rememberSession: boolean) {
  if (!hasStorage()) {
    return;
  }

  clearAuthSession();
  const authStorage = rememberSession ? window.localStorage : window.sessionStorage;

  authStorage.setItem(AUTH_STORAGE_KEY, "true");
}

export function clearAuthSession() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const themeMode = window.localStorage.getItem(THEME_STORAGE_KEY);

  return themeMode === "dark" ? "dark" : "light";
}

export function syncThemeMode(themeMode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const themeColor = themeMode === "dark" ? "#111318" : "#ffffff";

  document.documentElement.dataset.theme = themeMode;
  document.documentElement.style.colorScheme = themeMode === "dark" ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }
}
