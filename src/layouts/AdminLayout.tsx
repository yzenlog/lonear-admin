import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import {
  Bell,
  Check,
  ChevronRight,
  KeyRound,
  Languages,
  Layers,
  LayoutPanelTop,
  Mail,
  Maximize2,
  Menu,
  Minimize2,
  Moon,
  Palette,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
} from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { getCurrentUserMenuTree } from "../api/system/menu";
import { ACCENT_COLOR_OPTIONS, MAIN_AREA_STYLE_OPTIONS, PAGE_TABS_STYLE_OPTIONS, TAB_STATE_STORAGE_KEY } from "../config/app";
import type { AccentColor, MainAreaStyle, PageTabsStyle, ThemeMode, UiSettings } from "../config/app";
import { moduleMeta, moduleRoutes, sections as defaultSections } from "../config/modules";
import type { ModuleId, NavSection } from "../config/modules";
import { moduleRecords } from "../mocks/managementRecords";
import type { ManagementRecord } from "../mocks/managementRecords";
import type { CurrentUser } from "../api/auth";
import { getInitialUiSettings, persistUiSettings, syncThemeMode } from "../services/session";
import { menuTreeToNavSections } from "../utils/menuNavigation";
import { getModuleIdFromPathname, getNavKeyForModule } from "../utils/navigation";
import PageTabs from "../components/shared/page-tabs/PageTabs";
import AppSidebar from "../components/shared/app-sidebar/AppSidebar";
import { LonButton, LonDrawer, LonInput, LonModal } from "../components/ui";
import { useLanguage } from "../i18n";
import "./AdminLayout.css";

type AdminLayoutProps = {
  currentUser: CurrentUser | null;
  themeMode: ThemeMode;
  onCurrentUserChange: (user: CurrentUser) => void;
  onThemeModeChange: (mode: ThemeMode) => void;
  onLogout: () => void;
};

type TopbarNotification = ManagementRecord & {
  id: string;
  moduleId: Extract<ModuleId, "messages" | "notices">;
  sourceLabel: string;
  unread: boolean;
};

const DEFAULT_SIDEBAR_WIDTH = 250;
const FOLDED_SIDEBAR_WIDTH = 70;
const MIN_SIDEBAR_WIDTH = 220;
const MAX_SIDEBAR_WIDTH = 360;
const SIDEBAR_RESIZE_KEYBOARD_STEP = 8;

function clampSidebarWidth(width: number) {
  return Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width));
}

function getDefaultOpenTabs(activeModule: ModuleId): ModuleId[] {
  return activeModule === "dashboard" ? ["dashboard"] : ["dashboard", activeModule];
}

function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(moduleRoutes, value);
}

function normalizeOpenTabs(tabIds: unknown[], activeModule: ModuleId): ModuleId[] {
  const tabs = tabIds.filter(isModuleId);
  const normalizedTabs: ModuleId[] = [];
  const tabCandidates: ModuleId[] = ["dashboard", ...tabs, activeModule];

  tabCandidates.forEach((tabId) => {
    if (!normalizedTabs.includes(tabId)) {
      normalizedTabs.push(tabId);
    }
  });

  return normalizedTabs;
}

function getInitialOpenTabs(activeModule: ModuleId): ModuleId[] {
  if (typeof window === "undefined") {
    return getDefaultOpenTabs(activeModule);
  }

  const settings = getInitialUiSettings();

  if (!settings.tabsPersistent) {
    return getDefaultOpenTabs(activeModule);
  }

  try {
    const rawTabs = window.localStorage.getItem(TAB_STATE_STORAGE_KEY);
    const parsedTabs = rawTabs ? (JSON.parse(rawTabs) as unknown) : [];

    return normalizeOpenTabs(Array.isArray(parsedTabs) ? parsedTabs : [], activeModule);
  } catch {
    return getDefaultOpenTabs(activeModule);
  }
}

function getFocusedSidebarState(navSections: NavSection[], activeNavKey: string) {
  const [activeType, activeSectionId, activeGroupId] = activeNavKey.split(":");
  const activePath = {
    sectionId: activeSectionId,
    groupId: activeType === "group" ? activeGroupId : undefined,
  };

  return navSections.reduce(
    (state, section) => {
      if (!section.standalone) {
        state.sections[section.id] = section.id !== activePath.sectionId;
      }

      section.groups?.forEach((group) => {
        state.groups[group.id] = section.id !== activePath.sectionId || group.id !== activePath.groupId;
      });

      return state;
    },
    {
      sections: {} as Record<string, boolean>,
      groups: {} as Record<string, boolean>,
    },
  );
}

function getExpandedSidebarState(navSections: NavSection[]) {
  return navSections.reduce(
    (state, section) => {
      if (!section.standalone) {
        state.sections[section.id] = false;
      }

      section.groups?.forEach((group) => {
        state.groups[group.id] = false;
      });

      return state;
    },
    {
      sections: {} as Record<string, boolean>,
      groups: {} as Record<string, boolean>,
    },
  );
}

function isStandaloneModule(moduleId: ModuleId, navSections: NavSection[]) {
  return navSections.some((section) => section.standalone && section.items?.some((item) => item.id === moduleId));
}

function getBreadcrumbItems(moduleId: ModuleId, scope: string, title: string, navSections: NavSection[]) {
  if (isStandaloneModule(moduleId, navSections)) {
    return [title];
  }

  return [...scope.split("/"), title].reduce<string[]>((items, item) => {
    const crumb = item.trim();

    if (crumb && items[items.length - 1] !== crumb) {
      items.push(crumb);
    }

    return items;
  }, []);
}

function getUserInitials(name: string) {
  const segments = name.trim().split(/\s+/).filter(Boolean);

  if (segments.length >= 2) {
    return `${segments[0][0]}${segments[1][0]}`.toUpperCase();
  }

  return Array.from(name.replace(/\s+/g, "")).slice(0, 2).join("").toUpperCase() || "U";
}

function getRoleLabel(roles?: string[]) {
  if (!roles || roles.length === 0) {
    return "默认角色";
  }

  const roleLabelMap: Record<string, string> = {
    admin: "管理员",
    editor: "编辑员",
    operator: "运营人员",
    "super-admin": "超级管理员",
  };

  return roles.map((role) => roleLabelMap[role] ?? role).join("、");
}

function AdminLayout({ currentUser, themeMode, onCurrentUserChange, onThemeModeChange, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { locale, t, toggleLocale } = useLanguage();
  const activeModule = getModuleIdFromPathname(location.pathname) ?? "dashboard";
  const [menuQuery, setMenuQuery] = useState("");
  const [uiSettings, setUiSettings] = useState<UiSettings>(getInitialUiSettings);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [sidebarFolded, setSidebarFolded] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarResizing, setSidebarResizing] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    system: false,
    content: false,
    message: false,
    audit: false,
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({
    global: false,
  });
  const [notice, setNotice] = useState("工作区已同步");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountSettingsError, setAccountSettingsError] = useState("");
  const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState(true);
  const [loginProtectionEnabled, setLoginProtectionEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [navSections, setNavSections] = useState<NavSection[]>(defaultSections);
  const [openTabs, setOpenTabs] = useState<ModuleId[]>(() => getInitialOpenTabs(activeModule));
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const sidebarResizeRef = useRef<{ startWidth: number; startX: number } | null>(null);
  const activeNavKey = useMemo(() => getNavKeyForModule(activeModule, navSections), [activeModule, navSections]);
  const meta = moduleMeta[activeModule];
  const breadcrumbItems = getBreadcrumbItems(activeModule, meta.scope, meta.title, navSections);
  const profileName = currentUser?.name.trim() || "未登录用户";
  const profileEmail = currentUser?.email?.trim() || "尚未绑定邮箱";
  const profileRole = getRoleLabel(currentUser?.roles);
  const profileId = currentUser?.id ?? "guest-session";
  const profileInitials = getUserInitials(profileName);
  const notificationItems = useMemo<TopbarNotification[]>(() => {
    const inboxItems = moduleRecords.messages.map((record, index) => ({
      ...record,
      id: `message-${index}`,
      moduleId: "messages" as const,
      sourceLabel: "站内信",
      unread: record.status === "未读",
    }));
    const noticeItems = moduleRecords.notices.map((record, index) => ({
      ...record,
      id: `notice-${index}`,
      moduleId: "notices" as const,
      sourceLabel: "公告",
      unread: record.status === "未读",
    }));

    return [...inboxItems, ...noticeItems].slice(0, 6);
  }, []);
  const unreadNotificationCount = notificationItems.filter((item) => item.unread).length;
  const appShellStyle = {
    "--sidebar-width": `${sidebarFolded ? FOLDED_SIDEBAR_WIDTH : sidebarWidth}px`,
  } as CSSProperties;

  useEffect(() => {
    let ignore = false;

    void getCurrentUserMenuTree()
      .then((menuTree) => {
        if (ignore) {
          return;
        }

        const nextSections = menuTreeToNavSections(menuTree);

        setNavSections(nextSections.length > 0 ? nextSections : defaultSections);
      })
      .catch(() => {
        if (ignore) {
          return;
        }

        setNavSections(defaultSections);
        setNotice("菜单加载失败，已使用本地菜单");
      });

    return () => {
      ignore = true;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    syncThemeMode(themeMode, uiSettings.accentColor, uiSettings.mainAreaStyle);
  }, [themeMode, uiSettings.accentColor, uiSettings.mainAreaStyle]);

  useEffect(() => {
    persistUiSettings(uiSettings);
  }, [uiSettings]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!uiSettings.tabsPersistent) {
      window.localStorage.removeItem(TAB_STATE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(TAB_STATE_STORAGE_KEY, JSON.stringify(openTabs));
  }, [openTabs, uiSettings.tabsPersistent]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    setOpenTabs((currentTabs) => normalizeOpenTabs(currentTabs, activeModule));
  }, [activeModule]);

  useEffect(() => {
    setAccountName(currentUser?.name.trim() ?? "");
    setAccountEmail(currentUser?.email?.trim() ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAccountSettingsError("");
  }, [currentUser?.email, currentUser?.id, currentUser?.name]);

  useEffect(() => {
    if (!workspaceOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!workspaceMenuRef.current?.contains(event.target as Node)) {
        setWorkspaceOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWorkspaceOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [workspaceOpen]);

  useEffect(() => {
    if (!userMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen]);

  useEffect(() => {
    if (!notificationOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!notificationMenuRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationOpen]);

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    if (!sidebarResizing) {
      return;
    }

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onPointerMove = (event: PointerEvent) => {
      const resizeState = sidebarResizeRef.current;

      if (!resizeState) {
        return;
      }

      setSidebarWidth(clampSidebarWidth(resizeState.startWidth + event.clientX - resizeState.startX));
    };

    const stopResizing = () => {
      sidebarResizeRef.current = null;
      setSidebarResizing(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResizing);
    window.addEventListener("pointercancel", stopResizing);

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResizing);
      window.removeEventListener("pointercancel", stopResizing);
    };
  }, [sidebarResizing]);

  function toggleSection(id: string) {
    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleGroup(id: string) {
    setCollapsedGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  function expandAllMenus() {
    const expandedSidebarState = getExpandedSidebarState(navSections);

    setMenuQuery("");
    setCollapsedSections(expandedSidebarState.sections);
    setCollapsedGroups(expandedSidebarState.groups);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setSidebarFolded(false);
    setNotice("已展开全部菜单");
  }

  function focusActiveMenu() {
    const focusedSidebarState = getFocusedSidebarState(navSections, activeNavKey);

    setMenuQuery("");
    setCollapsedSections(focusedSidebarState.sections);
    setCollapsedGroups(focusedSidebarState.groups);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setSidebarFolded(false);
    setNotice("已聚焦当前菜单");
  }

  function toggleSidebarFolded() {
    const nextFolded = !sidebarFolded;

    setMenuQuery("");
    setSidebarFolded(nextFolded);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setNotice(nextFolded ? "菜单已折叠" : "菜单已展开");
  }

  function handleSidebarResizeStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (sidebarFolded) {
      return;
    }

    event.preventDefault();
    sidebarResizeRef.current = {
      startWidth: sidebarWidth,
      startX: event.clientX,
    };
    setSidebarResizing(true);
  }

  function handleSidebarResizeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (sidebarFolded) {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      setSidebarWidth((width) => clampSidebarWidth(width - SIDEBAR_RESIZE_KEYBOARD_STEP));
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      setSidebarWidth((width) => clampSidebarWidth(width + SIDEBAR_RESIZE_KEYBOARD_STEP));
    }

    if (event.key === "Home") {
      event.preventDefault();
      setSidebarWidth(MIN_SIDEBAR_WIDTH);
    }

    if (event.key === "End") {
      event.preventDefault();
      setSidebarWidth(MAX_SIDEBAR_WIDTH);
    }
  }

  function activateModule(id: ModuleId) {
    navigate(moduleRoutes[id]);
    setNotice(`${moduleMeta[id].title} 已打开`);
    setNotificationOpen(false);
  }

  function selectTab(id: ModuleId) {
    navigate(moduleRoutes[id]);
    setNotice(`${moduleMeta[id].title} 已打开`);
    setNotificationOpen(false);
  }

  function closeTab(id: ModuleId) {
    if (id === "dashboard") {
      return;
    }

    const nextTabs = openTabs.filter((tabId) => tabId !== id);
    setOpenTabs(nextTabs);

    if (id === activeModule) {
      const closedIndex = openTabs.indexOf(id);
      const nextIndex = Math.max(0, Math.min(closedIndex, nextTabs.length - 1));
      const nextModule = nextTabs[nextIndex] ?? "dashboard";

      selectTab(nextModule);
    } else {
      setNotice(`${moduleMeta[id].title} 已关闭`);
      setNotificationOpen(false);
    }
  }

  function refreshTab(id: ModuleId) {
    if (id === activeModule) {
      navigate(moduleRoutes[id], { replace: true });
    } else {
      navigate(moduleRoutes[id]);
    }

    setContentRefreshKey((key) => key + 1);
    setNotice(`${moduleMeta[id].title} 已刷新`);
    setNotificationOpen(false);
  }

  function closeOtherTabs(id: ModuleId) {
    const nextTabs: ModuleId[] = id === "dashboard" ? ["dashboard"] : ["dashboard", id];
    setOpenTabs(nextTabs);

    if (activeModule !== id) {
      selectTab(id);
      return;
    }

    setNotice(`已保留${moduleMeta[id].title}`);
    setNotificationOpen(false);
  }

  function closeRightTabs(id: ModuleId) {
    const tabIndex = openTabs.indexOf(id);

    if (tabIndex < 0) {
      return;
    }

    const nextTabs = openTabs.filter((tabId, index) => tabId === "dashboard" || index <= tabIndex);
    setOpenTabs(nextTabs);

    if (!nextTabs.includes(activeModule)) {
      selectTab(id);
      return;
    }

    setNotice(`已关闭${moduleMeta[id].title}右侧标签`);
    setNotificationOpen(false);
  }

  function closeAllTabs() {
    setOpenTabs(["dashboard"]);

    if (activeModule !== "dashboard") {
      selectTab("dashboard");
      return;
    }

    setNotice("已关闭全部标签");
    setNotificationOpen(false);
  }

  function handleThemeModeChange(mode: ThemeMode) {
    onThemeModeChange(mode);
    setNotice(mode === "dark" ? "已切换为深色模式" : "已切换为浅色模式");
  }

  function handleThemeModeToggle() {
    const nextThemeMode = themeMode === "dark" ? "light" : "dark";

    handleThemeModeChange(nextThemeMode);
  }

  function handleLanguageToggle() {
    const nextLocale = locale === "zh-CN" ? "en-US" : "zh-CN";

    toggleLocale();
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setSettingsOpen(false);
    setNotice(nextLocale === "en-US" ? "已切换为英文界面" : "已切换为中文界面");
  }

  function handleSettingsToggle() {
    setSettingsOpen((open) => !open);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
  }

  async function handleFullscreenToggle() {
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setSettingsOpen(false);

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setNotice("已退出全屏");
        return;
      }

      await document.documentElement.requestFullscreen();
      setNotice("已进入全屏");
    } catch {
      setNotice("当前浏览器暂不支持全屏切换");
    }
  }

  function handleTabsPersistenceToggle() {
    const nextTabsPersistent = !uiSettings.tabsPersistent;

    setUiSettings((currentSettings) => ({
      ...currentSettings,
      tabsPersistent: nextTabsPersistent,
    }));
    setNotice(nextTabsPersistent ? "标签持久化已开启" : "标签持久化已关闭");
  }

  function handleNoticeToggle() {
    const nextShowNotice = !uiSettings.showNotice;

    setUiSettings((currentSettings) => ({
      ...currentSettings,
      showNotice: nextShowNotice,
    }));
    setNotice(nextShowNotice ? "状态提示已显示" : "状态提示已隐藏");
  }

  function handleAccentColorChange(accentColor: AccentColor) {
    const accentOption = ACCENT_COLOR_OPTIONS.find((option) => option.id === accentColor);

    setUiSettings((currentSettings) => ({
      ...currentSettings,
      accentColor,
    }));
    setNotice(`主题色已切换为${accentOption?.label ?? "默认"}`);
  }

  function handlePageTabsStyleChange(pageTabsStyle: PageTabsStyle) {
    const tabsStyleOption = PAGE_TABS_STYLE_OPTIONS.find((option) => option.id === pageTabsStyle);

    setUiSettings((currentSettings) => ({
      ...currentSettings,
      pageTabsStyle,
    }));
    setNotice(`标签风格已切换为${tabsStyleOption?.label ?? "默认"}`);
  }

  function handleMainAreaStyleChange(mainAreaStyle: MainAreaStyle) {
    const mainAreaStyleOption = MAIN_AREA_STYLE_OPTIONS.find((option) => option.id === mainAreaStyle);

    setUiSettings((currentSettings) => ({
      ...currentSettings,
      mainAreaStyle,
    }));
    setNotice(`主区风格已切换为${mainAreaStyleOption?.label ?? "传统"}`);
  }

  function handleSectionQuickAdd(section: NavSection) {
    setNotice(`${section.title}快捷新增入口已打开`);
  }

  function handleWorkspaceSelect(name: string) {
    setNotice(`${name} 工作区已切换`);
    setWorkspaceOpen(false);
  }

  function handleWorkspaceManage() {
    setNotice("工作区管理已打开");
    setWorkspaceOpen(false);
  }

  function handleUserMenuAction(label: string) {
    if (label === "个人资料") {
      setProfileOpen(true);
    }

    if (label === "账号设置") {
      resetAccountSettingsForm();
      setAccountSettingsOpen(true);
    }

    setNotice(`${label}已打开`);
    setUserMenuOpen(false);
  }

  function resetAccountSettingsForm() {
    setAccountName(currentUser?.name.trim() ?? "");
    setAccountEmail(currentUser?.email?.trim() ?? "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAccountSettingsError("");
  }

  function handleAccountSettingsClose() {
    setAccountSettingsOpen(false);
    resetAccountSettingsForm();
  }

  function handleAccountSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setAccountSettingsError("当前会话未登录，无法保存账号设置");
      return;
    }

    const normalizedName = accountName.trim();
    const normalizedEmail = accountEmail.trim();
    const passwordTouched = Boolean(currentPassword || newPassword || confirmPassword);

    if (normalizedName.length < 2) {
      setAccountSettingsError("昵称至少需要 2 个字符");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setAccountSettingsError("请输入有效邮箱地址");
      return;
    }

    if (passwordTouched) {
      if (currentPassword.trim().length < 6) {
        setAccountSettingsError("当前密码至少需要 6 位");
        return;
      }

      if (newPassword.length < 6) {
        setAccountSettingsError("新密码至少需要 6 位");
        return;
      }

      if (newPassword !== confirmPassword) {
        setAccountSettingsError("两次输入的新密码不一致");
        return;
      }
    }

    onCurrentUserChange({
      ...currentUser,
      email: normalizedEmail,
      name: normalizedName,
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setAccountSettingsError("");
    setAccountSettingsOpen(false);
    setNotice(passwordTouched ? "账号资料与密码设置已保存" : "账号资料已保存");
  }

  function handleNotificationToggle() {
    setNotificationOpen((open) => !open);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setSettingsOpen(false);
  }

  function handleNotificationOpen(item: TopbarNotification) {
    navigate(moduleRoutes[item.moduleId]);
    setNotice(`${item.title} 已打开`);
    setNotificationOpen(false);
  }

  function handleViewMoreNotifications() {
    navigate(moduleRoutes.messages);
    setNotice("站内信已打开");
    setNotificationOpen(false);
  }

  function handleLogout() {
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
    setAccountSettingsOpen(false);
    setSettingsOpen(false);
    onLogout();
  }

  return (
    <div
      className={`app-shell ${sidebarFolded ? "app-shell-sidebar-folded" : ""} ${
        sidebarResizing ? "app-shell-resizing" : ""
      } app-shell-${uiSettings.mainAreaStyle}`}
      style={appShellStyle}
    >
      <AppSidebar
        sections={navSections}
        activeNavKey={activeNavKey}
        query={menuQuery}
        workspaceOpen={workspaceOpen}
        userMenuOpen={userMenuOpen}
        folded={sidebarFolded}
        collapsedSections={collapsedSections}
        collapsedGroups={collapsedGroups}
        currentUser={currentUser}
        searchRef={searchRef}
        workspaceMenuRef={workspaceMenuRef}
        userMenuRef={userMenuRef}
        onQueryChange={setMenuQuery}
        onWorkspaceToggle={() => {
          setWorkspaceOpen((open) => !open);
          setUserMenuOpen(false);
          setNotificationOpen(false);
          setSettingsOpen(false);
        }}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceManage={handleWorkspaceManage}
        onUserMenuToggle={() => {
          setUserMenuOpen((open) => !open);
          setWorkspaceOpen(false);
          setNotificationOpen(false);
          setSettingsOpen(false);
        }}
        onUserMenuAction={handleUserMenuAction}
        onLogout={handleLogout}
        onExpandAllMenus={expandAllMenus}
        onFocusActiveMenu={focusActiveMenu}
        onToggleFolded={toggleSidebarFolded}
        onToggleSection={toggleSection}
        onToggleGroup={toggleGroup}
        onQuickAdd={handleSectionQuickAdd}
        onActivate={activateModule}
      />

      <main className="main-panel">
        {!sidebarFolded ? (
          <div
            className={`main-resize-handle ${sidebarResizing ? "dragging" : ""}`}
            role="separator"
            aria-orientation="vertical"
            aria-label={t("调整主区宽度")}
            aria-valuemin={MIN_SIDEBAR_WIDTH}
            aria-valuemax={MAX_SIDEBAR_WIDTH}
            aria-valuenow={sidebarWidth}
            tabIndex={0}
            onPointerDown={handleSidebarResizeStart}
            onKeyDown={handleSidebarResizeKeyDown}
          />
        ) : null}
        <div className="main-area-frame">
          <header className="topbar">
            <button className="mobile-menu icon-btn" type="button" aria-label="打开菜单">
              <Menu size={17} strokeWidth={2.1} />
            </button>
            <div className="breadcrumb" aria-label={t("当前位置")}>
              {breadcrumbItems.map((item, index) => (
                <Fragment key={`${item}-${index}`}>
                  {index > 0 ? <span className="sep">/</span> : null}
                  <span className={index === breadcrumbItems.length - 1 ? undefined : "crumb-muted"}>{t(item)}</span>
                </Fragment>
              ))}
            </div>
            <div className="topbar-actions">
              {uiSettings.showNotice ? <span className="notice">{t(notice)}</span> : null}
              <div className="notification-wrap" ref={notificationMenuRef}>
                <button
                  className={`icon-btn notification-trigger ${notificationOpen ? "active" : ""}`}
                  type="button"
                  aria-label={`查看通知，${unreadNotificationCount} 条未读`}
                  aria-haspopup="menu"
                  aria-expanded={notificationOpen}
                  onClick={handleNotificationToggle}
                >
                  <Bell size={17} strokeWidth={2.1} />
                  {unreadNotificationCount > 0 ? (
                    <span className="notification-badge" aria-hidden="true">
                      {unreadNotificationCount}
                    </span>
                  ) : null}
                </button>
                {notificationOpen ? (
                  <div className="notification-popover" role="menu" aria-label="最新通知">
                    <div className="notification-popover-head">
                      <div>
                        <strong>最新通知</strong>
                        <span>最近 {notificationItems.length} 条更新</span>
                      </div>
                    </div>
                    <div className="notification-list">
                      {notificationItems.map((item) => {
                        const SourceIcon = moduleMeta[item.moduleId].icon;

                        return (
                          <button
                            className={`notification-item ${item.unread ? "unread" : ""}`}
                            type="button"
                            role="menuitem"
                            key={item.id}
                            onClick={() => handleNotificationOpen(item)}
                          >
                            <span className={`notification-source ${item.tone}`} aria-hidden="true">
                              <SourceIcon size={14} strokeWidth={2.2} />
                            </span>
                            <span className="notification-copy">
                              <span className="notification-title-line">
                                <strong>{item.title}</strong>
                                <span>{item.updated}</span>
                              </span>
                              <span className="notification-description">{item.description}</span>
                              <span className="notification-meta-line">
                                <span>{item.sourceLabel}</span>
                                <span>{item.status}</span>
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <button
                      className="notification-more"
                      type="button"
                      role="menuitem"
                      onClick={handleViewMoreNotifications}
                    >
                      查看更多
                      <ChevronRight size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                className={`icon-btn fullscreen-trigger ${isFullscreen ? "active" : ""}`}
                type="button"
                aria-label={isFullscreen ? "退出全屏" : "进入全屏"}
                aria-pressed={isFullscreen}
                onClick={() => void handleFullscreenToggle()}
              >
                {isFullscreen ? <Minimize2 size={17} strokeWidth={2.1} /> : <Maximize2 size={17} strokeWidth={2.1} />}
              </button>
              <button
                className={`icon-btn settings-trigger ${settingsOpen ? "active" : ""}`}
                type="button"
                aria-label="系统设置"
                aria-expanded={settingsOpen}
                onClick={handleSettingsToggle}
              >
                <Settings size={17} strokeWidth={2.1} />
              </button>
              <button
                className="language-switch"
                type="button"
                role="switch"
                aria-checked={locale === "en-US"}
                aria-label={
                  locale === "en-US"
                    ? "English interface, click to switch to Chinese"
                    : "中文界面，点击切换到英文"
                }
                title={t("语言")}
                onClick={handleLanguageToggle}
              >
                <Languages className="language-switch-icon" size={17} strokeWidth={2.1} aria-hidden="true" />
                <span className="language-switch-label" aria-hidden="true">
                  {locale === "en-US" ? "EN" : "CN"}
                </span>
              </button>
              <button
                className={`theme-switch theme-switch-${themeMode}`}
                type="button"
                role="switch"
                aria-checked={themeMode === "dark"}
                aria-label={themeMode === "dark" ? "深色模式，点击切换为浅色模式" : "浅色模式，点击切换为深色模式"}
                onClick={handleThemeModeToggle}
              >
                <span className="theme-switch-icon theme-switch-icon-light" aria-hidden="true">
                  <Sun size={13} strokeWidth={2.2} />
                </span>
                <span className="theme-switch-icon theme-switch-icon-dark" aria-hidden="true">
                  <Moon size={13} strokeWidth={2.2} />
                </span>
                <span className="theme-switch-thumb" aria-hidden="true" />
              </button>
            </div>
          </header>

          <PageTabs
            tabs={openTabs}
            activeModule={activeModule}
            styleVariant={uiSettings.pageTabsStyle}
            onSelect={selectTab}
            onRefresh={refreshTab}
            onClose={closeTab}
            onCloseOthers={closeOtherTabs}
            onCloseRight={closeRightTabs}
            onCloseAll={closeAllTabs}
          />

          <div className="admin-content">
            <Outlet key={`${location.pathname}-${contentRefreshKey}`} />
          </div>
        </div>

        <LonDrawer
          open={settingsOpen}
          title="系统设置"
          description="界面偏好会保存在当前浏览器。"
          placement="right"
          onClose={() => setSettingsOpen(false)}
        >
          <div className="system-settings">
            <section className="settings-section" aria-labelledby="settings-workspace-title">
              <div className="settings-section-head">
                <Settings size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="settings-workspace-title">工作区</h3>
              </div>
              <button
                className="settings-row"
                type="button"
                aria-pressed={uiSettings.tabsPersistent}
                onClick={handleTabsPersistenceToggle}
              >
                <span className="settings-row-copy">
                  <strong>标签持久化</strong>
                  <small>下次进入时恢复已打开页面</small>
                </span>
                <span className={`settings-toggle ${uiSettings.tabsPersistent ? "active" : ""}`} aria-hidden="true">
                  <span />
                </span>
              </button>
              <button
                className="settings-row"
                type="button"
                aria-pressed={uiSettings.showNotice}
                onClick={handleNoticeToggle}
              >
                <span className="settings-row-copy">
                  <strong>状态提示</strong>
                  <small>在顶部显示最近一次操作反馈</small>
                </span>
                <span className={`settings-toggle ${uiSettings.showNotice ? "active" : ""}`} aria-hidden="true">
                  <span />
                </span>
              </button>
            </section>

            <section className="settings-section" aria-labelledby="settings-main-area-style-title">
              <div className="settings-section-head">
                <LayoutPanelTop size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="settings-main-area-style-title">主区风格</h3>
              </div>
              <div className="main-style-grid" role="radiogroup" aria-label="主区风格">
                {MAIN_AREA_STYLE_OPTIONS.map((option) => {
                  const active = uiSettings.mainAreaStyle === option.id;

                  return (
                    <button
                      className={`main-style-option ${active ? "active" : ""}`}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      key={option.id}
                      onClick={() => handleMainAreaStyleChange(option.id)}
                    >
                      <span className={`main-style-preview main-style-preview-${option.id}`} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="main-style-copy">
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                      {active ? <Check size={14} strokeWidth={2.3} /> : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="settings-section" aria-labelledby="settings-tabs-style-title">
              <div className="settings-section-head">
                <Layers size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="settings-tabs-style-title">标签风格</h3>
              </div>
              <div className="tab-style-grid" role="radiogroup" aria-label="标签风格">
                {PAGE_TABS_STYLE_OPTIONS.map((option) => {
                  const active = uiSettings.pageTabsStyle === option.id;

                  return (
                    <button
                      className={`tab-style-option ${active ? "active" : ""}`}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      key={option.id}
                      onClick={() => handlePageTabsStyleChange(option.id)}
                    >
                      <span className={`tab-style-preview tab-style-preview-${option.id}`} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                      <span className="tab-style-copy">
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                      {active ? <Check size={14} strokeWidth={2.3} /> : null}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="settings-section" aria-labelledby="settings-theme-title">
              <div className="settings-section-head">
                <Palette size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="settings-theme-title">主题色</h3>
              </div>
              <div className="accent-grid">
                {ACCENT_COLOR_OPTIONS.map((option) => (
                  <button
                    className={`accent-option ${uiSettings.accentColor === option.id ? "active" : ""}`}
                    type="button"
                    aria-label={`主题色${option.label}`}
                    aria-pressed={uiSettings.accentColor === option.id}
                    key={option.id}
                    style={{ "--accent-preview": option.previewColor } as CSSProperties}
                    onClick={() => handleAccentColorChange(option.id)}
                  >
                    <span className="accent-preview" aria-hidden="true" />
                    <span>{option.label}</span>
                    {uiSettings.accentColor === option.id ? <Check size={14} strokeWidth={2.3} /> : null}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </LonDrawer>

        <LonModal
          open={profileOpen}
          title="个人资料"
          description="当前登录账号的基础信息。"
          size="small"
          footer={
            <LonButton type="button" onClick={() => setProfileOpen(false)}>
              关闭
            </LonButton>
          }
          onClose={() => setProfileOpen(false)}
        >
          <div className="profile-modal">
            <div className="profile-modal-head">
              <span className="profile-modal-avatar" aria-hidden="true">
                {profileInitials}
              </span>
              <span className="profile-modal-title">
                <strong>{profileName}</strong>
                <small>{profileEmail}</small>
              </span>
            </div>
            <dl className="profile-modal-list">
              <div>
                <dt>账号 ID</dt>
                <dd>{profileId}</dd>
              </div>
              <div>
                <dt>当前角色</dt>
                <dd>{profileRole}</dd>
              </div>
              <div>
                <dt>登录状态</dt>
                <dd>{currentUser ? "在线" : "未登录"}</dd>
              </div>
            </dl>
          </div>
        </LonModal>

        <LonModal
          open={accountSettingsOpen}
          title="账号设置"
          description="更新账号资料、界面偏好与登录安全。"
          size="default"
          footer={
            <>
              <LonButton variant="secondary" type="button" onClick={handleAccountSettingsClose}>
                取消
              </LonButton>
              <LonButton form="account-settings-form" type="submit">
                保存设置
              </LonButton>
            </>
          }
          onClose={handleAccountSettingsClose}
        >
          <form
            className="account-settings-modal"
            id="account-settings-form"
            noValidate
            onSubmit={handleAccountSettingsSubmit}
          >
            <section className="account-settings-section" aria-labelledby="account-settings-profile-title">
              <div className="account-settings-section-head">
                <UserRound size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="account-settings-profile-title">账号资料</h3>
              </div>
              <div className="account-settings-fields">
                <LonInput
                  label="昵称"
                  value={accountName}
                  leadingIcon={<UserRound size={15} strokeWidth={2.1} />}
                  placeholder="请输入昵称"
                  onChange={(event) => {
                    setAccountName(event.target.value);
                    setAccountSettingsError("");
                  }}
                />
                <LonInput
                  label="邮箱"
                  value={accountEmail}
                  leadingIcon={<Mail size={15} strokeWidth={2.1} />}
                  placeholder="请输入邮箱"
                  type="email"
                  onChange={(event) => {
                    setAccountEmail(event.target.value);
                    setAccountSettingsError("");
                  }}
                />
              </div>
            </section>

            <section className="account-settings-section" aria-labelledby="account-settings-preference-title">
              <div className="account-settings-section-head">
                <Settings size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="account-settings-preference-title">界面偏好</h3>
              </div>
              <button
                className="account-settings-row"
                type="button"
                aria-pressed={uiSettings.tabsPersistent}
                onClick={handleTabsPersistenceToggle}
              >
                <span className="settings-row-copy">
                  <strong>标签持久化</strong>
                  <small>下次进入时恢复已打开页面</small>
                </span>
                <span className={`settings-toggle ${uiSettings.tabsPersistent ? "active" : ""}`} aria-hidden="true">
                  <span />
                </span>
              </button>
              <button
                className="account-settings-row"
                type="button"
                aria-pressed={uiSettings.showNotice}
                onClick={handleNoticeToggle}
              >
                <span className="settings-row-copy">
                  <strong>状态提示</strong>
                  <small>在顶部显示最近一次操作反馈</small>
                </span>
                <span className={`settings-toggle ${uiSettings.showNotice ? "active" : ""}`} aria-hidden="true">
                  <span />
                </span>
              </button>
            </section>

            <section className="account-settings-section" aria-labelledby="account-settings-security-title">
              <div className="account-settings-section-head">
                <ShieldCheck size={15} strokeWidth={2.2} aria-hidden="true" />
                <h3 id="account-settings-security-title">安全设置</h3>
              </div>
              <button
                className="account-settings-row"
                type="button"
                aria-pressed={securityAlertsEnabled}
                onClick={() => setSecurityAlertsEnabled((enabled) => !enabled)}
              >
                <span className="settings-row-copy">
                  <strong>安全提醒</strong>
                  <small>异常登录时发送站内提醒</small>
                </span>
                <span className={`settings-toggle ${securityAlertsEnabled ? "active" : ""}`} aria-hidden="true">
                  <span />
                </span>
              </button>
              <button
                className="account-settings-row"
                type="button"
                aria-pressed={loginProtectionEnabled}
                onClick={() => setLoginProtectionEnabled((enabled) => !enabled)}
              >
                <span className="settings-row-copy">
                  <strong>登录保护</strong>
                  <small>敏感操作前要求二次确认</small>
                </span>
                <span className={`settings-toggle ${loginProtectionEnabled ? "active" : ""}`} aria-hidden="true">
                  <span />
                </span>
              </button>
              <div className="account-password-grid">
                <LonInput
                  label="当前密码"
                  value={currentPassword}
                  autoComplete="current-password"
                  leadingIcon={<KeyRound size={15} strokeWidth={2.1} />}
                  placeholder="不修改密码可留空"
                  type="password"
                  onChange={(event) => {
                    setCurrentPassword(event.target.value);
                    setAccountSettingsError("");
                  }}
                />
                <LonInput
                  label="新密码"
                  value={newPassword}
                  autoComplete="new-password"
                  leadingIcon={<KeyRound size={15} strokeWidth={2.1} />}
                  placeholder="至少 6 位"
                  type="password"
                  onChange={(event) => {
                    setNewPassword(event.target.value);
                    setAccountSettingsError("");
                  }}
                />
                <LonInput
                  label="确认新密码"
                  value={confirmPassword}
                  autoComplete="new-password"
                  leadingIcon={<KeyRound size={15} strokeWidth={2.1} />}
                  placeholder="再次输入新密码"
                  type="password"
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setAccountSettingsError("");
                  }}
                />
              </div>
            </section>

            {accountSettingsError ? (
              <div className="account-settings-error" role="alert">
                {accountSettingsError}
              </div>
            ) : null}
          </form>
        </LonModal>
      </main>
    </div>
  );
}

export default AdminLayout;
