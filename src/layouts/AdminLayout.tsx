import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Bell, Check, ChevronRight, Layers, LayoutPanelTop, Menu, Moon, Palette, Settings, Sun } from "lucide-react";
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
import { LonDrawer } from "../components/ui";
import "./AdminLayout.css";

type AdminLayoutProps = {
  currentUser: CurrentUser | null;
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
  onLogout: () => void;
};

type TopbarNotification = ManagementRecord & {
  id: string;
  moduleId: Extract<ModuleId, "messages" | "notices">;
  sourceLabel: string;
  unread: boolean;
};

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

function AdminLayout({ currentUser, themeMode, onThemeModeChange, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeModule = getModuleIdFromPathname(location.pathname) ?? "dashboard";
  const [menuQuery, setMenuQuery] = useState("");
  const [uiSettings, setUiSettings] = useState<UiSettings>(getInitialUiSettings);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navSections, setNavSections] = useState<NavSection[]>(defaultSections);
  const [openTabs, setOpenTabs] = useState<ModuleId[]>(() => getInitialOpenTabs(activeModule));
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const activeNavKey = useMemo(() => getNavKeyForModule(activeModule, navSections), [activeModule, navSections]);
  const meta = moduleMeta[activeModule];
  const breadcrumbItems = getBreadcrumbItems(activeModule, meta.scope, meta.title, navSections);
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
    syncThemeMode(themeMode, uiSettings.accentColor);
  }, [themeMode, uiSettings.accentColor]);

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
    setNotice("已聚焦当前菜单");
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

  function handleSettingsToggle() {
    setSettingsOpen((open) => !open);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
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
    setNotice(`${label}已打开`);
    setUserMenuOpen(false);
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
    setSettingsOpen(false);
    onLogout();
  }

  return (
    <div className={`app-shell app-shell-${uiSettings.mainAreaStyle}`}>
      <AppSidebar
        sections={navSections}
        activeNavKey={activeNavKey}
        query={menuQuery}
        workspaceOpen={workspaceOpen}
        userMenuOpen={userMenuOpen}
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
        onToggleSection={toggleSection}
        onToggleGroup={toggleGroup}
        onQuickAdd={handleSectionQuickAdd}
        onActivate={activateModule}
      />

      <main className="main-panel">
        <div className="main-area-frame">
          <header className="topbar">
            <button className="mobile-menu icon-btn" type="button" aria-label="打开菜单">
              <Menu size={17} strokeWidth={2.1} />
            </button>
            <div className="breadcrumb" aria-label="当前位置">
              {breadcrumbItems.map((item, index) => (
                <Fragment key={`${item}-${index}`}>
                  {index > 0 ? <span className="sep">/</span> : null}
                  <span className={index === breadcrumbItems.length - 1 ? undefined : "crumb-muted"}>{item}</span>
                </Fragment>
              ))}
            </div>
            <div className="topbar-actions">
              {uiSettings.showNotice ? <span className="notice">{notice}</span> : null}
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
                className={`icon-btn settings-trigger ${settingsOpen ? "active" : ""}`}
                type="button"
                aria-label="系统设置"
                aria-expanded={settingsOpen}
                onClick={handleSettingsToggle}
              >
                <Settings size={17} strokeWidth={2.1} />
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
      </main>
    </div>
  );
}

export default AdminLayout;
