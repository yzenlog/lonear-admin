import { Activity, Bell, BookOpen, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { StatusTone } from "../config/modules";

export type Metric = {
  label: string;
  value: string;
  delta: string;
  icon: LucideIcon;
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

export const contentHealth: Array<{ title: string; description: string; tone: StatusTone }> = [
  { title: "Banner 投放", description: "4 个广告位正在生效，1 个待审核", tone: "green" },
  { title: "文章发布", description: "18 篇文章处于待发布或待审批状态", tone: "blue" },
  { title: "文件存储", description: "容量使用 72%，存在 12 个未引用文件", tone: "amber" },
];

export type WorkbenchTrendPoint = {
  day: string;
  visits: number;
  published: number;
  users: number;
};

export const workbenchTrend: WorkbenchTrendPoint[] = [
  { day: "周一", visits: 18920, published: 9, users: 126 },
  { day: "周二", visits: 21480, published: 12, users: 142 },
  { day: "周三", visits: 23640, published: 15, users: 158 },
  { day: "周四", visits: 22110, published: 11, users: 149 },
  { day: "周五", visits: 24860, published: 18, users: 171 },
  { day: "周六", visits: 20370, published: 8, users: 118 },
  { day: "周日", visits: 22940, published: 13, users: 136 },
];
