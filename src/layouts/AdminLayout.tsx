import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Download, Menu, Moon, Sun } from "lucide-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { ThemeMode } from "../config/app";
import { moduleMeta, moduleRoutes, sections } from "../config/modules";
import type { ModuleId, NavSection } from "../config/modules";
import { getInitialThemeMode, syncThemeMode } from "../services/session";
import { getModuleIdFromPathname, getNavKeyForModule } from "../utils/navigation";
import PageTabs from "../components/shared/page-tabs/PageTabs";
import AppSidebar from "../components/shared/app-sidebar/AppSidebar";
import "./AdminLayout.css";

export type AdminLayoutOutletContext = {
  query: string;
};

type AdminLayoutProps = {
  onLogout: () => void;
};

function AdminLayout({ onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeModule = getModuleIdFromPathname(location.pathname) ?? "dashboard";
  const [query, setQuery] = useState("");
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
  const [openTabs, setOpenTabs] = useState<ModuleId[]>(() =>
    activeModule === "dashboard" ? ["dashboard"] : ["dashboard", activeModule],
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const workspaceMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const activeNavKey = useMemo(() => getNavKeyForModule(activeModule), [activeModule]);
  const meta = moduleMeta[activeModule];

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

  function toggleSection(id: string) {
    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleGroup(id: string) {
    setCollapsedGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  function activateModule(id: ModuleId) {
    navigate(moduleRoutes[id]);
    setNotice(`${moduleMeta[id].title} 已打开`);
  }

  function selectTab(id: ModuleId) {
    navigate(moduleRoutes[id]);
    setNotice(`${moduleMeta[id].title} 已打开`);
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
    }
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

  function handleLogout() {
    setUserMenuOpen(false);
    onLogout();
  }

  return (
    <div className="app-shell">
      <AppSidebar
        sections={sections}
        activeNavKey={activeNavKey}
        query={query}
        workspaceOpen={workspaceOpen}
        userMenuOpen={userMenuOpen}
        collapsedSections={collapsedSections}
        collapsedGroups={collapsedGroups}
        searchRef={searchRef}
        workspaceMenuRef={workspaceMenuRef}
        userMenuRef={userMenuRef}
        onQueryChange={setQuery}
        onWorkspaceToggle={() => {
          setWorkspaceOpen((open) => !open);
          setUserMenuOpen(false);
        }}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceManage={handleWorkspaceManage}
        onUserMenuToggle={() => {
          setUserMenuOpen((open) => !open);
          setWorkspaceOpen(false);
        }}
        onUserMenuAction={handleUserMenuAction}
        onLogout={handleLogout}
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
            <button className="icon-btn" type="button" aria-label="通知">
              <Bell size={17} strokeWidth={2.1} />
            </button>
            <button className="icon-btn" type="button" aria-label="导出">
              <Download size={17} strokeWidth={2.1} />
            </button>
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

        <PageTabs tabs={openTabs} activeModule={activeModule} onSelect={selectTab} onClose={closeTab} />

        <div className="admin-content">
          <Outlet context={{ query }} />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
