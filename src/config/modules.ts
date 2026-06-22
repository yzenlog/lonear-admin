import {
  Activity,
  BookOpen,
  Building2,
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

export type ModuleId =
  | "dashboard"
  | "componentShowcase"
  | "roles"
  | "permissions"
  | "menus"
  | "orgs"
  | "dictionaries"
  | "websiteConfig"
  | "systemConfig"
  | "operationLogs"
  | "notices"
  | "files"
  | "messages"
  | "banners"
  | "articles";

export type StatusTone = "green" | "amber" | "red" | "blue" | "muted";

export type NavItem = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavSection = {
  id: string;
  title: string;
  items?: NavItem[];
  groups?: NavGroup[];
  standalone?: boolean;
  addable?: boolean;
};

export type NavGroup = {
  id: string;
  name: string;
  count: number;
  color: string;
  initials: string;
  items: NavItem[];
};

export type ModuleMeta = {
  title: string;
  scope: string;
  icon: LucideIcon;
  action: string;
};

export const sections: NavSection[] = [
  {
    id: "dashboard",
    title: "工作台",
    standalone: true,
    items: [
      { id: "dashboard", label: "工作台", icon: LayoutDashboard },
      { id: "componentShowcase", label: "演示台", icon: Activity },
    ],
  },
  {
    id: "system",
    title: "系统管理",
    addable: true,
    items: [
      { id: "roles", label: "角色管理", icon: Shield },
      { id: "permissions", label: "权限管理", icon: Key, badge: 6 },
      { id: "menus", label: "菜单管理", icon: Menu },
      { id: "orgs", label: "部门 / 组织", icon: Building2 },
      { id: "dictionaries", label: "字典管理", icon: Tags },
    ],
    groups: [
      {
        id: "global",
        name: "全局管理",
        initials: "全",
        count: 2,
        color: "#8b3ce6",
        items: [
          { id: "websiteConfig", label: "网站配置", icon: Globe2 },
          { id: "systemConfig", label: "系统配置", icon: Settings },
        ],
      },
    ],
  },
  {
    id: "content",
    title: "内容运营",
    addable: true,
    items: [
      { id: "banners", label: "广告 Banner", icon: Image },
      { id: "articles", label: "文章管理", icon: BookOpen },
      { id: "files", label: "文件管理", icon: Folder },
    ],
  },
  {
    id: "message",
    title: "消息中心",
    addable: true,
    items: [
      { id: "notices", label: "通知公告", icon: Megaphone, badge: 2 },
      { id: "messages", label: "站内信", icon: Mail, badge: 9 },
    ],
  },
  {
    id: "audit",
    title: "审计中心",
    items: [{ id: "operationLogs", label: "操作日志", icon: FileText }],
  },
];

export const moduleRoutes: Record<ModuleId, string> = {
  dashboard: "/dashboard",
  componentShowcase: "/components/showcase",
  roles: "/system/roles",
  permissions: "/system/permissions",
  menus: "/system/menus",
  orgs: "/system/orgs",
  dictionaries: "/system/dictionaries",
  websiteConfig: "/system/global/website",
  systemConfig: "/system/global/system",
  operationLogs: "/audit/operation-logs",
  notices: "/messages/notices",
  files: "/content/files",
  messages: "/messages/inbox",
  banners: "/content/banners",
  articles: "/content/articles",
};

export const moduleMeta: Record<ModuleId, ModuleMeta> = {
  dashboard: { title: "工作台", scope: "工作台", icon: LayoutDashboard, action: "刷新数据" },
  componentShowcase: { title: "演示台", scope: "工作台", icon: Activity, action: "查看组件" },
  roles: { title: "角色管理", scope: "系统管理", icon: Shield, action: "新建角色" },
  permissions: { title: "权限管理", scope: "系统管理", icon: Key, action: "新增权限" },
  menus: { title: "菜单管理", scope: "系统管理", icon: Menu, action: "新增菜单" },
  orgs: { title: "部门 / 组织管理", scope: "系统管理", icon: Building2, action: "新增部门" },
  dictionaries: { title: "字典管理", scope: "系统管理", icon: Tags, action: "新建字典" },
  websiteConfig: { title: "网站配置", scope: "系统管理 / 全局管理", icon: Globe2, action: "保存配置" },
  systemConfig: { title: "系统配置", scope: "系统管理 / 全局管理", icon: Settings, action: "保存配置" },
  operationLogs: { title: "操作日志", scope: "审计中心", icon: FileText, action: "导出日志" },
  notices: { title: "通知公告", scope: "消息中心", icon: Megaphone, action: "发布公告" },
  files: { title: "文件管理", scope: "内容运营", icon: Folder, action: "上传文件" },
  messages: { title: "站内信", scope: "消息中心", icon: Mail, action: "发送消息" },
  banners: { title: "广告 Banner", scope: "内容运营", icon: Image, action: "新建 Banner" },
  articles: { title: "文章管理", scope: "内容运营", icon: BookOpen, action: "新建文章" },
};
