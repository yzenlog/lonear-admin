import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, Menu, Moon, Sun } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ThemeMode } from "../config/app";
import { moduleMeta, moduleRoutes, sections } from "../config/modules";
import type { ModuleId, NavSection } from "../config/modules";
import { moduleRecords } from "../mocks/managementRecords";
import type { ManagementRecord } from "../mocks/managementRecords";
import { getInitialThemeMode, syncThemeMode } from "../services/session";
import { getModuleIdFromPathname, getNavKeyForModule } from "../utils/navigation";
import PageTabs from "../components/shared/page-tabs/PageTabs";
import AppSidebar from "../components/shared/app-sidebar/AppSidebar";
import "./AdminLayout.css";

type AdminLayoutProps = {
  onLogout: () => void;
};

type TopbarNotification = ManagementRecord & {
  id: string;
  moduleId: Extract<ModuleId, "messages" | "notices">;
  sourceLabel: string;
  unread: boolean;
};

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

function AdminLayout({ onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeModule = getModuleIdFromPathname(location.pathname) ?? "dashboard";
  const [menuQuery, setMenuQuery] = useState("");
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
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
  const [openTabs, setOpenTabs] = useState<ModuleId[]>(() =>
    activeModule === "dashboard" ? ["dashboard"] : ["dashboard", activeModule],
  );
  const [contentRefreshKey, setContentRefreshKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const activeNavKey = useMemo(() => getNavKeyForModule(activeModule), [activeModule]);
  const meta = moduleMeta[activeModule];
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
    syncThemeMode(themeMode);
  }, [themeMode]);

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
    setOpenTabs((currentTabs) => (currentTabs.includes(activeModule) ? currentTabs : [...currentTabs, activeModule]));
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
    const expandedSidebarState = getExpandedSidebarState(sections);

    setMenuQuery("");
    setCollapsedSections(expandedSidebarState.sections);
    setCollapsedGroups(expandedSidebarState.groups);
    setWorkspaceOpen(false);
    setUserMenuOpen(false);
    setNotificationOpen(false);
    setNotice("已展开全部菜单");
  }

  function focusActiveMenu() {
    const focusedSidebarState = getFocusedSidebarState(sections, activeNavKey);

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
    setThemeMode(mode);
    setNotice(mode === "dark" ? "已切换为 dark 主题" : "已切换为 light 主题");
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
    onLogout();
  }

  return (
    <div className="app-shell">
      <AppSidebar
        sections={sections}
        activeNavKey={activeNavKey}
        query={menuQuery}
        workspaceOpen={workspaceOpen}
        userMenuOpen={userMenuOpen}
        collapsedSections={collapsedSections}
        collapsedGroups={collapsedGroups}
        searchRef={searchRef}
        workspaceMenuRef={workspaceMenuRef}
        userMenuRef={userMenuRef}
        onQueryChange={setMenuQuery}
        onWorkspaceToggle={() => {
          setWorkspaceOpen((open) => !open);
          setUserMenuOpen(false);
          setNotificationOpen(false);
        }}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceManage={handleWorkspaceManage}
        onUserMenuToggle={() => {
          setUserMenuOpen((open) => !open);
          setWorkspaceOpen(false);
          setNotificationOpen(false);
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
        <header className="topbar">
          <button className="mobile-menu icon-btn" type="button" aria-label="打开菜单">
            <Menu size={17} strokeWidth={2.1} />
          </button>
          <div className="breadcrumb" aria-label="当前位置">
            <span className="crumb-muted">{meta.scope}</span>
            <span className="sep">/</span>
            <span>{meta.title}</span>
          </div>
          <div className="topbar-actions">
            <span className="notice">{notice}</span>
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
            <div className="theme-switch" role="group" aria-label="light dark 主题切换">
              <button
                className={`theme-option ${themeMode === "light" ? "active" : ""}`}
                type="button"
                aria-pressed={themeMode === "light"}
                onClick={() => handleThemeModeChange("light")}
              >
                <Sun size={13} strokeWidth={2.2} />
                <span>light</span>
              </button>
              <button
                className={`theme-option ${themeMode === "dark" ? "active" : ""}`}
                type="button"
                aria-pressed={themeMode === "dark"}
                onClick={() => handleThemeModeChange("dark")}
              >
                <Moon size={13} strokeWidth={2.2} />
                <span>dark</span>
              </button>
            </div>
          </div>
        </header>

        <PageTabs
          tabs={openTabs}
          activeModule={activeModule}
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
      </main>
    </div>
  );
}

export default AdminLayout;
