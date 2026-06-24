export type Locale = "zh-CN" | "en-US";

export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LANGUAGE_STORAGE_KEY = "lonear-admin-language";

export const localeOptions: Array<{ label: string; shortLabel: string; value: Locale }> = [
  { label: "中文", shortLabel: "中", value: "zh-CN" },
  { label: "English", shortLabel: "EN", value: "en-US" },
];

const enTranslations: Record<string, string> = {
  "Lonear Admin": "Lonear Admin",
  中文: "Chinese",
  英文: "English",
  语言: "Language",
  "中文界面": "Chinese interface",
  "English interface": "English interface",
  已切换为英文界面: "Switched to English interface",
  已切换为中文界面: "Switched to Chinese interface",
  管理后台: "Admin Console",
  管理员登录: "Admin Login",
  登录表单: "Sign-in Form",
  登录工作台: "Sign in to Workbench",
  "使用管理员账号继续进入 Lonear Admin。": "Continue to Lonear Admin with an administrator account.",
  邮箱: "Email",
  密码: "Password",
  输入密码: "Enter password",
  保持登录: "Keep me signed in",
  忘记密码: "Forgot password",
  显示密码: "Show password",
  隐藏密码: "Hide password",
  登录: "Sign In",
  "登录中...": "Signing in...",
  安全验证后进入工作台: "Security verified before entering the workbench",
  "企业账号受保护，登录后进入当前工作区。": "Enterprise accounts are protected. Sign in to enter the current workspace.",
  "请输入有效邮箱和至少 6 位密码": "Enter a valid email and a password of at least 6 characters.",
  "正在验证账号...": "Verifying account...",
  "登录失败，请稍后重试": "Sign-in failed. Please try again later.",
  请联系系统管理员重置密码: "Contact your system administrator to reset the password.",
  主导航: "Primary navigation",
  工作区菜单: "Workspace menu",
  当前工作区: "Current workspace",
  运营后台: "Operations Console",
  内容与消息: "Content and messages",
  管理工作区: "Manage workspaces",
  "切换、创建或配置": "Switch, create, or configure",
  菜单快捷操作: "Menu shortcuts",
  展开全部菜单: "Expand all menus",
  展开菜单: "Expand menus",
  只展开当前菜单: "Focus current menu",
  聚焦菜单: "Focus menu",
  收起菜单: "Collapse menus",
  收起侧边栏: "Fold sidebar",
  展开侧边栏: "Unfold sidebar",
  "搜索菜单...": "Search menus...",
  搜索菜单: "Search menus",
  没有匹配的菜单: "No matching menus",
  未登录用户: "Guest user",
  尚未绑定邮箱: "No email linked",
  在线: "Online",
  打开个人菜单: "Open user menu",
  个人菜单: "User menu",
  个人资料: "Profile",
  账号设置: "Account Settings",
  退出登录: "Sign Out",
  打开菜单: "Open menu",
  调整主区宽度: "Resize main area",
  当前位置: "Current location",
  工作区已同步: "Workspace synced",
  "菜单加载失败，已使用本地菜单": "Menu loading failed. Local menus are in use.",
  已展开全部菜单: "All menus expanded",
  已聚焦当前菜单: "Current menu focused",
  菜单已折叠: "Menu folded",
  菜单已展开: "Menu unfolded",
  已关闭全部标签: "All tabs closed",
  已进入全屏: "Entered fullscreen",
  已退出全屏: "Exited fullscreen",
  当前浏览器暂不支持全屏切换: "This browser does not support fullscreen switching.",
  标签持久化已开启: "Tab persistence enabled",
  标签持久化已关闭: "Tab persistence disabled",
  状态提示已显示: "Status notice shown",
  状态提示已隐藏: "Status notice hidden",
  已切换为深色模式: "Switched to dark mode",
  已切换为浅色模式: "Switched to light mode",
  浅色模式: "Light mode",
  深色模式: "Dark mode",
  "浅色模式，点击切换为深色模式": "Light mode. Click to switch to dark mode.",
  "深色模式，点击切换为浅色模式": "Dark mode. Click to switch to light mode.",
  系统设置: "System Settings",
  "界面偏好会保存在当前浏览器。": "Interface preferences are saved in this browser.",
  工作区: "Workspace",
  标签持久化: "Tab Persistence",
  下次进入时恢复已打开页面: "Restore opened pages next time",
  状态提示: "Status Notice",
  在顶部显示最近一次操作反馈: "Show the latest operation feedback in the top bar",
  主区风格: "Main Area Style",
  标签风格: "Tab Style",
  主题色: "Theme Color",
  默认: "Default",
  柔和填充标签: "Soft filled tabs",
  下划线: "Underline",
  旧版底线高亮: "Legacy underline highlight",
  "贴底圆角标签": "Bottom-aligned rounded tabs",
  传统: "Classic",
  沿用当前后台布局: "Keep the current admin layout",
  Linear: "Linear",
  圆角主区包裹面包屑与内容: "Wrap breadcrumbs and content in a rounded main area",
  海蓝: "Ocean Blue",
  青绿: "Teal Green",
  紫藤: "Wisteria",
  玫红: "Rose",
  已打开页面: "Opened pages",
  标签操作: "Tab actions",
  刷新页面: "Refresh page",
  关闭当前: "Close current",
  关闭其他: "Close others",
  关闭右侧: "Close tabs to the right",
  关闭全部: "Close all",
  最新通知: "Latest Notifications",
  查看更多: "View more",
  站内信已打开: "Inbox opened",
  进入全屏: "Enter fullscreen",
  退出全屏: "Exit fullscreen",
  关闭抽屉: "Close drawer",
  关闭弹窗: "Close dialog",
  "当前登录账号的基础信息。": "Basic information for the signed-in account.",
  账号资料: "Account Profile",
  "更新账号资料、界面偏好与登录安全。": "Update account details, interface preferences, and login security.",
  昵称: "Nickname",
  请输入昵称: "Enter nickname",
  请输入邮箱: "Enter email",
  界面偏好: "Interface Preferences",
  安全设置: "Security Settings",
  安全提醒: "Security Alerts",
  异常登录时发送站内提醒: "Send in-app alerts for unusual sign-ins",
  登录保护: "Login Protection",
  敏感操作前要求二次确认: "Require secondary confirmation before sensitive actions",
  当前密码: "Current Password",
  新密码: "New Password",
  确认新密码: "Confirm New Password",
  不修改密码可留空: "Leave blank to keep the password unchanged",
  至少6位: "At least 6 characters",
  "至少 6 位": "At least 6 characters",
  再次输入新密码: "Enter the new password again",
  取消: "Cancel",
  保存设置: "Save Settings",
  关闭: "Close",
  "账号 ID": "Account ID",
  当前角色: "Current Role",
  登录状态: "Login Status",
  未登录: "Signed out",
  默认角色: "Default Role",
  管理员: "Administrator",
  编辑员: "Editor",
  运营人员: "Operator",
  超级管理员: "Super Administrator",
  "当前会话未登录，无法保存账号设置": "The current session is not signed in. Account settings cannot be saved.",
  "昵称至少需要 2 个字符": "Nickname must be at least 2 characters.",
  请输入有效邮箱地址: "Enter a valid email address.",
  "当前密码至少需要 6 位": "Current password must be at least 6 characters.",
  "新密码至少需要 6 位": "New password must be at least 6 characters.",
  两次输入的新密码不一致: "The two new passwords do not match.",
  账号资料与密码设置已保存: "Account profile and password settings saved.",
  账号资料已保存: "Account profile saved.",
  筛选: "Filter",
  显示字段: "Columns",
  状态全部: "Status: All",
  "状态：全部": "Status: All",
  暂无记录: "No records",
  正在刷新列表: "Refreshing list...",
  "正在刷新列表...": "Refreshing list...",
  查询: "Search",
  重置: "Reset",
  操作: "Actions",
  查看: "View",
  编辑: "Edit",
  删除: "Delete",
  保存: "Save",
  创建: "Create",
  新增: "Add",
  导出: "Export",
  导入: "Import",
  下载: "Download",
  上传: "Upload",
  发布: "Publish",
  详情: "Details",
  基础信息: "Basic Information",
  路由配置: "Route Configuration",
  维护信息: "Maintenance Information",
  运行状态: "Runtime Status",
  变更影响: "Change Impact",
  未保存变更: "Unsaved Changes",
  风险提示: "Risk Warning",
  暂无高风险开关处于开启状态: "No high-risk switches are currently enabled.",
  "暂无高风险开关处于开启状态。": "No high-risk switches are currently enabled.",
  当前开关状态与已保存配置一致: "The current switch state matches the saved configuration.",
  "当前开关状态与已保存配置一致。": "The current switch state matches the saved configuration.",
  全部: "All",
  全部状态: "All Statuses",
  全部组织: "All Organizations",
  全部类型: "All Types",
  全部规模: "All Sizes",
  全部时间: "All Time",
  内置角色: "Built-in Roles",
  业务角色: "Business Roles",
  只读角色: "Read-only Roles",
  临时角色: "Temporary Roles",
  今天更新: "Updated Today",
  更早更新: "Older Updates",
  近3天: "Last 3 Days",
  "近 3 天": "Last 3 Days",
  上一页: "Previous",
  下一页: "Next",
  全选: "Select All",
  取消全选: "Deselect All",
  头像: "Avatar",
  角色名称: "Role Name",
  角色描述: "Role Description",
  成员数: "Members",
  所属组织: "Organization",
  状态: "Status",
  更新时间: "Updated",
  负责人: "Owner",
  排序: "Order",
  类型: "Type",
  层级: "Level",
  上级菜单: "Parent Menu",
  菜单名称: "Menu Name",
  菜单类型: "Menu Type",
  菜单描述: "Menu Description",
  菜单图标: "Menu Icon",
  路由地址: "Route Path",
  组件路径: "Component Path",
  权限标识: "Permission Key",
  保存菜单: "Save Menu",
  新增菜单: "Add Menu",
  编辑菜单: "Edit Menu",
  查看菜单: "View Menu",
  删除菜单: "Delete Menu",
  确认删除: "Confirm Delete",
  展开全部: "Expand All",
  收起全部: "Collapse All",
  导入JSON: "Import JSON",
  "导入 JSON": "Import JSON",
  导出JSON: "Export JSON",
  "导出 JSON": "Export JSON",
  最大深度3级: "Max depth: 3 levels",
  "最大深度 3 级": "Max depth: 3 levels",
  全部层级: "All Levels",
  一级: "Level 1",
  二级: "Level 2",
  三级: "Level 3",
  目录: "Directory",
  菜单: "Menu",
  显示: "Visible",
  隐藏: "Hidden",
  启用: "Enabled",
  停用: "Disabled",
  只读: "Read-only",
  待复核: "Pending Review",
  已分配: "Assigned",
  待授权: "Pending Authorization",
  敏感: "Sensitive",
  临时: "Temporary",
  已生效: "Effective",
  已暂停: "Paused",
  待审批: "Pending Approval",
  成功: "Success",
  失败: "Failed",
  已发布: "Published",
  定时发布: "Scheduled",
  草稿: "Draft",
  使用中: "In Use",
  受限: "Restricted",
  公开: "Public",
  待清理: "To Clean",
  已发送: "Sent",
  未读: "Unread",
  投放中: "Running",
  排期中: "Scheduled",
  待审核: "Pending Review",
  已下线: "Offline",
  待发布: "Pending Publish",
  部分启用: "Partially Enabled",
  正常: "Normal",
  实时: "Real-time",
  待处理: "Pending",
  今天: "Today",
  昨天: "Yesterday",
  上周: "Last week",
  本周: "This week",
  明天: "Tomorrow",
  "今晚 19:00": "Tonight 19:00",
  "今晚 20:00": "Tonight 20:00",
  "明天 09:00": "Tomorrow 09:00",
  工作台: "Workbench",
  演示台: "Component Lab",
  系统管理: "System Management",
  查询列表: "Query List",
  权限管理: "Permission Management",
  菜单管理: "Menu Management",
  "部门 / 组织": "Departments / Organizations",
  "部门 / 组织管理": "Department / Organization Management",
  字典管理: "Dictionary Management",
  全局管理: "Global Management",
  开发: "Development",
  数据模型: "Data Models",
  内容运营: "Content Operations",
  "广告 Banner": "Ad Banner",
  文章管理: "Article Management",
  文件管理: "File Management",
  消息中心: "Message Center",
  通知公告: "Notices",
  站内信: "Inbox",
  审计中心: "Audit Center",
  操作日志: "Operation Logs",
  网站配置: "Site Configuration",
  系统配置: "System Configuration",
  刷新数据: "Refresh Data",
  查看组件: "View Components",
  同步模型: "Sync Models",
  新建角色: "New Role",
  新增权限: "Add Permission",
  新增部门: "Add Department",
  新建字典: "New Dictionary",
  保存配置: "Save Configuration",
  导出日志: "Export Logs",
  发布公告: "Publish Notice",
  上传文件: "Upload File",
  发送消息: "Send Message",
  "新建 Banner": "New Banner",
  新建文章: "New Article",
  今日访问: "Visits Today",
  待处理权限: "Permissions Pending",
  待发布内容: "Content Pending",
  未读站内信: "Unread Inbox",
  需复核: "Needs Review",
  "9 封紧急": "9 urgent",
  近7日运营趋势: "7-Day Operations Trend",
  "近 7 日运营趋势": "7-Day Operations Trend",
  查看报表: "View Report",
  趋势汇总: "Trend Summary",
  总访问: "Total Visits",
  较上周: "vs. last week",
  内容发布: "Content Published",
  本周累计: "This week total",
  新增用户: "New Users",
  注册转化: "Registration conversion",
  待办与风险: "Tasks & Risks",
  查看全部: "View All",
  最近操作: "Recent Operations",
  审计: "Audit",
  内容运营概况: "Content Operations Overview",
  查看内容: "View Content",
  "复核运营管理员菜单权限": "Review operations admin menu permissions",
  "首页 Banner 将于今晚 23:00 下线": "Homepage banner goes offline tonight at 23:00",
  "3 篇文章等待发布审批": "3 articles await publishing approval",
  "清理 12 个未归档上传文件": "Clean up 12 unarchived uploads",
  "Banner 投放": "Banner Delivery",
  "4 个广告位正在生效，1 个待审核": "4 ad slots active, 1 pending review",
  文章发布: "Article Publishing",
  "18 篇文章处于待发布或待审批状态": "18 articles are pending publish or approval",
  文件存储: "File Storage",
  "容量使用 72%，存在 12 个未引用文件": "72% capacity used, with 12 unreferenced files",
  周一: "Mon",
  周二: "Tue",
  周三: "Wed",
  周四: "Thu",
  周五: "Fri",
  周六: "Sat",
  周日: "Sun",
  运营管理员: "Operations Administrator",
  审计员: "Auditor",
  临时协作: "Temporary Collaboration",
  内容编辑: "Content Editor",
  活动运营: "Campaign Operator",
  客服主管: "Support Supervisor",
  财务复核: "Finance Reviewer",
  渠道经理: "Channel Manager",
  数据分析师: "Data Analyst",
  安全管理员: "Security Administrator",
  项目观察员: "Project Observer",
  临时审核员: "Temporary Reviewer",
  外包协作: "Vendor Collaboration",
  系统内置: "System Built-in",
  运营中心: "Operations Center",
  风控部: "Risk Control",
  项目组: "Project Team",
  财务部: "Finance",
  市场部: "Marketing",
  数据中心: "Data Center",
  产品组: "Product Team",
  总部: "Headquarters",
  技术平台部: "Technology Platform",
  活动项目组: "Campaign Project Team",
  增长组: "Growth Team",
  行政部: "Administration",
  设计组: "Design Team",
  帮助中心: "Help Center",
  活动: "Campaign",
  公告: "Announcement",
  案例: "Case Study",
  首页顶部: "Homepage Top",
  注册页: "Registration Page",
  活动页: "Campaign Page",
  角色权限: "Role Permission",
  按钮权限: "Button Permission",
  接口权限: "API Permission",
  一级菜单: "Primary Menu",
  二级菜单: "Secondary Menu",
  基础配置: "Basic Config",
  访问控制: "Access Control",
  集成: "Integration",
  安全: "Security",
  存储: "Storage",
  消息: "Messages",
  全员可见: "Visible to all",
  角色消息: "Role Message",
  个人消息: "Direct Message",
  部门消息: "Department Message",
  系统消息: "System Message",
  旧版专题促销图: "Legacy campaign promo image",
  夏季活动首页主Banner: "Summer campaign homepage banner",
  "夏季活动首页主 Banner": "Summer campaign homepage banner",
  新用户注册权益: "New user registration benefits",
  帮助中心升级公告: "Help center upgrade announcement",
  后台权限设计最佳实践: "Admin permission design best practices",
  夏季活动报名指南: "Summer campaign signup guide",
  文件上传规范: "File upload guidelines",
  "客户案例：内容运营提效": "Customer Case: Improving Content Operations",
  站点基础信息: "Site Basics",
  "SEO 与分享信息": "SEO & Sharing",
  前台开关: "Frontend Switches",
  统计脚本: "Analytics Scripts",
  登录安全策略: "Login Security Policy",
  文件上传限制: "File Upload Limits",
  通知通道: "Notification Channels",
  审计保留周期: "Audit Retention Period",
  更新角色权限: "Update Role Permissions",
  导出操作日志: "Export Operation Logs",
  删除文章草稿: "Delete Article Draft",
  上传文件失败: "File Upload Failed",
  端午假期值班安排: "Dragon Boat Holiday Duty Roster",
  内容审核规范更新: "Content Review Guidelines Updated",
  系统维护窗口: "System Maintenance Window",
  敏感权限复核提醒: "Sensitive Permission Review Reminder",
  权限申请已通过: "Permission Request Approved",
  文章审核被驳回: "Article Review Rejected",
  活动上线倒计时: "Campaign Launch Countdown",
  文件存储容量预警: "File Storage Capacity Alert",
};

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";

  return `${leading}${translated}${trailing}`;
}

function translateByPattern(text: string, locale: Locale): string | null {
  const t = (value: string) => translateText(value, locale);
  const compact = text.replace(/\s+/g, " ").trim();
  let match: RegExpMatchArray | null = null;

  match = compact.match(/^(.+) \/ (.+)$/);
  if (match) {
    return `${t(match[1])} / ${t(match[2])}`;
  }

  match = compact.match(/^(.+)、(.+)$/);
  if (match) {
    return `${t(match[1])}, ${t(match[2])}`;
  }

  match = compact.match(/^(.+) 已打开$/);
  if (match) {
    return `${t(match[1])} opened`;
  }

  match = compact.match(/^(.+)已打开$/);
  if (match) {
    return `${t(match[1])} opened`;
  }

  match = compact.match(/^(.+) 已关闭$/);
  if (match) {
    return `${t(match[1])} closed`;
  }

  match = compact.match(/^(.+) 已刷新$/);
  if (match) {
    return `${t(match[1])} refreshed`;
  }

  match = compact.match(/^已保留(.+)$/);
  if (match) {
    return `${t(match[1])} kept`;
  }

  match = compact.match(/^已关闭(.+)右侧标签$/);
  if (match) {
    return `Closed tabs to the right of ${t(match[1])}`;
  }

  match = compact.match(/^(.+)快捷新增入口已打开$/);
  if (match) {
    return `${t(match[1])} quick add opened`;
  }

  match = compact.match(/^(.+) 工作区已切换$/);
  if (match) {
    return `Switched to ${t(match[1])} workspace`;
  }

  match = compact.match(/^主题色已切换为(.+)$/);
  if (match) {
    return `Theme color switched to ${t(match[1])}`;
  }

  match = compact.match(/^标签风格已切换为(.+)$/);
  if (match) {
    return `Tab style switched to ${t(match[1])}`;
  }

  match = compact.match(/^主区风格已切换为(.+)$/);
  if (match) {
    return `Main area style switched to ${t(match[1])}`;
  }

  match = compact.match(/^关闭(.+)$/);
  if (match) {
    return `Close ${t(match[1])}`;
  }

  match = compact.match(/^(.+) 标签操作$/);
  if (match) {
    return `${t(match[1])} tab actions`;
  }

  match = compact.match(/^查看通知，(\d+) 条未读$/);
  if (match) {
    return `View notifications, ${match[1]} unread`;
  }

  match = compact.match(/^最近 (\d+) 条更新$/);
  if (match) {
    return `Recent ${match[1]} updates`;
  }

  match = compact.match(/^共 (\d+) 条$/);
  if (match) {
    return `${match[1]} total`;
  }

  match = compact.match(/^已选 (\d+) 条$/);
  if (match) {
    return `${match[1]} selected`;
  }

  match = compact.match(/^(\d+) 条\/页$/);
  if (match) {
    return `${match[1]} / page`;
  }

  match = compact.match(/^(\d+) 位成员$/);
  if (match) {
    return `${match[1]} members`;
  }

  match = compact.match(/^(\d+) 人$/);
  if (match) {
    return `${match[1]} people`;
  }

  match = compact.match(/^(\d+) 个枚举$/);
  if (match) {
    return `${match[1]} enum values`;
  }

  match = compact.match(/^(\d+) 个字段$/);
  if (match) {
    return `${match[1]} fields`;
  }

  match = compact.match(/^(\d+) 个必填$/);
  if (match) {
    return `${match[1]} required`;
  }

  match = compact.match(/^(\d+) 个索引$/);
  if (match) {
    return `${match[1]} indexes`;
  }

  match = compact.match(/^(\d+) 张表$/);
  if (match) {
    return `${match[1]} tables`;
  }

  match = compact.match(/^(\d+) 天前$/);
  if (match) {
    return `${match[1]} days ago`;
  }

  match = compact.match(/^今晚 (\d{1,2}:\d{2})$/);
  if (match) {
    return `Tonight ${match[1]}`;
  }

  match = compact.match(/^明天 (\d{1,2}:\d{2})$/);
  if (match) {
    return `Tomorrow ${match[1]}`;
  }

  match = compact.match(/^今天 (\d{1,2}:\d{2})$/);
  if (match) {
    return `Today ${match[1]}`;
  }

  match = compact.match(/^(.+)字段明细$/);
  if (match) {
    return `${t(match[1])} field details`;
  }

  match = compact.match(/^估算记录 ([\d,]+) 条$/);
  if (match) {
    return `Estimated records: ${match[1]}`;
  }

  match = compact.match(/^请输入(.+)$/);
  if (match) {
    return `Enter ${t(match[1]).toLowerCase()}`;
  }

  match = compact.match(/^选择(.+)$/);
  if (match) {
    return `Select ${t(match[1]).toLowerCase()}`;
  }

  match = compact.match(/^新增(.+)$/);
  if (match) {
    return `Add ${t(match[1])}`;
  }

  match = compact.match(/^新建(.+)$/);
  if (match) {
    return `New ${t(match[1])}`;
  }

  return null;
}

export function normalizeLocale(value: unknown): Locale {
  return value === "en-US" ? "en-US" : DEFAULT_LOCALE;
}

export function translateText(text: string, locale: Locale): string {
  if (locale === "zh-CN" || !text) {
    return text;
  }

  const trimmed = text.trim();

  if (!/[\u4e00-\u9fff]/.test(trimmed)) {
    return text;
  }

  const exact = enTranslations[trimmed];

  if (exact) {
    return preserveWhitespace(text, exact);
  }

  const patterned = translateByPattern(trimmed, locale);

  return patterned ? preserveWhitespace(text, patterned) : text;
}
