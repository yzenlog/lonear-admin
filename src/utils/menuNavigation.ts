import {
  Activity,
  BookOpen,
  Building2,
  Database,
  FileText,
  Folder,
  Globe2,
  Image,
  Key,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  Settings,
  Shield,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MenuApiRecord } from "../api/system/menu";
import { moduleRoutes } from "../config/modules";
import type { ModuleId, NavGroup, NavItem, NavSection } from "../config/modules";
import { normalizePathname } from "./navigation";

const menuIconMap: Record<string, LucideIcon> = {
  Activity,
  BookOpen,
  Building2,
  Database,
  FileText,
  Folder,
  Globe2,
  Image,
  Key,
  LayoutDashboard,
  Mail,
  Megaphone,
  Menu,
  Settings,
  Shield,
  Tags,
};

const menuGroupColors = ["#8b3ce6", "#1066cc", "#168a55", "#d92d58", "#6f7785"];

const menuBadgeMap: Partial<Record<ModuleId, number>> = {
  messages: 9,
  notices: 2,
  permissions: 6,
};

const quickAddSections = new Set(["content", "message", "system"]);

const moduleEntries = Object.entries(moduleRoutes) as Array<[ModuleId, string]>;

function isEnabled(record: MenuApiRecord) {
  return record.status === "enabled";
}

function resolveMenuIcon(icon?: string): LucideIcon {
  return icon ? menuIconMap[icon] ?? LayoutDashboard : LayoutDashboard;
}

function getModuleIdByPath(path?: string): ModuleId | null {
  if (!path) {
    return null;
  }

  const normalizedPath = normalizePathname(path);

  return moduleEntries.find(([, routePath]) => routePath === normalizedPath)?.[0] ?? null;
}

function getGroupInitials(name: string) {
  return Array.from(name.trim()).slice(0, 1).join("") || "组";
}

function sortMenuRecords(records: MenuApiRecord[]) {
  return [...records].sort((first, second) => (first.sort ?? 0) - (second.sort ?? 0));
}

function toNavItem(record: MenuApiRecord): NavItem | null {
  const moduleId = getModuleIdByPath(record.path);

  if (!moduleId) {
    return null;
  }

  return {
    badge: menuBadgeMap[moduleId],
    icon: resolveMenuIcon(record.icon),
    id: moduleId,
    label: record.name,
  };
}

function toNavGroup(record: MenuApiRecord, index: number): NavGroup | null {
  const items = sortMenuRecords(record.children ?? [])
    .filter(isEnabled)
    .map(toNavItem)
    .filter((item): item is NavItem => Boolean(item));

  if (items.length === 0) {
    return null;
  }

  return {
    color: menuGroupColors[index % menuGroupColors.length],
    count: items.length,
    id: record.id,
    initials: getGroupInitials(record.name),
    items,
    name: record.name,
  };
}

function toNavSection(record: MenuApiRecord): NavSection | null {
  const children = sortMenuRecords(record.children ?? []).filter(isEnabled);
  const items = children
    .filter((child) => !child.children || child.children.length === 0)
    .map(toNavItem)
    .filter((item): item is NavItem => Boolean(item));
  const groups = children
    .filter((child) => child.children && child.children.length > 0)
    .map(toNavGroup)
    .filter((group): group is NavGroup => Boolean(group));

  if (items.length === 0 && groups.length === 0) {
    return null;
  }

  return {
    addable: quickAddSections.has(record.id),
    groups,
    id: record.id,
    items,
    standalone: record.id === "dashboard",
    title: record.name,
  };
}

export function menuTreeToNavSections(menuTree: MenuApiRecord[]): NavSection[] {
  return sortMenuRecords(menuTree)
    .filter(isEnabled)
    .map(toNavSection)
    .filter((section): section is NavSection => Boolean(section));
}
