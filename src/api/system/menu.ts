import { apiClient } from "../../services/request";

export type MenuStatus = "disabled" | "enabled";

export type MenuApiRecord = {
  children?: MenuApiRecord[];
  icon?: string;
  id: string;
  name: string;
  parentId?: string;
  path?: string;
  permission?: string;
  sort?: number;
  status: MenuStatus;
};

export type MenuMutationPayload = Omit<MenuApiRecord, "children" | "id"> & {
  id?: string;
};

export function getMenuTree() {
  return apiClient.get<MenuApiRecord[]>("/system/menus/tree");
}

export function createMenu(payload: MenuMutationPayload) {
  return apiClient.post<MenuApiRecord>("/system/menus", payload);
}

export function updateMenu(id: string, payload: MenuMutationPayload) {
  return apiClient.put<MenuApiRecord>(`/system/menus/${id}`, payload);
}

export function deleteMenu(id: string) {
  return apiClient.delete<void>(`/system/menus/${id}`);
}
