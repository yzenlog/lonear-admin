import {
  Activity,
  Bell,
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
  | "buttonDemo"
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

export type Metric = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
};

export type ManagementRecord = {
  title: string;
  description: string;
  meta: string;
  owner: string;
  status: string;
  tone: StatusTone;
  updated: string;
};

export const sections: NavSection[] = [
  {
    id: "dashboard",
    title: "工作台",
    standalone: true,
    items: [
      { id: "dashboard", label: "工作台", icon: LayoutDashboard },
      { id: "buttonDemo", label: "演示台", icon: Activity },
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
  buttonDemo: "/demo/buttons",
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
  buttonDemo: { title: "按钮", scope: "工作台", icon: Activity, action: "复制规范" },
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

export const metrics: Metric[] = [
  { label: "今日访问", value: "24,680", delta: "+12.4%", icon: Activity },
  { label: "待处理权限", value: "6", delta: "需复核", icon: Shield },
  { label: "待发布内容", value: "18", delta: "+5", icon: BookOpen },
  { label: "未读站内信", value: "94", delta: "9 封紧急", icon: Bell },
];

export const workbenchTasks = [
  { title: "复核运营管理员菜单权限", owner: "系统管理", time: "10:30", tone: "amber" as const },
  { title: "首页 Banner 将于今晚 23:00 下线", owner: "内容运营", time: "今天", tone: "blue" as const },
  { title: "3 篇文章等待发布审批", owner: "文章管理", time: "昨天", tone: "muted" as const },
  { title: "清理 12 个未归档上传文件", owner: "文件管理", time: "本周", tone: "green" as const },
];

export const moduleRecords: Record<Exclude<ModuleId, "dashboard">, ManagementRecord[]> = {
  buttonDemo: [],
  roles: [
    {
      title: "超级管理员",
      description: "内置最高权限角色，拥有全部菜单、按钮与数据权限",
      meta: "8 位成员",
      owner: "系统内置",
      status: "启用",
      tone: "green",
      updated: "今天",
    },
    {
      title: "运营管理员",
      description: "负责 Banner、文章、公告和站内信等运营模块",
      meta: "14 位成员",
      owner: "运营中心",
      status: "启用",
      tone: "green",
      updated: "昨天",
    },
    {
      title: "审计员",
      description: "仅可查看操作日志、文件访问记录和权限变更记录",
      meta: "3 位成员",
      owner: "风控部",
      status: "只读",
      tone: "blue",
      updated: "3 天前",
    },
    {
      title: "临时协作",
      description: "活动期间临时授权，默认 7 天后自动失效",
      meta: "5 位成员",
      owner: "项目组",
      status: "待复核",
      tone: "amber",
      updated: "上周",
    },
  ],
  permissions: [
    {
      title: "system:role:update",
      description: "允许编辑角色信息、成员绑定和数据范围",
      meta: "角色权限",
      owner: "系统管理",
      status: "已分配",
      tone: "green",
      updated: "10:42",
    },
    {
      title: "content:banner:publish",
      description: "允许发布、下线和排序网站首页 Banner",
      meta: "按钮权限",
      owner: "内容运营",
      status: "待授权",
      tone: "amber",
      updated: "09:18",
    },
    {
      title: "audit:operation:export",
      description: "允许导出操作日志和筛选条件快照",
      meta: "接口权限",
      owner: "审计中心",
      status: "敏感",
      tone: "red",
      updated: "昨天",
    },
    {
      title: "message:inbox:send",
      description: "允许按角色、部门或用户批量发送站内信",
      meta: "接口权限",
      owner: "消息中心",
      status: "已分配",
      tone: "green",
      updated: "昨天",
    },
  ],
  menus: [
    {
      title: "系统管理",
      description: "角色、权限、菜单、部门和字典等后台基础配置",
      meta: "一级菜单",
      owner: "管理员",
      status: "显示",
      tone: "green",
      updated: "今天",
    },
    {
      title: "内容运营",
      description: "Banner、文章与文件资源管理入口",
      meta: "一级菜单",
      owner: "运营中心",
      status: "显示",
      tone: "green",
      updated: "今天",
    },
    {
      title: "广告 Banner",
      description: "网站首页、频道页和活动页广告位配置",
      meta: "二级菜单",
      owner: "运营中心",
      status: "显示",
      tone: "green",
      updated: "昨天",
    },
    {
      title: "实验功能",
      description: "内部灰度入口，仅测试角色可见",
      meta: "二级菜单",
      owner: "产品组",
      status: "隐藏",
      tone: "muted",
      updated: "上周",
    },
  ],
  orgs: [
    {
      title: "总部",
      description: "默认根组织，承载全局管理员和公共配置",
      meta: "128 人",
      owner: "Zenlon Young",
      status: "启用",
      tone: "green",
      updated: "今天",
    },
    {
      title: "运营中心",
      description: "负责内容发布、广告投放、公告与消息触达",
      meta: "36 人",
      owner: "Lena Moore",
      status: "启用",
      tone: "green",
      updated: "昨天",
    },
    {
      title: "技术平台部",
      description: "负责后台权限、文件存储、日志审计和基础服务",
      meta: "42 人",
      owner: "Jay Kim",
      status: "启用",
      tone: "green",
      updated: "2 天前",
    },
    {
      title: "活动项目组",
      description: "临时组织，用于专题活动的跨部门协作",
      meta: "11 人",
      owner: "Ari Reed",
      status: "临时",
      tone: "amber",
      updated: "本周",
    },
  ],
  dictionaries: [
    {
      title: "common_status",
      description: "启用、停用、草稿、待审批等通用状态",
      meta: "8 个枚举",
      owner: "系统管理",
      status: "启用",
      tone: "green",
      updated: "今天",
    },
    {
      title: "article_category",
      description: "新闻、帮助中心、案例、活动等文章分类",
      meta: "12 个枚举",
      owner: "内容运营",
      status: "启用",
      tone: "green",
      updated: "昨天",
    },
    {
      title: "banner_position",
      description: "首页顶部、频道首屏、侧边栏、弹窗等广告位置",
      meta: "6 个枚举",
      owner: "运营中心",
      status: "启用",
      tone: "green",
      updated: "3 天前",
    },
    {
      title: "message_priority",
      description: "普通、重要、紧急三个消息优先级",
      meta: "3 个枚举",
      owner: "消息中心",
      status: "启用",
      tone: "green",
      updated: "上周",
    },
  ],
  websiteConfig: [
    {
      title: "站点基础信息",
      description: "配置网站名称、备案信息、默认语言和前台访问域名",
      meta: "基础配置",
      owner: "系统管理",
      status: "已生效",
      tone: "green",
      updated: "今天",
    },
    {
      title: "SEO 与分享信息",
      description: "维护标题模板、关键词、描述和社交分享默认封面",
      meta: "SEO",
      owner: "内容运营",
      status: "待复核",
      tone: "amber",
      updated: "昨天",
    },
    {
      title: "前台开关",
      description: "控制注册入口、维护模式、访问白名单和灰度入口",
      meta: "访问控制",
      owner: "技术平台部",
      status: "启用",
      tone: "green",
      updated: "2 天前",
    },
    {
      title: "统计脚本",
      description: "统一管理埋点、转化追踪和第三方统计脚本",
      meta: "集成",
      owner: "增长组",
      status: "已暂停",
      tone: "muted",
      updated: "上周",
    },
  ],
  systemConfig: [
    {
      title: "登录安全策略",
      description: "设置密码复杂度、登录失败锁定、会话有效期和二次验证",
      meta: "安全",
      owner: "系统管理",
      status: "启用",
      tone: "green",
      updated: "今天",
    },
    {
      title: "文件上传限制",
      description: "配置附件大小、允许格式、扫描策略和临时文件保留周期",
      meta: "存储",
      owner: "技术平台部",
      status: "启用",
      tone: "green",
      updated: "昨天",
    },
    {
      title: "通知通道",
      description: "维护邮件、短信、站内信和 webhook 的全局发送策略",
      meta: "消息",
      owner: "消息中心",
      status: "部分启用",
      tone: "blue",
      updated: "2 天前",
    },
    {
      title: "审计保留周期",
      description: "配置操作日志、登录日志和敏感变更记录的保留时间",
      meta: "审计",
      owner: "风控部",
      status: "待审批",
      tone: "amber",
      updated: "上周",
    },
  ],
  operationLogs: [
    {
      title: "更新角色权限",
      description: "为运营管理员追加 Banner 发布按钮权限",
      meta: "Developer",
      owner: "Zenlon Young",
      status: "成功",
      tone: "green",
      updated: "10:42",
    },
    {
      title: "导出操作日志",
      description: "导出 2026-06-01 至 2026-06-18 的操作明细",
      meta: "CSV",
      owner: "Jay Kim",
      status: "成功",
      tone: "green",
      updated: "09:18",
    },
    {
      title: "删除文章草稿",
      description: "文章 ID ART-1029 已移入回收站",
      meta: "ART-1029",
      owner: "Lena Moore",
      status: "成功",
      tone: "green",
      updated: "昨天",
    },
    {
      title: "上传文件失败",
      description: "文件大小超过站点附件上限",
      meta: "18.6 MB",
      owner: "Ari Reed",
      status: "失败",
      tone: "red",
      updated: "昨天",
    },
  ],
  notices: [
    {
      title: "端午假期值班安排",
      description: "面向全员发布，登录后台后弹窗提醒",
      meta: "全员可见",
      owner: "行政部",
      status: "已发布",
      tone: "green",
      updated: "今天",
    },
    {
      title: "内容审核规范更新",
      description: "通知运营角色阅读新版文章与广告审核规范",
      meta: "运营中心",
      owner: "内容运营",
      status: "定时发布",
      tone: "blue",
      updated: "今晚 20:00",
    },
    {
      title: "系统维护窗口",
      description: "周六凌晨文件服务短暂停机维护",
      meta: "管理员",
      owner: "技术平台部",
      status: "草稿",
      tone: "muted",
      updated: "昨天",
    },
    {
      title: "敏感权限复核提醒",
      description: "提醒审计员检查近 7 天权限变更记录",
      meta: "审计员",
      owner: "风控部",
      status: "待审批",
      tone: "amber",
      updated: "昨天",
    },
  ],
  files: [
    {
      title: "home-hero-2026.png",
      description: "首页首屏 Banner 图，已关联广告位",
      meta: "2.4 MB",
      owner: "内容运营",
      status: "使用中",
      tone: "green",
      updated: "今天",
    },
    {
      title: "article-cover-template.psd",
      description: "文章封面源文件，仅设计组可下载",
      meta: "16.8 MB",
      owner: "设计组",
      status: "受限",
      tone: "amber",
      updated: "昨天",
    },
    {
      title: "notice-attachment.pdf",
      description: "公告附件，绑定端午假期通知",
      meta: "845 KB",
      owner: "行政部",
      status: "公开",
      tone: "blue",
      updated: "2 天前",
    },
    {
      title: "unused-campaign.zip",
      description: "活动素材包，30 天未被业务引用",
      meta: "32.1 MB",
      owner: "活动项目组",
      status: "待清理",
      tone: "red",
      updated: "上周",
    },
  ],
  messages: [
    {
      title: "权限申请已通过",
      description: "发送给 6 位申请 Banner 发布权限的运营成员",
      meta: "角色消息",
      owner: "系统管理",
      status: "已发送",
      tone: "green",
      updated: "10:12",
    },
    {
      title: "文章审核被驳回",
      description: "提醒作者修改标题与封面图",
      meta: "个人消息",
      owner: "内容运营",
      status: "已读 78%",
      tone: "blue",
      updated: "09:45",
    },
    {
      title: "活动上线倒计时",
      description: "面向活动项目组发送上线前检查清单",
      meta: "部门消息",
      owner: "运营中心",
      status: "定时发送",
      tone: "amber",
      updated: "今晚 19:00",
    },
    {
      title: "文件存储容量预警",
      description: "通知管理员清理过期文件和大附件",
      meta: "系统消息",
      owner: "技术平台部",
      status: "未读",
      tone: "red",
      updated: "昨天",
    },
  ],
  banners: [
    {
      title: "夏季活动首页主 Banner",
      description: "展示于网站首页首屏，点击跳转活动专题页",
      meta: "首页顶部",
      owner: "运营中心",
      status: "投放中",
      tone: "green",
      updated: "今天",
    },
    {
      title: "新用户注册权益",
      description: "展示于注册页右侧广告位，引导完成首单",
      meta: "注册页",
      owner: "增长组",
      status: "排期中",
      tone: "blue",
      updated: "明天 09:00",
    },
    {
      title: "帮助中心升级公告",
      description: "频道页 Banner，关联文章《帮助中心升级说明》",
      meta: "帮助中心",
      owner: "内容运营",
      status: "待审核",
      tone: "amber",
      updated: "昨天",
    },
    {
      title: "旧版专题促销图",
      description: "投放结束后保留历史记录，不再展示",
      meta: "活动页",
      owner: "运营中心",
      status: "已下线",
      tone: "muted",
      updated: "上周",
    },
  ],
  articles: [
    {
      title: "后台权限设计最佳实践",
      description: "发布在帮助中心，面向管理员说明角色与权限模型",
      meta: "帮助中心",
      owner: "内容运营",
      status: "已发布",
      tone: "green",
      updated: "今天",
    },
    {
      title: "夏季活动报名指南",
      description: "活动专题文章，需与首页 Banner 同步上线",
      meta: "活动",
      owner: "运营中心",
      status: "待发布",
      tone: "blue",
      updated: "今晚 20:00",
    },
    {
      title: "文件上传规范",
      description: "说明附件大小、格式限制与敏感文件处理方式",
      meta: "公告",
      owner: "技术平台部",
      status: "草稿",
      tone: "muted",
      updated: "昨天",
    },
    {
      title: "客户案例：内容运营提效",
      description: "案例文章，等待法务确认客户名称露出",
      meta: "案例",
      owner: "市场部",
      status: "待审批",
      tone: "amber",
      updated: "2 天前",
    },
  ],
};

export const contentHealth = [
  { title: "Banner 投放", description: "4 个广告位正在生效，1 个待审核", tone: "green" as const },
  { title: "文章发布", description: "18 篇文章处于待发布或待审批状态", tone: "blue" as const },
  { title: "文件存储", description: "容量使用 72%，存在 12 个未引用文件", tone: "amber" as const },
];
