import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  ChevronDown,
  Command,
  Download,
  Eye,
  ListFilter,
  Menu,
  MoreHorizontal,
  PanelTop,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  UserPlus,
  X,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  auditLogs,
  integrations,
  issues,
  members,
  metrics,
  moduleMeta,
  roles,
  sections,
  statusMeta,
} from "./data";
import type { Issue, IssueStatus, ModuleId, NavItem, NavSection, Team } from "./data";

type IssueTab = "all" | IssueStatus;

const issueTabs: Array<{ id: IssueTab; label: string }> = [
  { id: "all", label: "全部" },
  { id: "progress", label: "进行中" },
  { id: "todo", label: "待办" },
  { id: "done", label: "已完成" },
];

const issueModules = new Set<ModuleId>([
  "inbox",
  "my-work",
  "projects",
  "completed",
  "roadmap",
  "cycles",
  "issues",
  "in-progress",
  "todo",
]);

function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>("issues");
  const [activeNavKey, setActiveNavKey] = useState("team:engineering:issues:全部事项");
  const [activeTab, setActiveTab] = useState<IssueTab>("all");
  const [query, setQuery] = useState("");
  const [selectedIssue, setSelectedIssue] = useState("ENG-142");
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    navigation: false,
    workspace: false,
    teams: false,
    admin: false,
  });
  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({
    marketing: true,
  });
  const [notice, setNotice] = useState("工作区已同步");
  const searchRef = useRef<HTMLInputElement>(null);

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
    if (activeModule === "in-progress") {
      setActiveTab("progress");
    } else if (activeModule === "todo") {
      setActiveTab("todo");
    } else if (activeModule === "completed") {
      setActiveTab("done");
    } else if (!issueModules.has(activeModule)) {
      setActiveTab("all");
    }
  }, [activeModule]);

  const filteredIssues = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return issues.filter((issue) => {
      const tabMatch = activeTab === "all" || issue.status === activeTab;
      const queryMatch =
        !normalized ||
        [issue.id, issue.title, issue.label, issue.assignee].some((value) =>
          value.toLowerCase().includes(normalized),
        );

      return tabMatch && queryMatch;
    });
  }, [activeTab, query]);

  const meta = moduleMeta[activeModule];
  const showsIssues = issueModules.has(activeModule);

  function toggleSection(id: string) {
    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }));
  }

  function toggleTeam(id: string) {
    setCollapsedTeams((current) => ({ ...current, [id]: !current[id] }));
  }

  function activateModule(id: ModuleId, navKey: string) {
    setActiveModule(id);
    setActiveNavKey(navKey);
    setNotice(`${moduleMeta[id].title} 已打开`);
  }

  function handleCreate() {
    const label = showsIssues ? "新事项" : `${meta.title}记录`;
    setNotice(`${label} 创建入口已就绪`);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <button
          className={`workspace ${workspaceOpen ? "open" : ""}`}
          onClick={() => setWorkspaceOpen((open) => !open)}
          type="button"
        >
          <span className="ws-logo" aria-hidden="true">
            A
          </span>
          <span className="ws-name">Acme Inc</span>
          <ChevronDown className="ws-chevron" size={13} strokeWidth={2.2} />
        </button>

        <label className="search-box">
          <Search size={15} strokeWidth={2.1} />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索..."
            aria-label="搜索模块或事项"
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
              activeModule={activeModule}
              activeNavKey={activeNavKey}
              collapsed={Boolean(collapsedSections[section.id])}
              collapsedTeams={collapsedTeams}
              onToggleSection={toggleSection}
              onToggleTeam={toggleTeam}
              onActivate={activateModule}
            />
          ))}
        </nav>

        <button className="sidebar-footer" type="button" onClick={() => setNotice("个人菜单已打开")}>
          <Avatar initials="ZY" color="#1066cc" />
          <span className="user-info">
            <span className="user-name">Zenlon Young</span>
            <span className="user-status">
              <span className="status-dot" />
              在线
            </span>
          </span>
          <MoreHorizontal size={16} strokeWidth={2.1} />
        </button>
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
              新建
            </button>
          </div>
        </header>

        {showsIssues ? (
          <IssueWorkspace
            issues={filteredIssues}
            activeTab={activeTab}
            selectedIssue={selectedIssue}
            onSelectTab={setActiveTab}
            onSelectIssue={setSelectedIssue}
          />
        ) : (
          <AdminWorkspace activeModule={activeModule} />
        )}
      </main>
    </div>
  );
}

function SidebarSection({
  section,
  activeModule,
  activeNavKey,
  collapsed,
  collapsedTeams,
  onToggleSection,
  onToggleTeam,
  onActivate,
}: {
  section: NavSection;
  activeModule: ModuleId;
  activeNavKey: string;
  collapsed: boolean;
  collapsedTeams: Record<string, boolean>;
  onToggleSection: (id: string) => void;
  onToggleTeam: (id: string) => void;
  onActivate: (id: ModuleId, navKey: string) => void;
}) {
  return (
    <section className={`nav-section ${collapsed ? "collapsed" : ""}`}>
      <button className="section-label" type="button" onClick={() => onToggleSection(section.id)}>
        <ChevronDown className="section-chevron" size={11} strokeWidth={2.2} />
        <span className="section-title">{section.title}</span>
        {section.addable ? (
          <span className="add-btn" aria-hidden="true">
            <Plus size={14} strokeWidth={2.1} />
          </span>
        ) : null}
      </button>

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

        {section.teams?.map((team) => (
          <TeamBlock
            key={team.id}
            team={team}
            activeModule={activeModule}
            activeNavKey={activeNavKey}
            collapsed={Boolean(collapsedTeams[team.id])}
            onToggle={() => onToggleTeam(team.id)}
            onActivate={onActivate}
          />
        ))}
      </div>
    </section>
  );
}

function TeamBlock({
  team,
  activeModule,
  activeNavKey,
  collapsed,
  onToggle,
  onActivate,
}: {
  team: Team;
  activeModule: ModuleId;
  activeNavKey: string;
  collapsed: boolean;
  onToggle: () => void;
  onActivate: (id: ModuleId, navKey: string) => void;
}) {
  return (
    <div className="team-block">
      <button className={`team-header ${collapsed ? "collapsed" : ""}`} type="button" onClick={onToggle}>
        <ChevronDown className="team-chevron" size={11} strokeWidth={2.2} />
        <span className="team-icon" style={{ background: team.color }}>
          {team.initials}
        </span>
        <span className="team-name">{team.name}</span>
        <span className="team-count">{team.count}</span>
      </button>

      <div className="team-children">
        {team.items.map((item) => (
          <SidebarItem
            key={`${team.id}-${item.id}-${item.label}`}
            item={item}
            navKey={`team:${team.id}:${item.id}:${item.label}`}
            active={activeNavKey === `team:${team.id}:${item.id}:${item.label}`}
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

function IssueWorkspace({
  issues,
  activeTab,
  selectedIssue,
  onSelectTab,
  onSelectIssue,
}: {
  issues: Issue[];
  activeTab: IssueTab;
  selectedIssue: string;
  onSelectTab: (tab: IssueTab) => void;
  onSelectIssue: (id: string) => void;
}) {
  const counts = useMemo(() => {
    return issueTabs.reduce<Record<IssueTab, number>>(
      (acc, tab) => {
        acc[tab.id] = tab.id === "all" ? issues.length : issues.filter((issue) => issue.status === tab.id).length;
        return acc;
      },
      { all: 0, backlog: 0, todo: 0, progress: 0, done: 0, cancelled: 0 },
    );
  }, [issues]);

  return (
    <>
      <div className="tabs" role="tablist" aria-label="事项状态">
        {issueTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
            <span className="count">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <button className="filter-btn" type="button">
          <ListFilter size={13} strokeWidth={2.2} />
          筛选
        </button>
        <button className="filter-btn" type="button">
          <Eye size={13} strokeWidth={2.2} />
          显示
          <ChevronDown size={11} strokeWidth={2.2} />
        </button>
        <button className="filter-btn" type="button">
          分组：状态
          <X size={12} strokeWidth={2.1} />
        </button>
        <button className="filter-btn" type="button">
          排序：优先级
          <X size={12} strokeWidth={2.1} />
        </button>
      </div>

      <div className="content">
        <div className="issue-list" role="list">
          {issues.map((issue) => (
            <IssueRow
              key={issue.id}
              issue={issue}
              selected={selectedIssue === issue.id}
              onSelect={() => onSelectIssue(issue.id)}
            />
          ))}
          {issues.length === 0 ? <div className="empty-state">没有匹配的事项</div> : null}
        </div>
      </div>
    </>
  );
}

function IssueRow({ issue, selected, onSelect }: { issue: Issue; selected: boolean; onSelect: () => void }) {
  const status = statusMeta[issue.status];

  return (
    <button className={`issue-row ${selected ? "selected" : ""}`} type="button" onClick={onSelect} role="listitem">
      <span className={`priority priority-${issue.priority}`}>P{issue.priority}</span>
      <span className="issue-id">{issue.id}</span>
      <span className="issue-title">
        <span className={issue.status === "done" ? "done" : ""}>{issue.title}</span>
      </span>
      <span className={`status-pill ${status.className}`}>
        <span className="sdot" style={{ background: status.color }} />
        {status.text}
      </span>
      <span className="issue-label">
        <span className="label-dot" style={{ background: issue.color }} />
        {issue.label}
      </span>
      <span className="issue-updated">{issue.updated}</span>
      <span className="assignee-cell">
        <Avatar initials={issue.assignee} color={issue.assigneeColor} size="small" />
      </span>
    </button>
  );
}

function AdminWorkspace({ activeModule }: { activeModule: ModuleId }) {
  return (
    <div className="admin-content">
      {activeModule === "members" ? <MembersPanel /> : null}
      {activeModule === "roles" ? <RolesPanel /> : null}
      {activeModule === "audit" ? <AuditPanel /> : null}
      {activeModule === "integrations" ? <IntegrationsPanel /> : null}
      {activeModule === "feedback" ? <FeedbackPanel /> : null}
      {activeModule === "settings" ? <SettingsPanel /> : null}
      {activeModule === "overview" ? <OverviewPanel /> : null}
    </div>
  );
}

function OverviewPanel() {
  return (
    <>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </div>
      <AuditPanel compact />
    </>
  );
}

function MembersPanel() {
  return (
    <section className="admin-panel">
      <PanelHeader icon={UserPlus} title="成员" action="邀请成员" />
      <div className="data-table">
        {members.map((member) => (
          <div className="data-row" key={member.name}>
            <div>
              <strong>{member.name}</strong>
              <span>{member.team}</span>
            </div>
            <span>{member.role}</span>
            <StatusText tone={member.status === "在线" ? "green" : "muted"}>{member.status}</StatusText>
            <span className="muted-text">{member.lastSeen}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RolesPanel() {
  return (
    <section className="admin-panel">
      <PanelHeader icon={Shield} title="团队与权限" action="新建角色" />
      <div className="data-table">
        {roles.map((role) => (
          <div className="data-row role-row" key={role.name}>
            <div>
              <strong>{role.name}</strong>
              <span>{role.members} 位成员</span>
            </div>
            <span>{role.access}</span>
            <span className="muted-text">{role.updated}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditPanel({ compact = false }: { compact?: boolean }) {
  return (
    <section className="admin-panel">
      <PanelHeader icon={FileText} title={compact ? "最近审计" : "审计日志"} action="导出" />
      <div className="data-table">
        {auditLogs.map((log) => (
          <div className="data-row audit-row" key={`${log.action}-${log.time}`}>
            <div>
              <strong>{log.action}</strong>
              <span>{log.actor}</span>
            </div>
            <span>{log.target}</span>
            <span className="muted-text">{log.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntegrationsPanel() {
  return (
    <section className="admin-panel">
      <PanelHeader icon={SlidersHorizontal} title="API 与集成" action="创建 token" />
      <div className="integration-grid">
        {integrations.map((integration) => {
          const Icon = integration.icon;

          return (
            <button className="integration-card" type="button" key={integration.name}>
              <span className="integration-icon" style={{ color: integration.accent }}>
                <Icon size={18} strokeWidth={2.1} />
              </span>
              <strong>{integration.name}</strong>
              <span>{integration.status}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function FeedbackPanel() {
  return (
    <section className="admin-panel">
      <PanelHeader icon={PanelTop} title="反馈" action="查看全部" />
      <div className="feedback-list">
        <button className="feedback-item" type="button">
          <strong>成员希望批量修改角色</strong>
          <span>来自 Engineering，2 小时前</span>
        </button>
        <button className="feedback-item" type="button">
          <strong>审计日志筛选需要保存视图</strong>
          <span>来自 Admin，昨天</span>
        </button>
      </div>
    </section>
  );
}

function SettingsPanel() {
  return (
    <section className="admin-panel">
      <PanelHeader icon={SlidersHorizontal} title="设置" action="保存" />
      <div className="settings-list">
        <label>
          <span>工作区名称</span>
          <input defaultValue="Acme Inc" />
        </label>
        <label>
          <span>默认角色</span>
          <select defaultValue="Developer">
            <option>Developer</option>
            <option>Viewer</option>
            <option>Admin</option>
          </select>
        </label>
        <label>
          <span>审计保留周期</span>
          <select defaultValue="180 天">
            <option>90 天</option>
            <option>180 天</option>
            <option>365 天</option>
          </select>
        </label>
      </div>
    </section>
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

function StatusText({ tone, children }: { tone: "green" | "muted"; children: string }) {
  return <span className={`status-text ${tone}`}>{children}</span>;
}

export default App;
