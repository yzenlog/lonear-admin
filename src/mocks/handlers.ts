import type { CurrentUser, LoginPayload, LoginResult } from "../api/auth";
import type { MenuApiRecord, MenuMutationPayload } from "../api/system/menu";
import type { RoleApiRecord, RoleMutationPayload, RoleQueryParams } from "../api/system/role";
import type { PageResult } from "../api/types";
import { moduleRecords } from "./managementRecords";
import { menuTreeRecords } from "./menuRecords";

type MockMethod = "DELETE" | "GET" | "PATCH" | "POST" | "PUT";

export type MockHandler = {
  method: MockMethod;
  path: RegExp;
  resolver: (request: Request, match: RegExpMatchArray) => Promise<Response> | Response;
};

const MOCK_DELAY_MS = 180;

const currentUser: CurrentUser = {
  email: "admin@acme.local",
  id: "user-admin",
  name: "系统管理员",
  permissions: ["*"],
  roles: ["super-admin"],
};

let roleRecords: RoleApiRecord[] = moduleRecords.roles.map((record, index) => ({
  code: `role-${String(index + 1).padStart(2, "0")}`,
  description: record.description,
  id: `role-${index + 1}`,
  name: record.title,
  sort: index + 1,
  status: record.status === "启用" ? "enabled" : "disabled",
}));

let menuRecords: MenuApiRecord[] = menuTreeRecords.map((record) => transformMenuRecord(record));

function transformMenuRecord(
  record: (typeof menuTreeRecords)[number],
  parentId?: string,
): MenuApiRecord {
  return {
    children: record.children?.map((child) => transformMenuRecord(child, record.id)),
    icon: record.icon,
    id: record.id,
    name: record.title,
    parentId,
    path: record.path,
    permission: record.permission,
    sort: record.sortOrder,
    status: record.status === "显示" ? "enabled" : "disabled",
  };
}

function wait(ms = MOCK_DELAY_MS) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function jsonResponse<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify({ code: 0, data, message: "ok" }), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ code: status, message }), {
    headers: {
      "Content-Type": "application/json",
    },
    status,
  });
}

async function readJsonBody<T>(request: Request): Promise<Partial<T>> {
  try {
    return (await request.json()) as Partial<T>;
  } catch {
    return {};
  }
}

function getRoleStatus(value: string | null): RoleQueryParams["status"] | undefined {
  return value === "enabled" || value === "disabled" ? value : undefined;
}

function getPagedRoles(url: URL): PageResult<RoleApiRecord> {
  const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.max(1, Number.parseInt(url.searchParams.get("pageSize") ?? "10", 10) || 10);
  const keyword = (url.searchParams.get("keyword") ?? "").trim().toLowerCase();
  const status = getRoleStatus(url.searchParams.get("status"));
  const filteredRecords = roleRecords.filter((record) => {
    const matchesKeyword =
      keyword.length === 0 ||
      record.name.toLowerCase().includes(keyword) ||
      record.code.toLowerCase().includes(keyword) ||
      record.description?.toLowerCase().includes(keyword);
    const matchesStatus = !status || record.status === status;

    return matchesKeyword && matchesStatus;
  });
  const pageStart = (page - 1) * pageSize;

  return {
    list: filteredRecords.slice(pageStart, pageStart + pageSize),
    page,
    pageSize,
    total: filteredRecords.length,
  };
}

function createRoleRecord(payload: Partial<RoleMutationPayload>): RoleApiRecord {
  const nextIndex = roleRecords.length + 1;

  return {
    code: payload.code ?? `role-${String(nextIndex).padStart(2, "0")}`,
    description: payload.description,
    id: payload.id ?? `role-${Date.now()}`,
    menuIds: payload.menuIds,
    name: payload.name ?? "未命名角色",
    sort: payload.sort ?? nextIndex,
    status: payload.status ?? "enabled",
  };
}

function findMenu(records: MenuApiRecord[], id: string): MenuApiRecord | null {
  for (const record of records) {
    if (record.id === id) {
      return record;
    }

    const childRecord = record.children ? findMenu(record.children, id) : null;

    if (childRecord) {
      return childRecord;
    }
  }

  return null;
}

function getEnabledMenus(records: MenuApiRecord[]): MenuApiRecord[] {
  return records
    .filter((record) => record.status === "enabled")
    .map((record) => ({
      ...record,
      children: record.children ? getEnabledMenus(record.children) : undefined,
    }))
    .filter((record) => !record.children || record.children.length > 0 || Boolean(record.path));
}

function removeMenu(records: MenuApiRecord[], id: string): MenuApiRecord[] {
  return records
    .filter((record) => record.id !== id)
    .map((record) => ({
      ...record,
      children: record.children ? removeMenu(record.children, id) : undefined,
    }));
}

function updateMenuRecord(records: MenuApiRecord[], id: string, payload: Partial<MenuMutationPayload>): MenuApiRecord[] {
  return records.map((record) => {
    if (record.id === id) {
      return {
        ...record,
        ...payload,
        id: record.id,
        children: record.children,
      };
    }

    return {
      ...record,
      children: record.children ? updateMenuRecord(record.children, id, payload) : undefined,
    };
  });
}

function createMenuRecord(payload: Partial<MenuMutationPayload>): MenuApiRecord {
  return {
    icon: payload.icon,
    id: payload.id ?? `menu-${Date.now()}`,
    name: payload.name ?? "未命名菜单",
    parentId: payload.parentId,
    path: payload.path,
    permission: payload.permission,
    sort: payload.sort ?? menuRecords.length + 1,
    status: payload.status ?? "enabled",
  };
}

function addMenuRecord(records: MenuApiRecord[], menu: MenuApiRecord): MenuApiRecord[] {
  if (!menu.parentId) {
    return [...records, menu];
  }

  return records.map((record) => {
    if (record.id === menu.parentId) {
      return {
        ...record,
        children: [...(record.children ?? []), menu],
      };
    }

    return {
      ...record,
      children: record.children ? addMenuRecord(record.children, menu) : undefined,
    };
  });
}

export const mockHandlers: MockHandler[] = [
  {
    method: "POST",
    path: /^\/(?:api\/)?auth\/login$/,
    resolver: async (request) => {
      await wait();
      const payload = await readJsonBody<LoginPayload>(request);

      if (!payload.email || !payload.password || payload.password.length < 6) {
        return errorResponse("请输入有效邮箱和至少 6 位密码", 422);
      }

      return jsonResponse<LoginResult>({
        accessToken: "mock-access-token",
        expiresIn: 7200,
        refreshToken: "mock-refresh-token",
        user: currentUser,
      });
    },
  },
  {
    method: "POST",
    path: /^\/(?:api\/)?auth\/logout$/,
    resolver: async () => {
      await wait();

      return jsonResponse(null);
    },
  },
  {
    method: "GET",
    path: /^\/(?:api\/)?auth\/me$/,
    resolver: async () => {
      await wait();

      return jsonResponse(currentUser);
    },
  },
  {
    method: "GET",
    path: /^\/(?:api\/)?auth\/menus$/,
    resolver: async () => {
      await wait();

      return jsonResponse(getEnabledMenus(menuRecords));
    },
  },
  {
    method: "GET",
    path: /^\/(?:api\/)?system\/roles$/,
    resolver: async (request) => {
      await wait();

      return jsonResponse(getPagedRoles(new URL(request.url)));
    },
  },
  {
    method: "POST",
    path: /^\/(?:api\/)?system\/roles$/,
    resolver: async (request) => {
      await wait();
      const payload = await readJsonBody<RoleMutationPayload>(request);
      const roleRecord = createRoleRecord(payload);

      roleRecords = [roleRecord, ...roleRecords];

      return jsonResponse(roleRecord, { status: 201 });
    },
  },
  {
    method: "PUT",
    path: /^\/(?:api\/)?system\/roles\/([^/]+)$/,
    resolver: async (request, match) => {
      await wait();
      const id = match[1];
      const payload = await readJsonBody<RoleMutationPayload>(request);
      const currentRecord = roleRecords.find((record) => record.id === id);

      if (!currentRecord) {
        return errorResponse("角色不存在", 404);
      }

      const nextRecord: RoleApiRecord = {
        ...currentRecord,
        ...payload,
        id,
      };

      roleRecords = roleRecords.map((record) => (record.id === id ? nextRecord : record));

      return jsonResponse(nextRecord);
    },
  },
  {
    method: "DELETE",
    path: /^\/(?:api\/)?system\/roles\/([^/]+)$/,
    resolver: async (_request, match) => {
      await wait();
      const id = match[1];
      const hasRole = roleRecords.some((record) => record.id === id);

      if (!hasRole) {
        return errorResponse("角色不存在", 404);
      }

      roleRecords = roleRecords.filter((record) => record.id !== id);

      return jsonResponse(null);
    },
  },
  {
    method: "GET",
    path: /^\/(?:api\/)?system\/menus\/tree$/,
    resolver: async () => {
      await wait();

      return jsonResponse(menuRecords);
    },
  },
  {
    method: "POST",
    path: /^\/(?:api\/)?system\/menus$/,
    resolver: async (request) => {
      await wait();
      const payload = await readJsonBody<MenuMutationPayload>(request);
      const menuRecord = createMenuRecord(payload);

      menuRecords = addMenuRecord(menuRecords, menuRecord);

      return jsonResponse(menuRecord, { status: 201 });
    },
  },
  {
    method: "PUT",
    path: /^\/(?:api\/)?system\/menus\/([^/]+)$/,
    resolver: async (request, match) => {
      await wait();
      const id = match[1];
      const currentRecord = findMenu(menuRecords, id);
      const payload = await readJsonBody<MenuMutationPayload>(request);

      if (!currentRecord) {
        return errorResponse("菜单不存在", 404);
      }

      menuRecords = updateMenuRecord(menuRecords, id, payload);

      return jsonResponse({
        ...currentRecord,
        ...payload,
        id,
      });
    },
  },
  {
    method: "DELETE",
    path: /^\/(?:api\/)?system\/menus\/([^/]+)$/,
    resolver: async (_request, match) => {
      await wait();
      const id = match[1];

      if (!findMenu(menuRecords, id)) {
        return errorResponse("菜单不存在", 404);
      }

      menuRecords = removeMenu(menuRecords, id);

      return jsonResponse(null);
    },
  },
];
