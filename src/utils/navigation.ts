import { moduleRoutes, sections } from "../config/modules";
import type { ModuleId } from "../config/modules";
import { DASHBOARD_NAV_KEY } from "../config/app";

export const moduleRouteEntries = Object.entries(moduleRoutes) as Array<[ModuleId, string]>;

export function normalizePathname(pathname: string) {
  const [pathOnly] = pathname.split(/[?#]/);
  const normalizedPathname = pathOnly.replace(/\/+$/, "");

  return normalizedPathname || "/";
}

function normalizeRedirectPath(pathname: string) {
  const queryStartIndex = pathname.search(/[?#]/);

  if (queryStartIndex === -1) {
    return normalizePathname(pathname);
  }

  return `${normalizePathname(pathname.slice(0, queryStartIndex))}${pathname.slice(queryStartIndex)}`;
}

export function getModuleIdFromPathname(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);

  return moduleRouteEntries.find(([, routePath]) => routePath === normalizedPathname)?.[0];
}

export function getNavKeyForModule(moduleId: ModuleId) {
  for (const section of sections) {
    const sectionItem = section.items?.find((item) => item.id === moduleId);

    if (sectionItem) {
      return `section:${section.id}:${sectionItem.id}:${sectionItem.label}`;
    }

    for (const group of section.groups ?? []) {
      const groupItem = group.items.find((item) => item.id === moduleId);

      if (groupItem) {
        return `group:${section.id}:${group.id}:${groupItem.id}:${groupItem.label}`;
      }
    }
  }

  return DASHBOARD_NAV_KEY;
}

export function getProtectedLoginPath(pathname: string) {
  const redirectPath = normalizeRedirectPath(pathname);

  if (!getModuleIdFromPathname(redirectPath)) {
    return "/login";
  }

  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}

export function getLoginRedirectPath(state: unknown, search: string) {
  const redirectParam = new URLSearchParams(search).get("redirect");

  if (redirectParam && getModuleIdFromPathname(redirectParam)) {
    return normalizeRedirectPath(redirectParam);
  }

  if (state && typeof state === "object" && "from" in state) {
    const from = (state as { from?: unknown }).from;

    if (typeof from === "string" && getModuleIdFromPathname(from)) {
      return normalizeRedirectPath(from);
    }
  }

  return moduleRoutes.dashboard;
}
