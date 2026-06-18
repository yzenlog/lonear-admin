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
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { contentHealth, metrics, moduleMeta, moduleRecords, moduleRoutes, sections, workbenchTasks } from "./data";
import type { ManagementRecord, ModuleId, NavGroup, NavItem, NavSection, StatusTone } from "./data";
import LoginPage from "./pages/LoginPage";

const AUTH_STORAGE_KEY = "admin-linear-demo-auth";
const DASHBOARD_NAV_KEY = "section:dashboard:dashboard:工作台";
const moduleRouteEntries = Object.entries(moduleRoutes) as Array<[ModuleId, string]>;

function getInitialAuthState() {
  return (
    window.localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
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

  function handleCreate() {
    if (activeModule === "dashboard") {
      setNotice("工作台数据已刷新");
      return;
    }

    setNotice(`${meta.action}入口已就绪`);
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
            <button className="btn-primary" type="button" onClick={handleCreate}>
              <Plus size={14} strokeWidth={2.4} />
              {activeModule === "dashboard" ? "刷新" : "新建"}
            </button>
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
      {activeModule === "dashboard" ? <DashboardPanel /> : <ModulePanel activeModule={activeModule} records={records} query={query} />}
    </div>
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
