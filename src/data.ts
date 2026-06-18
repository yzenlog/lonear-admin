import {
  Activity,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  FileText,
  FolderKanban,
  Inbox,
  Key,
  LayoutDashboard,
  ListTodo,
  MessageCircle,
  Plug,
  Route,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ModuleId =
  | "inbox"
  | "my-work"
  | "projects"
  | "completed"
  | "overview"
  | "roadmap"
  | "cycles"
  | "issues"
  | "in-progress"
  | "todo"
  | "members"
  | "roles"
  | "audit"
  | "integrations"
  | "feedback"
  | "settings";

export type NavItem = {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

export type NavSection = {
  id: string;
  title: string;
  addable?: boolean;
  items?: NavItem[];
  teams?: Team[];
};

export type Team = {
  id: string;
  name: string;
  count: number;
  color: string;
  initials: string;
  items: NavItem[];
};

export const sections: NavSection[] = [
  {
    id: "navigation",
    title: "导航",
    items: [
      { id: "inbox", label: "收件箱", icon: Inbox, badge: 3 },
      { id: "my-work", label: "我的事项", icon: CircleDot },
      { id: "projects", label: "项目", icon: FolderKanban },
      { id: "completed", label: "已完成", icon: CheckCircle2 },
    ],
  },
  {
    id: "workspace",
    title: "工作区",
    addable: true,
    items: [
      { id: "overview", label: "概览", icon: LayoutDashboard },
      { id: "roadmap", label: "路线图", icon: Route },
      { id: "cycles", label: "周期", icon: CalendarDays },
    ],
  },
  {
    id: "teams",
    title: "团队",
    addable: true,
    teams: [
      {
        id: "engineering",
        name: "Engineering",
        initials: "EN",
        count: 24,
        color: "#1066cc",
        items: [
          { id: "issues", label: "全部事项", icon: ClipboardList },
          { id: "in-progress", label: "进行中", icon: Activity, badge: 8 },
          { id: "todo", label: "待办", icon: ListTodo, badge: 12 },
          { id: "completed", label: "已完成", icon: CheckCircle2 },
        ],
      },
      {
        id: "design",
        name: "Design",
        initials: "DS",
        count: 9,
        color: "#8b3ce6",
        items: [
          { id: "issues", label: "全部事项", icon: ClipboardList },
          { id: "in-progress", label: "进行中", icon: Activity, badge: 3 },
        ],
      },
      {
        id: "marketing",
        name: "Marketing",
        initials: "MK",
        count: 5,
        color: "#1a9d62",
        items: [{ id: "issues", label: "全部事项", icon: ClipboardList }],
      },
    ],
  },
  {
    id: "admin",
    title: "管理后台",
    items: [
      { id: "members", label: "成员", icon: Users },
      { id: "roles", label: "团队与权限", icon: Shield },
      { id: "audit", label: "审计日志", icon: FileText },
      { id: "integrations", label: "API 与集成", icon: Plug },
      { id: "feedback", label: "反馈", icon: MessageCircle },
      { id: "settings", label: "设置", icon: Settings },
    ],
  },
];

export const moduleMeta: Record<ModuleId, { title: string; scope: string }> = {
  inbox: { title: "收件箱", scope: "导航" },
  "my-work": { title: "我的事项", scope: "导航" },
  projects: { title: "项目", scope: "导航" },
  completed: { title: "已完成", scope: "Engineering" },
  overview: { title: "概览", scope: "工作区" },
  roadmap: { title: "路线图", scope: "工作区" },
  cycles: { title: "周期", scope: "工作区" },
  issues: { title: "全部事项", scope: "Engineering" },
  "in-progress": { title: "进行中", scope: "Engineering" },
  todo: { title: "待办", scope: "Engineering" },
  members: { title: "成员", scope: "管理后台" },
  roles: { title: "团队与权限", scope: "管理后台" },
  audit: { title: "审计日志", scope: "管理后台" },
  integrations: { title: "API 与集成", scope: "管理后台" },
  feedback: { title: "反馈", scope: "管理后台" },
  settings: { title: "设置", scope: "管理后台" },
};

export type IssueStatus = "backlog" | "todo" | "progress" | "done" | "cancelled";

export type Issue = {
  id: string;
  title: string;
  status: IssueStatus;
  label: string;
  color: string;
  priority: number;
  assignee: string;
  assigneeColor: string;
  updated: string;
};

export const issues: Issue[] = [
  {
    id: "ENG-142",
    title: "重构权限校验中间件，支持细粒度角色",
    status: "progress",
    label: "Backend",
    color: "#1066cc",
    priority: 1,
    assignee: "ZY",
    assigneeColor: "#1066cc",
    updated: "2 小时前",
  },
  {
    id: "ENG-141",
    title: "侧边栏在窄屏下折叠为图标栏",
    status: "todo",
    label: "Frontend",
    color: "#8b3ce6",
    priority: 2,
    assignee: "LM",
    assigneeColor: "#8b3ce6",
    updated: "5 小时前",
  },
  {
    id: "ENG-138",
    title: "导出审计日志为 CSV / JSON",
    status: "todo",
    label: "Backend",
    color: "#1066cc",
    priority: 3,
    assignee: "JK",
    assigneeColor: "#1a9d62",
    updated: "昨天",
  },
  {
    id: "ENG-135",
    title: "工作区切换器的下拉动画卡顿",
    status: "progress",
    label: "Frontend",
    color: "#8b3ce6",
    priority: 2,
    assignee: "LM",
    assigneeColor: "#8b3ce6",
    updated: "昨天",
  },
  {
    id: "ENG-131",
    title: "API 限流：按 token 维度计数",
    status: "backlog",
    label: "Infra",
    color: "#1a9d62",
    priority: 3,
    assignee: "ZY",
    assigneeColor: "#1066cc",
    updated: "2 天前",
  },
  {
    id: "ENG-128",
    title: "深色主题色板对齐设计规范",
    status: "done",
    label: "Design",
    color: "#e0413a",
    priority: 2,
    assignee: "AR",
    assigneeColor: "#e08a00",
    updated: "3 天前",
  },
  {
    id: "ENG-122",
    title: "SSO 登录回调 URL 校验加固",
    status: "done",
    label: "Backend",
    color: "#1066cc",
    priority: 1,
    assignee: "JK",
    assigneeColor: "#1a9d62",
    updated: "4 天前",
  },
  {
    id: "ENG-119",
    title: "批量操作工具栏的键盘快捷键",
    status: "cancelled",
    label: "Frontend",
    color: "#8b3ce6",
    priority: 4,
    assignee: "LM",
    assigneeColor: "#8b3ce6",
    updated: "上周",
  },
];

export const statusMeta = {
  backlog: { className: "st-backlog", text: "Backlog", color: "#8b909a" },
  todo: { className: "st-todo", text: "待办", color: "#6b7280" },
  progress: { className: "st-progress", text: "进行中", color: "#e08a00" },
  done: { className: "st-done", text: "已完成", color: "#1a9d62" },
  cancelled: { className: "st-cancelled", text: "已取消", color: "#e0413a" },
} satisfies Record<IssueStatus, { className: string; text: string; color: string }>;

export const members = [
  { name: "Zenlon Young", role: "Owner", team: "Engineering", status: "在线", lastSeen: "现在" },
  { name: "Lena Moore", role: "Admin", team: "Frontend", status: "在线", lastSeen: "5 分钟前" },
  { name: "Jay Kim", role: "Developer", team: "Backend", status: "离线", lastSeen: "1 小时前" },
  { name: "Ari Reed", role: "Designer", team: "Design", status: "在线", lastSeen: "12 分钟前" },
];

export const roles = [
  { name: "Owner", members: 2, access: "全部权限", updated: "今天" },
  { name: "Admin", members: 5, access: "成员、团队、项目", updated: "昨天" },
  { name: "Developer", members: 24, access: "项目、事项、API token", updated: "3 天前" },
  { name: "Viewer", members: 7, access: "只读", updated: "上周" },
];

export const auditLogs = [
  { action: "更新角色权限", actor: "Zenlon Young", target: "Developer", time: "10:42" },
  { action: "创建 API token", actor: "Jay Kim", target: "Billing Sync", time: "09:18" },
  { action: "邀请成员", actor: "Lena Moore", target: "megan@example.com", time: "昨天" },
  { action: "导出审计日志", actor: "Zenlon Young", target: "CSV", time: "昨天" },
];

export const integrations = [
  { name: "Open API", status: "已启用", icon: Key, accent: "#1066cc" },
  { name: "Webhook", status: "3 个端点", icon: Activity, accent: "#1a9d62" },
  { name: "Billing Sync", status: "需要确认", icon: Plug, accent: "#e08a00" },
];

export const metrics = [
  { label: "活跃成员", value: "38", delta: "+4", icon: Users },
  { label: "待审批权限", value: "6", delta: "+2", icon: Shield },
  { label: "API 调用", value: "1.2M", delta: "+12%", icon: Key },
  { label: "审计事件", value: "284", delta: "今日", icon: Activity },
];
