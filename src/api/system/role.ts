import { apiClient } from "../../services/request";
import type { PageParams, PageResult } from "../types";

export type RoleStatus = "disabled" | "enabled";

export type RoleApiRecord = {
  code: string;
  description?: string;
  id: string;
  menuIds?: string[];
  name: string;
  sort?: number;
  status: RoleStatus;
};

export type RoleQueryParams = PageParams & {
  status?: RoleStatus;
};

export type RoleMutationPayload = Omit<RoleApiRecord, "id"> & {
  id?: string;
};

export function getRolePage(params: RoleQueryParams = {}) {
  return apiClient.get<PageResult<RoleApiRecord>>("/system/roles", { params });
}

export function createRole(payload: RoleMutationPayload) {
  return apiClient.post<RoleApiRecord>("/system/roles", payload);
}

export function updateRole(id: string, payload: RoleMutationPayload) {
  return apiClient.put<RoleApiRecord>(`/system/roles/${id}`, payload);
}

export function deleteRole(id: string) {
  return apiClient.delete<void>(`/system/roles/${id}`);
}
