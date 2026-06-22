import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  Bell,
  Check,
  ChevronDown,
  Command,
  Download,
  Eye,
  ListFilter,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  PanelRight,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  CheckboxGroup,
  DatePicker,
  Drawer,
  Input,
  Modal,
  NumberInput,
  RadioGroup,
  Select,
  Upload,
  useMessage,
  useNotification,
} from "./components/ui";
import type { ButtonVariant, ButtonVisualState, DrawerPlacement, NumberInputValue } from "./components/ui";
import { contentHealth, metrics, moduleMeta, moduleRecords, moduleRoutes, sections, workbenchTasks } from "./data";
import type { ManagementRecord, ModuleId, NavGroup, NavItem, NavSection, StatusTone } from "./data";
import LoginPage from "./pages/LoginPage";

const AUTH_STORAGE_KEY = "admin-linear-demo-auth";
const THEME_STORAGE_KEY = "admin-linear-demo-theme";
const DASHBOARD_NAV_KEY = "section:dashboard:dashboard:工作台";
const moduleRouteEntries = Object.entries(moduleRoutes) as Array<[ModuleId, string]>;
const DEFAULT_ROLE_FILTERS = {
  keyword: "",
  status: "all",
  owner: "all",
  roleType: "all",
  memberSize: "all",
  updatedRange: "all",
};
const ROLE_PAGE_SIZE = 10;
const roleDisplayFields = [
  { id: "members", label: "成员" },
  { id: "owner", label: "所属组织" },
  { id: "status", label: "状态" },
  { id: "updated", label: "更新时间" },
] as const;

type RoleFilters = typeof DEFAULT_ROLE_FILTERS;
type RoleDisplayField = (typeof roleDisplayFields)[number]["id"];
type ThemeMode = "light" | "dark";
type SearchSelectOption = {
  value: string;
  label: string;
};
type ButtonDemoButton = {
  label: string;
  variant: ButtonVariant;
  visualState?: ButtonVisualState;
  loading?: boolean;
  disabled?: boolean;
};
type FormDemoValues = {
  title: string;
  quota: NumberInputValue;
  publishDate: string;
  scope: string;
  channels: string[];
  owner: string;
};
type ModalDemoType = "basic" | "confirm" | "large" | null;
type DrawerDemoType = DrawerPlacement | "detail" | null;

const DEFAULT_VISIBLE_ROLE_COLUMNS: Record<RoleDisplayField, boolean> = {
  members: true,
  owner: true,
  status: true,
  updated: true,
};

function getRoleMemberCount(record: ManagementRecord) {
  return Number.parseInt(record.meta, 10) || 0;
}

function getRoleType(record: ManagementRecord) {
  if (record.owner === "系统内置") {
    return "system";
  }

  if (record.status === "只读") {
    return "readonly";
  }

  if (record.status === "待复核" || record.title.includes("临时")) {
    return "temporary";
  }

  return "business";
}

function getRoleUpdatedRange(record: ManagementRecord) {
  if (record.updated === "今天") {
    return "today";
  }

  if (record.updated === "昨天" || record.updated.includes("天前")) {
    return "recent";
  }

  return "older";
}

function getInitialAuthState() {
  return (
    window.localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
}

function getInitialThemeMode(): ThemeMode {
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}

function normalizePathname(pathname: string) {
  const normalizedPathname = pathname.replace(/\/+$/, "");
  return normalizedPathname || "/";
}

function getModuleIdFromPathname(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  return moduleRouteEntries.find(([, routePath]) => routePath === normalizedPathname)?.[0];
}

function getNavKeyForModule(moduleId: ModuleId) {
  for (const section of sections) {
    const sectionItem = section.items?.find((item) => item.id === moduleId);

    if (sectionItem) {
      return `section:${section.id}:${sectionItem.id}:${sectionItem.label}`;
    }

    for (const group of section.groups ?? []) {
      const groupItem = group.items.find((item) => item.id === moduleId);

      if (groupItem) {
        return `group:${section.id}:${group.id}:${groupItem.id}:${groupItem.label}`;
      }
    }
  }

  return DASHBOARD_NAV_KEY;
}

function getProtectedLoginPath(pathname: string) {
  const redirectPath = normalizePathname(pathname);

  if (!getModuleIdFromPathname(redirectPath)) {
    return "/login";
  }

  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}

function getLoginRedirectPath(state: unknown, search: string) {
  const redirectParam = new URLSearchParams(search).get("redirect");

  if (redirectParam && getModuleIdFromPathname(redirectParam)) {
    return normalizePathname(redirectParam);
  }

  if (state && typeof state === "object" && "from" in state) {
    const from = (state as { from?: unknown }).from;

    if (typeof from === "string" && getModuleIdFromPathname(from)) {
      return normalizePathname(from);
    }
  }

  return moduleRoutes.dashboard;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeModule = getModuleIdFromPathname(location.pathname) ?? "dashboard";
  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState);
  const [loginEmail, setLoginEmail] = useState("admin@acme.local");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginStatus, setLoginStatus] = useState<"idle" | "loading">("idle");
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("企业账号受保护，登录后进入当前工作区。");
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

  useEffect(() => {
    const themeColor = themeMode === "dark" ? "#111318" : "#ffffff";

    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode === "dark" ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
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

  const filteredRecords = useMemo(() => {
    if (activeModule === "dashboard") {
      return [];
    }

    const normalized = query.trim().toLowerCase();
    const records = moduleRecords[activeModule];

    if (!normalized) {
      return records;
    }

    return records.filter((record) =>
      [record.title, record.description, record.meta, record.owner, record.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [activeModule, query]);

  const meta = moduleMeta[activeModule];

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = loginEmail.trim();
    const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const hasValidPassword = loginPassword.trim().length >= 6;

    if (!hasValidEmail || !hasValidPassword) {
      setLoginError("请输入有效邮箱和至少 6 位密码");
      setLoginMessage("");
      return;
    }

    setLoginError("");
    setLoginStatus("loading");

    window.setTimeout(() => {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
      const authStorage = rememberSession ? window.localStorage : window.sessionStorage;

      authStorage.setItem(AUTH_STORAGE_KEY, "true");
      setLoginStatus("idle");
      setIsAuthenticated(true);
      navigate(getLoginRedirectPath(location.state, location.search), { replace: true });
      setNotice(rememberSession ? "登录成功，工作区已同步" : "本次会话已登录");
    }, 520);
  }

  function updateLoginEmail(value: string) {
    setLoginEmail(value);
    setLoginError("");
    setLoginMessage("企业账号受保护，登录后进入当前工作区。");
  }

  function updateLoginPassword(value: string) {
    setLoginPassword(value);
    setLoginError("");
    setLoginMessage("企业账号受保护，登录后进入当前工作区。");
  }

  function handleRecovery() {
    setLoginError("");
    setLoginMessage("请联系系统管理员重置密码");
  }

  function toggleSection(id: string) {
    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleGroup(id: string) {
    setCollapsedGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  function activateModule(id: ModuleId, navKey: string) {
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
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
    setUserMenuOpen(false);
    navigate("/login", { replace: true });
  }

  const loginPage = (
    <LoginPage
      email={loginEmail}
      password={loginPassword}
      rememberSession={rememberSession}
      showPassword={showPassword}
      status={loginStatus}
      error={loginError}
      message={loginMessage}
      onEmailChange={updateLoginEmail}
      onPasswordChange={updateLoginPassword}
      onRememberChange={(checked) => setRememberSession(checked)}
      onTogglePassword={() => setShowPassword((visible) => !visible)}
      onRecoveryClick={handleRecovery}
      onSubmit={handleLogin}
    />
  );

  const workbenchPage = (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="sidebar-scroll">
          <div className="workspace-switcher" ref={workspaceMenuRef}>
            <button
              className={`workspace ${workspaceOpen ? "open" : ""}`}
              onClick={() => {
                setWorkspaceOpen((open) => !open);
                setUserMenuOpen(false);
              }}
              type="button"
              aria-haspopup="menu"
              aria-expanded={workspaceOpen}
            >
              <span className="ws-logo" aria-hidden="true">
                <img src="/logo.png" alt="" />
              </span>
              <span className="ws-name">Acme Admin</span>
              <ChevronDown className="ws-chevron" size={13} strokeWidth={2.2} />
            </button>

            {workspaceOpen ? (
              <div className="workspace-menu-popover" role="menu" aria-label="工作区菜单">
                <button className="active" type="button" role="menuitem" onClick={() => handleWorkspaceSelect("Acme Admin")}>
                  <span className="ws-menu-logo">
                    <img src="/logo.png" alt="" />
                  </span>
                  <span>
                    <strong>Acme Admin</strong>
                    <small>当前工作区</small>
                  </span>
                  <Check size={14} strokeWidth={2.2} />
                </button>
                <button type="button" role="menuitem" onClick={() => handleWorkspaceSelect("运营后台")}>
                  <span className="ws-menu-logo muted">运</span>
                  <span>
                    <strong>运营后台</strong>
                    <small>内容与消息</small>
                  </span>
                </button>
                <button type="button" role="menuitem" onClick={handleWorkspaceManage}>
                  <Plus size={14} strokeWidth={2.2} />
                  <span>
                    <strong>管理工作区</strong>
                    <small>切换、创建或配置</small>
                  </span>
                </button>
              </div>
            ) : null}
          </div>

          <label className="search-box">
            <Search size={15} strokeWidth={2.1} />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索模块或记录..."
              aria-label="搜索模块或记录"
            />
            <kbd>
              <Command size={10} strokeWidth={2.4} />K
            </kbd>
          </label>

          <nav className="nav-stack">
            {sections.map((section) => (
              <SidebarSection
                key={section.id}
                section={section}
                activeNavKey={activeNavKey}
                collapsed={Boolean(collapsedSections[section.id])}
                collapsedGroups={collapsedGroups}
                onToggleSection={toggleSection}
                onToggleGroup={toggleGroup}
                onQuickAdd={handleSectionQuickAdd}
                onActivate={activateModule}
              />
            ))}
          </nav>
        </div>

        <div className="sidebar-footer" ref={userMenuRef}>
          <button className="sidebar-user" type="button" onClick={() => handleUserMenuAction("个人资料")}>
            <Avatar initials="ZY" color="#1066cc" />
            <span className="user-info">
              <span className="user-name">Zenlon Young</span>
              <span className="user-status">
                <span className="status-dot" />
                在线
              </span>
            </span>
          </button>
          <button
            className={`footer-menu-btn ${userMenuOpen ? "active" : ""}`}
            type="button"
            aria-label="打开个人菜单"
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setWorkspaceOpen(false);
            }}
          >
            <MoreHorizontal size={16} strokeWidth={2.1} />
          </button>

          {userMenuOpen ? (
            <div className="user-menu-popover" role="menu" aria-label="个人菜单">
              <button type="button" role="menuitem" onClick={() => handleUserMenuAction("个人资料")}>
                <UserRound size={14} strokeWidth={2.1} />
                个人资料
              </button>
              <button type="button" role="menuitem" onClick={() => handleUserMenuAction("账号设置")}>
                <Settings size={14} strokeWidth={2.1} />
                账号设置
              </button>
              <button className="danger" type="button" role="menuitem" onClick={handleLogout}>
                <LogOut size={14} strokeWidth={2.1} />
                退出登录
              </button>
            </div>
          ) : null}
        </div>
      </aside>

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

        <AdminWorkspace activeModule={activeModule} records={filteredRecords} query={query} />
      </main>
    </div>
  );

  const loginRedirect = <Navigate to={getProtectedLoginPath(location.pathname)} state={{ from: location.pathname }} replace />;

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? moduleRoutes.dashboard : "/login"} replace />} />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to={getLoginRedirectPath(location.state, location.search)} replace /> : loginPage
        }
      />
      {moduleRouteEntries.map(([id, routePath]) => (
        <Route key={id} path={routePath} element={isAuthenticated ? workbenchPage : loginRedirect} />
      ))}
      <Route path="*" element={<Navigate to={isAuthenticated ? moduleRoutes.dashboard : "/login"} replace />} />
    </Routes>
  );
}

function PageTabs({
  tabs,
  activeModule,
  onSelect,
  onClose,
}: {
  tabs: ModuleId[];
  activeModule: ModuleId;
  onSelect: (id: ModuleId) => void;
  onClose: (id: ModuleId) => void;
}) {
  return (
    <div className="tabs page-tabs" role="tablist" aria-label="已打开页面">
      {tabs.map((id) => {
        const meta = moduleMeta[id];
        const Icon = meta.icon;
        const active = id === activeModule;

        return (
          <div className={`tab-item ${active ? "active" : ""}`} key={id}>
            <button className="tab" type="button" role="tab" aria-selected={active} onClick={() => onSelect(id)}>
              <Icon size={13} strokeWidth={2.1} />
              <span>{meta.title}</span>
            </button>
            {id === "dashboard" ? null : (
              <button className="tab-close" type="button" aria-label={`关闭${meta.title}`} onClick={() => onClose(id)}>
                <X size={12} strokeWidth={2.1} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SidebarSection({
  section,
  activeNavKey,
  collapsed,
  collapsedGroups,
  onToggleSection,
  onToggleGroup,
  onQuickAdd,
  onActivate,
}: {
  section: NavSection;
  activeNavKey: string;
  collapsed: boolean;
  collapsedGroups: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onQuickAdd: (section: NavSection) => void;
  onActivate: (id: ModuleId, navKey: string) => void;
}) {
  if (section.standalone) {
    return (
      <section className="nav-section standalone">
        <div className="section-body">
          {section.items?.map((item) => (
            <SidebarItem
              key={`${section.id}-${item.id}-${item.label}`}
              item={item}
              navKey={`section:${section.id}:${item.id}:${item.label}`}
              active={activeNavKey === `section:${section.id}:${item.id}:${item.label}`}
              onActivate={onActivate}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`nav-section ${collapsed ? "collapsed" : ""}`}>
      <div className="section-label">
        <button
          className="section-toggle"
          type="button"
          aria-expanded={!collapsed}
          onClick={() => onToggleSection(section.id)}
        >
          <ChevronDown className="section-chevron" size={11} strokeWidth={2.2} />
          <span className="section-title">{section.title}</span>
        </button>
        {section.addable ? (
          <button
            className="add-btn"
            type="button"
            aria-label={`新增${section.title}`}
            onClick={() => onQuickAdd(section)}
          >
            <Plus size={14} strokeWidth={2.1} />
          </button>
        ) : null}
      </div>

      <div className="section-body">
        {section.items?.map((item) => (
          <SidebarItem
            key={`${section.id}-${item.id}-${item.label}`}
            item={item}
            navKey={`section:${section.id}:${item.id}:${item.label}`}
            active={activeNavKey === `section:${section.id}:${item.id}:${item.label}`}
            onActivate={onActivate}
          />
        ))}

        {section.groups?.map((group) => (
          <MenuGroup
            key={group.id}
            sectionId={section.id}
            group={group}
            activeNavKey={activeNavKey}
            collapsed={Boolean(collapsedGroups[group.id])}
            onToggle={() => onToggleGroup(group.id)}
            onActivate={onActivate}
          />
        ))}
      </div>
    </section>
  );
}

function MenuGroup({
  sectionId,
  group,
  activeNavKey,
  collapsed,
  onToggle,
  onActivate,
}: {
  sectionId: string;
  group: NavGroup;
  activeNavKey: string;
  collapsed: boolean;
  onToggle: () => void;
  onActivate: (id: ModuleId, navKey: string) => void;
}) {
  return (
    <div className="menu-group" style={{ "--menu-group-color": group.color } as CSSProperties}>
      <button
        className={`menu-group-header ${collapsed ? "collapsed" : ""}`}
        type="button"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <ChevronDown className="menu-group-chevron" size={11} strokeWidth={2.2} />
        <span className="menu-group-icon" style={{ background: group.color }}>
          {group.initials}
        </span>
        <span className="menu-group-name">{group.name}</span>
        <span className="menu-group-count">{group.count}</span>
      </button>

      <div className="menu-group-children">
        {group.items.map((item) => (
          <SidebarItem
            key={`${group.id}-${item.id}-${item.label}`}
            item={item}
            navKey={`group:${sectionId}:${group.id}:${item.id}:${item.label}`}
            active={activeNavKey === `group:${sectionId}:${group.id}:${item.id}:${item.label}`}
            onActivate={onActivate}
          />
        ))}
      </div>
    </div>
  );
}

function SidebarItem({
  item,
  navKey,
  active,
  onActivate,
}: {
  item: NavItem;
  navKey: string;
  active: boolean;
  onActivate: (id: ModuleId, navKey: string) => void;
}) {
  const Icon = item.icon;

  return (
    <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={() => onActivate(item.id, navKey)}>
      <span className="item-icon">
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <span className="item-label">{item.label}</span>
      {item.badge ? <span className="badge">{item.badge}</span> : null}
    </button>
  );
}

function AdminWorkspace({
  activeModule,
  records,
  query,
}: {
  activeModule: ModuleId;
  records: ManagementRecord[];
  query: string;
}) {
  return (
    <div className="admin-content">
      {activeModule === "dashboard" ? (
        <DashboardPanel />
      ) : activeModule === "buttonDemo" ? (
        <ButtonDemoPanel />
      ) : activeModule === "roles" ? (
        <RoleManagementPanel records={moduleRecords.roles} />
      ) : (
        <ModulePanel activeModule={activeModule} records={records} query={query} />
      )}
    </div>
  );
}

function ButtonDemoPanel() {
  const message = useMessage();
  const notification = useNotification();
  const [modalDemo, setModalDemo] = useState<ModalDemoType>(null);
  const [drawerDemo, setDrawerDemo] = useState<DrawerDemoType>(null);
  const [formValues, setFormValues] = useState<FormDemoValues>({
    title: "运营权限复核",
    quota: 12,
    publishDate: "2026-06-22",
    scope: "business",
    channels: ["message", "audit"],
    owner: "operation",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [formNotice, setFormNotice] = useState("表单已同步");
  const buttonRows: Array<{
    title: string;
    description: string;
    buttons: ButtonDemoButton[];
  }> = [
    {
      title: "Primary",
      description: "页面主行动作",
      buttons: [
        { label: "默认", variant: "primary" },
        { label: "悬停", variant: "primary", visualState: "hover" },
        { label: "按下", variant: "primary", visualState: "active" },
        { label: "加载中", variant: "primary", loading: true },
        { label: "禁用", variant: "primary", disabled: true },
      ],
    },
    {
      title: "Secondary",
      description: "页面辅助动作",
      buttons: [
        { label: "默认", variant: "secondary" },
        { label: "悬停", variant: "secondary", visualState: "hover" },
        { label: "按下", variant: "secondary", visualState: "active" },
        { label: "加载中", variant: "secondary", loading: true },
        { label: "禁用", variant: "secondary", disabled: true },
      ],
    },
    {
      title: "Ghost",
      description: "低权重工具动作",
      buttons: [
        { label: "默认", variant: "ghost" },
        { label: "悬停", variant: "ghost", visualState: "hover" },
        { label: "按下", variant: "ghost", visualState: "active" },
        { label: "加载中", variant: "ghost", loading: true },
        { label: "禁用", variant: "ghost", disabled: true },
      ],
    },
    {
      title: "Danger",
      description: "删除、退出等危险动作",
      buttons: [
        { label: "默认", variant: "danger" },
        { label: "悬停", variant: "danger", visualState: "hover" },
        { label: "按下", variant: "danger", visualState: "active" },
        { label: "加载中", variant: "danger", loading: true },
        { label: "禁用", variant: "danger", disabled: true },
      ],
    },
  ];

  function updateFormValue<Key extends keyof FormDemoValues>(key: Key, value: FormDemoValues[Key]) {
    setFormValues((currentValues) => ({ ...currentValues, [key]: value }));
    setFormNotice("表单已修改");
  }

  function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormNotice("表单已保存");
  }

  function handleFormReset() {
    setFormValues({
      title: "",
      quota: 0,
      publishDate: "",
      scope: "system",
      channels: [],
      owner: "system",
    });
    setFiles([]);
    setFormNotice("表单已重置");
  }

  return (
    <>
      <section className="admin-panel message-demo-panel">
        <PanelHeader icon={Bell} title="全局 Message" action="顶部弹出提示" />
        <div className="message-demo-grid">
          <div className="button-demo-meta">
            <strong>页面上方提示</strong>
            <span>适合保存、删除、上传、同步等轻量反馈。</span>
          </div>
          <div className="button-state-list">
            <Button variant="secondary" onClick={() => message.success("保存成功，配置已同步")}>
              Success
            </Button>
            <Button variant="secondary" onClick={() => message.info("已打开角色字段配置")}>
              Info
            </Button>
            <Button variant="secondary" onClick={() => message.warning("存在未发布的运营内容")}>
              Warning
            </Button>
            <Button variant="danger" onClick={() => message.error("删除失败，请稍后重试")}>
              Error
            </Button>
            <Button
              variant="ghost"
              onClick={() => message.loading("文件上传中...", { duration: 2200, closable: true })}
            >
              Loading
            </Button>
          </div>
        </div>
      </section>

      <section className="admin-panel message-demo-panel">
        <PanelHeader icon={Bell} title="Notification 通知" action="左右侧气泡" />
        <div className="message-demo-grid">
          <div className="button-demo-meta">
            <strong>侧边通知气泡</strong>
            <span>适合任务完成、权限变更、异步结果等需要标题和描述的反馈。</span>
          </div>
          <div className="button-state-list">
            <Button
              variant="primary"
              onClick={() =>
                notification.success({
                  title: "同步完成",
                  description: "角色权限与菜单缓存已在当前工作区完成刷新。",
                })
              }
            >
              右侧成功
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                notification.info({
                  title: "左侧通知",
                  description: "这条通知从页面左侧弹出，适合靠近左侧导航的反馈。",
                  placement: "left",
                })
              }
            >
              左侧通知
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                notification.warning({
                  title: "存在待复核内容",
                  description: "3 个运营角色包含临时授权，请在今天下班前完成确认。",
                })
              }
            >
              右侧警告
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                notification.error({
                  title: "发布失败",
                  description: "通知通道暂时不可用，请检查系统配置后重试。",
                  placement: "left",
                  duration: 0,
                })
              }
            >
              左侧常驻
            </Button>
          </div>
        </div>
      </section>

      <section className="admin-panel modal-demo-panel">
        <PanelHeader icon={MoreHorizontal} title="Modal 弹窗" action="全局浮层" />
        <div className="modal-demo-grid">
          <div className="modal-demo-copy">
            <strong>对话式反馈</strong>
            <span>适合确认操作、编辑表单、查看详情等打断式场景。</span>
          </div>
          <div className="button-state-list">
            <Button variant="secondary" onClick={() => setModalDemo("basic")}>
              基础弹窗
            </Button>
            <Button variant="danger" onClick={() => setModalDemo("confirm")}>
              确认弹窗
            </Button>
            <Button variant="ghost" onClick={() => setModalDemo("large")}>
              大内容弹窗
            </Button>
          </div>
        </div>
      </section>

      <section className="admin-panel drawer-demo-panel">
        <PanelHeader icon={PanelRight} title="Drawer 抽屉" action="四向浮层" />
        <div className="drawer-demo-grid">
          <div className="drawer-demo-copy">
            <strong>非打断式详情</strong>
            <span>适合编辑表单、查看详情、筛选配置等保留页面上下文的场景。</span>
          </div>
          <div className="button-state-list">
            <Button variant="secondary" onClick={() => setDrawerDemo("right")}>
              右侧抽屉
            </Button>
            <Button variant="secondary" onClick={() => setDrawerDemo("top")}>
              顶部抽屉
            </Button>
            <Button variant="secondary" onClick={() => setDrawerDemo("bottom")}>
              底部抽屉
            </Button>
            <Button variant="secondary" onClick={() => setDrawerDemo("left")}>
              左侧抽屉
            </Button>
            <Button variant="secondary" onClick={() => setDrawerDemo("detail")}>
              详情抽屉
            </Button>
          </div>
        </div>
      </section>

      <section className="admin-panel button-demo-panel">
        <PanelHeader icon={moduleMeta.buttonDemo.icon} title={moduleMeta.buttonDemo.title} action={moduleMeta.buttonDemo.action} />
        <div className="button-demo-grid">
          {buttonRows.map((row) => (
            <article className="button-demo-row" key={row.title}>
              <div className="button-demo-meta">
                <strong>{row.title}</strong>
                <span>{row.description}</span>
              </div>
              <div className="button-state-list">
                {row.buttons.map((button) => (
                  <Button
                    variant={button.variant}
                    visualState={button.visualState}
                    loading={button.loading}
                    key={`${row.title}-${button.label}`}
                    disabled={button.disabled}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-panel form-demo-panel">
        <PanelHeader icon={Settings} title="表单组件" action={formNotice} />
        <form className="form-demo-grid" onSubmit={handleFormSubmit}>
          <Input
            label="Input"
            value={formValues.title}
            placeholder="请输入任务名称"
            hint="用于站内信和审计记录标题"
            onChange={(event) => updateFormValue("title", event.target.value)}
          />
          <NumberInput
            label="Number Input"
            value={formValues.quota}
            min={0}
            max={99}
            step={1}
            hint="0-99"
            onValueChange={(value) => updateFormValue("quota", value)}
          />
          <DatePicker
            label="日期选择器"
            value={formValues.publishDate}
            min="2026-01-01"
            onChange={(event) => updateFormValue("publishDate", event.target.value)}
          />
          <Select
            label="下拉选择"
            value={formValues.owner}
            options={[
              { value: "system", label: "系统管理" },
              { value: "operation", label: "运营中心" },
              { value: "audit", label: "审计中心" },
            ]}
            onValueChange={(value) => updateFormValue("owner", value)}
          />
          <RadioGroup
            label="Radio"
            value={formValues.scope}
            options={[
              { value: "system", label: "系统角色" },
              { value: "business", label: "业务角色" },
              { value: "temporary", label: "临时授权" },
            ]}
            onValueChange={(value) => updateFormValue("scope", value)}
          />
          <CheckboxGroup
            label="多选"
            value={formValues.channels}
            options={[
              { value: "message", label: "站内信" },
              { value: "audit", label: "审计日志" },
              { value: "notice", label: "通知公告" },
            ]}
            onValueChange={(value) => updateFormValue("channels", value)}
          />
          <div className="form-demo-wide">
            <Upload
              label="Upload"
              files={files}
              accept=".png,.jpg,.jpeg,.pdf,.zip"
              multiple
              onFilesChange={(nextFiles) => {
                setFiles(nextFiles);
                setFormNotice(nextFiles.length > 0 ? "附件已选择" : "附件已清空");
              }}
            />
          </div>
          <div className="form-demo-actions form-demo-wide">
            <Button variant="secondary" type="button" onClick={handleFormReset}>
              重置
            </Button>
            <Button variant="primary" type="submit">
              保存
            </Button>
          </div>
        </form>
      </section>

      <Modal
        open={modalDemo === "basic"}
        title="编辑角色说明"
        description="弹窗用于承载少量上下文和明确操作。"
        onClose={() => setModalDemo(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalDemo(null)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalDemo(null);
                message.success("弹窗内容已保存");
              }}
            >
              保存
            </Button>
          </>
        }
      >
        <p>这里可以放置简短说明、轻量表单或业务确认信息。弹窗默认支持遮罩点击和 Escape 关闭。</p>
      </Modal>

      <Modal
        open={modalDemo === "confirm"}
        title="确认删除临时授权"
        description="删除后，该角色关联的临时访问权限会立即失效。"
        size="small"
        maskClosable={false}
        onClose={() => setModalDemo(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalDemo(null)}>
              取消
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setModalDemo(null);
                message.error("已删除临时授权");
              }}
            >
              删除
            </Button>
          </>
        }
      >
        <p>这是一个高风险确认弹窗，关闭入口保留，但遮罩点击不会关闭。</p>
      </Modal>

      <Modal
        open={modalDemo === "large"}
        title="角色权限详情"
        description="较宽弹窗适合展示列表、权限摘要或多段说明。"
        size="large"
        onClose={() => setModalDemo(null)}
        footer={
          <Button variant="primary" onClick={() => setModalDemo(null)}>
            知道了
          </Button>
        }
      >
        <ul className="modal-demo-list">
          <li>
            <span>菜单权限</span>
            <small>系统管理、内容运营、审计中心</small>
          </li>
          <li>
            <span>按钮权限</span>
            <small>新增、编辑、导出、发布</small>
          </li>
          <li>
            <span>数据范围</span>
            <small>所属组织及下级组织</small>
          </li>
        </ul>
      </Modal>

      <Drawer
        open={drawerDemo === "right"}
        title="编辑角色字段"
        description="抽屉适合承载表单或配置项，页面上下文仍可见。"
        onClose={() => setDrawerDemo(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerDemo(null)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDrawerDemo(null);
                message.success("抽屉内容已保存");
              }}
            >
              保存
            </Button>
          </>
        }
      >
        <Input
          label="字段名称"
          value={formValues.title}
          placeholder="请输入字段名称"
          onChange={(event) => updateFormValue("title", event.target.value)}
        />
        <p style={{ marginTop: 14 }}>抽屉默认支持遮罩点击和 Escape 关闭，从右侧滑入。</p>
      </Drawer>

      <Drawer
        open={drawerDemo === "top"}
        title="批量筛选"
        description="顶部抽屉适合展示横向筛选、全局提示或短表单。"
        placement="top"
        onClose={() => setDrawerDemo(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerDemo(null)}>
              清空
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDrawerDemo(null);
                message.info("顶部筛选已应用");
              }}
            >
              应用
            </Button>
          </>
        }
      >
        <p>可放置跨页面的筛选、批量操作或上下文提示，从顶部滑入并保持主体页面可见。</p>
      </Drawer>

      <Drawer
        open={drawerDemo === "left"}
        title="导航配置"
        description="左侧抽屉适合承载导航、目录或辅助配置。"
        placement="left"
        onClose={() => setDrawerDemo(null)}
        footer={
          <Button variant="primary" onClick={() => setDrawerDemo(null)}>
            完成
          </Button>
        }
      >
        <ul className="drawer-demo-list">
          <li>
            <span>工作台</span>
            <small>默认入口</small>
          </li>
          <li>
            <span>系统管理</span>
            <small>角色与权限</small>
          </li>
          <li>
            <span>审计中心</span>
            <small>日志追踪</small>
          </li>
        </ul>
      </Drawer>

      <Drawer
        open={drawerDemo === "detail"}
        title="角色权限详情"
        description="较宽抽屉适合展示列表、权限摘要或多段说明。"
        size="large"
        onClose={() => setDrawerDemo(null)}
        footer={
          <Button variant="primary" onClick={() => setDrawerDemo(null)}>
            知道了
          </Button>
        }
      >
        <ul className="drawer-demo-list">
          <li>
            <span>菜单权限</span>
            <small>系统管理、内容运营、审计中心</small>
          </li>
          <li>
            <span>按钮权限</span>
            <small>新增、编辑、导出、发布</small>
          </li>
          <li>
            <span>数据范围</span>
            <small>所属组织及下级组织</small>
          </li>
          <li>
            <span>最近更新</span>
            <small>今天 14:32 · 运营中心</small>
          </li>
        </ul>
      </Drawer>

      <Drawer
        open={drawerDemo === "bottom"}
        title="筛选条件"
        description="底部抽屉适合移动端或轻量筛选面板。"
        placement="bottom"
        onClose={() => setDrawerDemo(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerDemo(null)}>
              重置
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setDrawerDemo(null);
                message.info("筛选条件已应用");
              }}
            >
              应用
            </Button>
          </>
        }
      >
        <p>可按状态、组织、更新时间等维度组合筛选，底部抽屉在窄屏下更易触达。</p>
      </Drawer>
    </>
  );
}

function DashboardPanel() {
  const recentLogs = moduleRecords.operationLogs.slice(0, 3);

  return (
    <>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="admin-panel dashboard-panel">
          <PanelHeader icon={moduleMeta.dashboard.icon} title="待办与风险" action="查看全部" />
          <div className="data-table">
            {workbenchTasks.map((task) => (
              <div className="data-row dashboard-row" key={task.title}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.owner}</span>
                </div>
                <StatusText tone={task.tone}>待处理</StatusText>
                <span className="muted-text">{task.time}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel dashboard-panel">
          <PanelHeader icon={moduleMeta.operationLogs.icon} title="最近操作" action="审计" />
          <div className="data-table">
            {recentLogs.map((log) => (
              <div className="data-row dashboard-row" key={`${log.title}-${log.updated}`}>
                <div>
                  <strong>{log.title}</strong>
                  <span>{log.owner}</span>
                </div>
                <StatusText tone={log.tone}>{log.status}</StatusText>
                <span className="muted-text">{log.updated}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel dashboard-panel dashboard-wide">
          <PanelHeader icon={moduleMeta.articles.icon} title="内容运营概况" action="查看内容" />
          <div className="data-table">
            {contentHealth.map((item) => (
              <div className="data-row dashboard-row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
                <StatusText tone={item.tone}>正常</StatusText>
                <span className="muted-text">实时</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function ModulePanel({
  activeModule,
  records,
  query,
}: {
  activeModule: Exclude<ModuleId, "dashboard">;
  records: ManagementRecord[];
  query: string;
}) {
  const meta = moduleMeta[activeModule];

  return (
    <>
      <div className="module-tools">
        <button className="filter-btn" type="button">
          <ListFilter size={13} strokeWidth={2.2} />
          筛选
        </button>
        <button className="filter-btn" type="button">
          <Eye size={13} strokeWidth={2.2} />
          显示字段
          <ChevronDown size={11} strokeWidth={2.2} />
        </button>
        <button className="filter-btn" type="button">
          状态：全部
          <X size={12} strokeWidth={2.1} />
        </button>
      </div>

      <section className="admin-panel">
        <PanelHeader icon={meta.icon} title={meta.title} action={meta.action} />
        <div className="data-table">
          {records.map((record) => (
            <RecordRow key={`${record.title}-${record.updated}`} record={record} />
          ))}
          {records.length === 0 ? (
            <div className="empty-state">{query.trim() ? "没有匹配的记录" : "暂无记录"}</div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function RoleManagementPanel({ records }: { records: ManagementRecord[] }) {
  const [draftFilters, setDraftFilters] = useState<RoleFilters>(DEFAULT_ROLE_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<RoleFilters>(DEFAULT_ROLE_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false);
  const [visibleRoleColumns, setVisibleRoleColumns] = useState<Record<RoleDisplayField, boolean>>(
    DEFAULT_VISIBLE_ROLE_COLUMNS,
  );
  const fieldMenuRef = useRef<HTMLDivElement>(null);

  const statusOptions = useMemo(() => Array.from(new Set(records.map((record) => record.status))), [records]);
  const ownerOptions = useMemo(() => Array.from(new Set(records.map((record) => record.owner))), [records]);
  const statusFilterOptions = useMemo(
    () => [{ value: "all", label: "全部状态" }, ...statusOptions.map((status) => ({ value: status, label: status }))],
    [statusOptions],
  );
  const ownerFilterOptions = useMemo(
    () => [{ value: "all", label: "全部组织" }, ...ownerOptions.map((owner) => ({ value: owner, label: owner }))],
    [ownerOptions],
  );
  const roleTypeOptions = [
    { value: "all", label: "全部类型" },
    { value: "system", label: "内置角色" },
    { value: "business", label: "业务角色" },
    { value: "readonly", label: "只读角色" },
    { value: "temporary", label: "临时角色" },
  ];
  const memberSizeOptions = [
    { value: "all", label: "全部规模" },
    { value: "small", label: "1-5 位成员" },
    { value: "medium", label: "6-10 位成员" },
    { value: "large", label: "11 位以上" },
  ];
  const updatedRangeOptions = [
    { value: "all", label: "全部时间" },
    { value: "today", label: "今天更新" },
    { value: "recent", label: "近 3 天" },
    { value: "older", label: "更早更新" },
  ];

  const filteredRoles = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return records.filter((record) => {
      const matchesKeyword =
        !keyword ||
        [record.title, record.description, record.meta, record.owner, record.status].some((value) =>
          value.toLowerCase().includes(keyword),
        );
      const matchesStatus = appliedFilters.status === "all" || record.status === appliedFilters.status;
      const matchesOwner = appliedFilters.owner === "all" || record.owner === appliedFilters.owner;
      const matchesRoleType = appliedFilters.roleType === "all" || getRoleType(record) === appliedFilters.roleType;
      const memberCount = getRoleMemberCount(record);
      const matchesMemberSize =
        appliedFilters.memberSize === "all" ||
        (appliedFilters.memberSize === "small" && memberCount <= 5) ||
        (appliedFilters.memberSize === "medium" && memberCount >= 6 && memberCount <= 10) ||
        (appliedFilters.memberSize === "large" && memberCount >= 11);
      const matchesUpdatedRange =
        appliedFilters.updatedRange === "all" || getRoleUpdatedRange(record) === appliedFilters.updatedRange;

      return matchesKeyword && matchesStatus && matchesOwner && matchesRoleType && matchesMemberSize && matchesUpdatedRange;
    });
  }, [appliedFilters, records]);
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / ROLE_PAGE_SIZE));
  const pagedRoles = useMemo(() => {
    const pageStart = (currentPage - 1) * ROLE_PAGE_SIZE;

    return filteredRoles.slice(pageStart, pageStart + ROLE_PAGE_SIZE);
  }, [currentPage, filteredRoles]);
  const visibleTableColumnCount =
    2 + roleDisplayFields.filter((field) => visibleRoleColumns[field.id]).length;

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (!fieldMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!fieldMenuRef.current?.contains(event.target as Node)) {
        setFieldMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFieldMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [fieldMenuOpen]);

  function updateDraftFilter<Key extends keyof RoleFilters>(key: Key, value: RoleFilters[Key]) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleRoleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
  }

  function handleRoleReset() {
    setDraftFilters(DEFAULT_ROLE_FILTERS);
    setAppliedFilters(DEFAULT_ROLE_FILTERS);
    setCurrentPage(1);
  }

  function toggleRoleColumn(fieldId: RoleDisplayField) {
    setVisibleRoleColumns((current) => ({ ...current, [fieldId]: !current[fieldId] }));
  }

  return (
    <>
      <form className="admin-panel search-form" onSubmit={handleRoleSearch}>
        <div className={`search-form-grid ${searchExpanded ? "expanded" : ""}`}>
          <label className="form-field">
            <span>角色名称</span>
            <input
              value={draftFilters.keyword}
              onChange={(event) => updateDraftFilter("keyword", event.target.value)}
              placeholder="请输入角色名称 / 描述"
            />
          </label>

          <div className="form-field">
            <span>状态</span>
            <SearchSelect
              ariaLabel="选择角色状态"
              options={statusFilterOptions}
              value={draftFilters.status}
              onChange={(value) => updateDraftFilter("status", value)}
            />
          </div>

          <div className="form-field">
            <span>所属组织</span>
            <SearchSelect
              ariaLabel="选择所属组织"
              options={ownerFilterOptions}
              value={draftFilters.owner}
              onChange={(value) => updateDraftFilter("owner", value)}
            />
          </div>

          {searchExpanded ? (
            <>
              <div className="form-field">
                <span>角色类型</span>
                <SearchSelect
                  ariaLabel="选择角色类型"
                  options={roleTypeOptions}
                  value={draftFilters.roleType}
                  onChange={(value) => updateDraftFilter("roleType", value)}
                />
              </div>

              <div className="form-field">
                <span>成员规模</span>
                <SearchSelect
                  ariaLabel="选择成员规模"
                  options={memberSizeOptions}
                  value={draftFilters.memberSize}
                  onChange={(value) => updateDraftFilter("memberSize", value)}
                />
              </div>

              <div className="form-field">
                <span>更新时间</span>
                <SearchSelect
                  ariaLabel="选择更新时间"
                  options={updatedRangeOptions}
                  value={draftFilters.updatedRange}
                  onChange={(value) => updateDraftFilter("updatedRange", value)}
                />
              </div>
            </>
          ) : null}

          <div className="search-form-actions">
            <button className="btn-secondary" type="button" onClick={handleRoleReset}>
              <X size={13} strokeWidth={2.1} />
              重置
            </button>
            <button className="btn-primary form-submit" type="submit">
              <Search size={13} strokeWidth={2.3} />
              查询
            </button>
            <button
              className={`expand-btn ${searchExpanded ? "active" : ""}`}
              type="button"
              onClick={() => setSearchExpanded((expanded) => !expanded)}
            >
              {searchExpanded ? "收起" : "展开"}
              <ChevronDown size={13} strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </form>

      <section className="admin-panel table-module">
        <div className="table-toolbar">
          <button className="btn-primary table-create-btn" type="button">
            <Plus size={13} strokeWidth={2.3} />
            {moduleMeta.roles.action}
          </button>
          <div className="field-control" ref={fieldMenuRef}>
            <button
              className={`filter-btn field-trigger ${fieldMenuOpen ? "active" : ""}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded={fieldMenuOpen}
              onClick={() => setFieldMenuOpen((open) => !open)}
            >
              <Eye size={13} strokeWidth={2.2} />
              显示字段
              <ChevronDown size={11} strokeWidth={2.2} />
            </button>
            {fieldMenuOpen ? (
              <div className="field-popover" role="menu" aria-label="显示字段">
                {roleDisplayFields.map((field) => (
                  <label className="field-option" key={field.id}>
                    <input
                      type="checkbox"
                      checked={visibleRoleColumns[field.id]}
                      onChange={() => toggleRoleColumn(field.id)}
                    />
                    <span className="field-checkbox" aria-hidden="true">
                      {visibleRoleColumns[field.id] ? <Check size={11} strokeWidth={2.5} /> : null}
                    </span>
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="table-scroll">
          <table className="management-table role-table">
            <thead>
              <tr>
                <th>角色名称</th>
                {visibleRoleColumns.members ? <th>成员</th> : null}
                {visibleRoleColumns.owner ? <th>所属组织</th> : null}
                {visibleRoleColumns.status ? <th>状态</th> : null}
                {visibleRoleColumns.updated ? <th>更新时间</th> : null}
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRoles.map((record) => (
                <tr key={`${record.title}-${record.updated}`}>
                  <td>
                    <div className="table-main-cell">
                      <strong>{record.title}</strong>
                      <span>{record.description}</span>
                    </div>
                  </td>
                  {visibleRoleColumns.members ? <td>{record.meta}</td> : null}
                  {visibleRoleColumns.owner ? <td>{record.owner}</td> : null}
                  {visibleRoleColumns.status ? (
                    <td>
                      <StatusText tone={record.tone}>{record.status}</StatusText>
                    </td>
                  ) : null}
                  {visibleRoleColumns.updated ? <td className="muted-text">{record.updated}</td> : null}
                  <td>
                    <div className="table-actions">
                      <button type="button">编辑</button>
                      <button type="button">权限</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedRoles.length === 0 ? (
                <tr>
                  <td className="table-empty" colSpan={visibleTableColumnCount}>
                    没有匹配的角色
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>共 {filteredRoles.length} 条</span>
          <div className="pagination" aria-label="角色分页">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              上一页
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                className={page === currentPage ? "active" : ""}
                type="button"
                key={page}
                aria-current={page === currentPage ? "page" : undefined}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            >
              下一页
            </button>
          </div>
        </div>
      </section>
    </>
  );
}

function SearchSelect({
  ariaLabel,
  options,
  value,
  onChange,
}: {
  ariaLabel: string;
  options: SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`search-select ${open ? "open" : ""}`} ref={selectRef}>
      <button
        className="search-select-trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((visible) => !visible)}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown size={13} strokeWidth={2.2} />
      </button>

      {open ? (
        <div className="search-select-popover" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                className={`search-select-option ${selected ? "selected" : ""}`}
                type="button"
                role="option"
                aria-selected={selected}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>{option.label}</span>
                {selected ? <Check size={13} strokeWidth={2.4} /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RecordRow({ record }: { record: ManagementRecord }) {
  return (
    <div className="data-row module-row">
      <div>
        <strong>{record.title}</strong>
        <span>{record.description}</span>
      </div>
      <span>{record.meta}</span>
      <span>{record.owner}</span>
      <StatusText tone={record.tone}>{record.status}</StatusText>
      <span className="muted-text">{record.updated}</span>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <article className="metric-card">
      <span className="metric-icon">
        <Icon size={18} strokeWidth={2.1} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{delta}</em>
    </article>
  );
}

function PanelHeader({ icon: Icon, title, action }: { icon: LucideIcon; title: string; action: string }) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={17} strokeWidth={2.1} />
        <h2>{title}</h2>
      </div>
      <button type="button">{action}</button>
    </div>
  );
}

function Avatar({
  initials,
  color,
  size = "regular",
}: {
  initials: string;
  color: string;
  size?: "regular" | "small";
}) {
  return (
    <span className={`avatar ${size === "small" ? "avatar-small" : ""}`} style={{ background: color }}>
      {initials}
    </span>
  );
}

function StatusText({ tone, children }: { tone: StatusTone; children: string }) {
  return <span className={`status-text ${tone}`}>{children}</span>;
}

export default App;
