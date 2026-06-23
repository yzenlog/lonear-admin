import {
  ACCENT_COLOR_OPTIONS,
  AUTH_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
  DEFAULT_UI_SETTINGS,
  PAGE_TABS_STYLE_OPTIONS,
  THEME_STORAGE_KEY,
  UI_SETTINGS_STORAGE_KEY,
} from "../config/app";
import type { AccentColor, PageTabsStyle, ThemeMode, UiSettings } from "../config/app";
import type { CurrentUser } from "../api/auth";
import { clearApiTokens, getAccessToken } from "./apiTokens";

function hasStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage) && Boolean(window.sessionStorage);
}

function getAuthStorage(rememberSession: boolean): Storage | null {
  if (!hasStorage()) {
    return null;
  }

  return rememberSession ? window.localStorage : window.sessionStorage;
}

function readAuthStorageItem(key: string) {
  if (!hasStorage()) {
    return null;
  }

  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

function clearAuthStorage() {
  if (!hasStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

function isCurrentUser(value: unknown): value is CurrentUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

export function getInitialAuthState() {
  return Boolean(getAccessToken());
}

export function getInitialCurrentUser(): CurrentUser | null {
  const rawUser = readAuthStorageItem(AUTH_USER_STORAGE_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser) as unknown;

    return isCurrentUser(parsedUser) ? parsedUser : null;
  } catch {
    return null;
  }
}

export function persistCurrentUser(user: CurrentUser, rememberSession: boolean) {
  const storage = getAuthStorage(rememberSession);

  if (!storage) {
    return;
  }

  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  storage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
}

export function persistAuthSession(rememberSession: boolean, user?: CurrentUser) {
  const authStorage = getAuthStorage(rememberSession);

  if (!authStorage) {
    return;
  }

  clearAuthStorage();
  authStorage.setItem(AUTH_STORAGE_KEY, "true");

  if (user) {
    persistCurrentUser(user, rememberSession);
  }
}

export function clearAuthSession() {
  clearAuthStorage();
  clearApiTokens();
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

function normalizePageTabsStyle(value: unknown): PageTabsStyle {
  if (value === "current") {
    return "default";
  }

  if (value === "google") {
    return "chrome";
  }

  return typeof value === "string" && PAGE_TABS_STYLE_OPTIONS.some((option) => option.id === value)
    ? (value as PageTabsStyle)
    : DEFAULT_UI_SETTINGS.pageTabsStyle;
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
    const pageTabsStyle = normalizePageTabsStyle(parsedSettings.pageTabsStyle);

    return {
      tabsPersistent:
        typeof parsedSettings.tabsPersistent === "boolean"
          ? parsedSettings.tabsPersistent
          : DEFAULT_UI_SETTINGS.tabsPersistent,
      showNotice:
        typeof parsedSettings.showNotice === "boolean" ? parsedSettings.showNotice : DEFAULT_UI_SETTINGS.showNotice,
      accentColor,
      pageTabsStyle,
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
