export const API_ACCESS_TOKEN_STORAGE_KEY = "lonear-admin-access-token";
export const API_REFRESH_TOKEN_STORAGE_KEY = "lonear-admin-refresh-token";

type TokenStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

function getTokenStorage(rememberSession: boolean): TokenStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return rememberSession ? window.localStorage : window.sessionStorage;
}

function readTokenFromStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
}

export function getAccessToken() {
  return readTokenFromStorage(API_ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken() {
  return readTokenFromStorage(API_REFRESH_TOKEN_STORAGE_KEY);
}

export function persistApiTokens(accessToken: string, refreshToken?: string, rememberSession = true) {
  const storage = getTokenStorage(rememberSession);

  if (!storage) {
    return;
  }

  clearApiTokens();
  storage.setItem(API_ACCESS_TOKEN_STORAGE_KEY, accessToken);

  if (refreshToken) {
    storage.setItem(API_REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  }
}

export function clearApiTokens() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(API_ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(API_REFRESH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(API_ACCESS_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(API_REFRESH_TOKEN_STORAGE_KEY);
}

