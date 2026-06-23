import { apiClient } from "../services/request";

export type LoginPayload = {
  email: string;
  password: string;
  rememberSession?: boolean;
};

export type CurrentUser = {
  avatar?: string;
  email?: string;
  id: string;
  name: string;
  permissions?: string[];
  roles?: string[];
};

export type LoginResult = {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  user: CurrentUser;
};

export function login(payload: LoginPayload) {
  return apiClient.post<LoginResult>("/auth/login", payload, { skipAuth: true });
}

export function logout() {
  return apiClient.post<void>("/auth/logout");
}

export function getCurrentUser() {
  return apiClient.get<CurrentUser>("/auth/me");
}
