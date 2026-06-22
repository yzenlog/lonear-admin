import {
  ACCENT_COLOR_OPTIONS,
  AUTH_STORAGE_KEY,
  DEFAULT_UI_SETTINGS,
  THEME_STORAGE_KEY,
  UI_SETTINGS_STORAGE_KEY,
} from "../config/app";
import type { AccentColor, ThemeMode, UiSettings } from "../config/app";

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

function isAccentColor(value: unknown): value is AccentColor {
  return typeof value === "string" && ACCENT_COLOR_OPTIONS.some((option) => option.id === value);
}

export function getInitialUiSettings(): UiSettings {
  if (typeof window === "undefined") {
    return DEFAULT_UI_SETTINGS;
  }

  try {
    const rawSettings = window.localStorage.getItem(UI_SETTINGS_STORAGE_KEY);
    const parsedSettings = rawSettings ? (JSON.parse(rawSettings) as Partial<UiSettings>) : {};
    const accentColor = isAccentColor(parsedSettings.accentColor)
      ? parsedSettings.accentColor
      : DEFAULT_UI_SETTINGS.accentColor;

    return {
      tabsPersistent:
        typeof parsedSettings.tabsPersistent === "boolean"
          ? parsedSettings.tabsPersistent
          : DEFAULT_UI_SETTINGS.tabsPersistent,
      showNotice:
        typeof parsedSettings.showNotice === "boolean" ? parsedSettings.showNotice : DEFAULT_UI_SETTINGS.showNotice,
      accentColor,
    };
  } catch {
    return DEFAULT_UI_SETTINGS;
  }
}

export function persistUiSettings(settings: UiSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(UI_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function syncAccentColor(accentColor: AccentColor, themeMode: ThemeMode) {
  if (typeof document === "undefined") {
    return;
  }

  const accentOption = ACCENT_COLOR_OPTIONS.find((option) => option.id === accentColor) ?? ACCENT_COLOR_OPTIONS[0];
  const tokens = accentOption.tokens[themeMode];
  const rootStyle = document.documentElement.style;

  rootStyle.setProperty("--accent", tokens.accent);
  rootStyle.setProperty("--accent-hover", tokens.accentHover);
  rootStyle.setProperty("--accent-soft", tokens.accentSoft);
  rootStyle.setProperty("--accent-soft-2", tokens.accentSoft2);
  rootStyle.setProperty("--text-on-accent", tokens.textOnAccent);
}

export function syncThemeMode(themeMode: ThemeMode, accentColor: AccentColor = DEFAULT_UI_SETTINGS.accentColor) {
  if (typeof document === "undefined") {
    return;
  }

  const themeColor = themeMode === "dark" ? "#111318" : "#ffffff";

  document.documentElement.dataset.theme = themeMode;
  document.documentElement.style.colorScheme = themeMode === "dark" ? "dark" : "light";
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
  syncAccentColor(accentColor, themeMode);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }
}
