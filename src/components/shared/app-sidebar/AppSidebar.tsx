import type { CSSProperties, RefObject } from "react";
import { Check, ChevronDown, Command, LogOut, MoreHorizontal, Plus, Search, Settings, UserRound } from "lucide-react";
import type { ModuleId, NavGroup, NavItem, NavSection } from "../../../config/modules";
import UserAvatar from "../user-avatar/UserAvatar";
import "./AppSidebar.css";

type AppSidebarProps = {
  sections: NavSection[];
  activeNavKey: string;
  query: string;
  workspaceOpen: boolean;
  userMenuOpen: boolean;
  collapsedSections: Record<string, boolean>;
  collapsedGroups: Record<string, boolean>;
  searchRef: RefObject<HTMLInputElement | null>;
  workspaceMenuRef: RefObject<HTMLDivElement | null>;
  userMenuRef: RefObject<HTMLDivElement | null>;
  onQueryChange: (value: string) => void;
  onWorkspaceToggle: () => void;
  onWorkspaceSelect: (name: string) => void;
  onWorkspaceManage: () => void;
  onUserMenuToggle: () => void;
  onUserMenuAction: (label: string) => void;
  onLogout: () => void;
  onToggleSection: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onQuickAdd: (section: NavSection) => void;
  onActivate: (id: ModuleId) => void;
};

function AppSidebar({
  sections,
  activeNavKey,
  query,
  workspaceOpen,
  userMenuOpen,
  collapsedSections,
  collapsedGroups,
  searchRef,
  workspaceMenuRef,
  userMenuRef,
  onQueryChange,
  onWorkspaceToggle,
  onWorkspaceSelect,
  onWorkspaceManage,
  onUserMenuToggle,
  onUserMenuAction,
  onLogout,
  onToggleSection,
  onToggleGroup,
  onQuickAdd,
  onActivate,
}: AppSidebarProps) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="sidebar-scroll">
        <div className="workspace-switcher" ref={workspaceMenuRef}>
          <button
            className={`workspace ${workspaceOpen ? "open" : ""}`}
            onClick={onWorkspaceToggle}
            type="button"
            aria-haspopup="menu"
            aria-expanded={workspaceOpen}
          >
            <span className="ws-logo" aria-hidden="true">
              <img src="/logo.png" alt="" />
            </span>
            <span className="ws-name">Lonear Admin</span>
            <ChevronDown className="ws-chevron" size={13} strokeWidth={2.2} />
          </button>

          {workspaceOpen ? (
            <div className="workspace-menu-popover" role="menu" aria-label="工作区菜单">
              <button className="active" type="button" role="menuitem" onClick={() => onWorkspaceSelect("Lonear Admin")}>
                <span className="ws-menu-logo">
                  <img src="/logo.png" alt="" />
                </span>
                <span>
                  <strong>Lonear Admin</strong>
                  <small>当前工作区</small>
                </span>
                <Check size={14} strokeWidth={2.2} />
              </button>
              <button type="button" role="menuitem" onClick={() => onWorkspaceSelect("运营后台")}>
                <span className="ws-menu-logo muted">运</span>
                <span>
                  <strong>运营后台</strong>
                  <small>内容与消息</small>
                </span>
              </button>
              <button type="button" role="menuitem" onClick={onWorkspaceManage}>
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
            onChange={(event) => onQueryChange(event.target.value)}
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
              onToggleSection={onToggleSection}
              onToggleGroup={onToggleGroup}
              onQuickAdd={onQuickAdd}
              onActivate={onActivate}
            />
          ))}
        </nav>
      </div>

      <div className="sidebar-footer" ref={userMenuRef}>
        <button className="sidebar-user" type="button" onClick={() => onUserMenuAction("个人资料")}>
          <UserAvatar initials="ZY" color="#1066cc" />
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
          onClick={onUserMenuToggle}
        >
          <MoreHorizontal size={16} strokeWidth={2.1} />
        </button>

        {userMenuOpen ? (
          <div className="user-menu-popover" role="menu" aria-label="个人菜单">
            <button type="button" role="menuitem" onClick={() => onUserMenuAction("个人资料")}>
              <UserRound size={14} strokeWidth={2.1} />
              个人资料
            </button>
            <button type="button" role="menuitem" onClick={() => onUserMenuAction("账号设置")}>
              <Settings size={14} strokeWidth={2.1} />
              账号设置
            </button>
            <button className="danger" type="button" role="menuitem" onClick={onLogout}>
              <LogOut size={14} strokeWidth={2.1} />
              退出登录
            </button>
          </div>
        ) : null}
      </div>
    </aside>
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
  onActivate: (id: ModuleId) => void;
}) {
  if (section.standalone) {
    return (
      <section className="nav-section standalone">
        <div className="section-body">
          {section.items?.map((item) => (
            <SidebarItem
              key={`${section.id}-${item.id}-${item.label}`}
              item={item}
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
  onActivate: (id: ModuleId) => void;
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
  active,
  onActivate,
}: {
  item: NavItem;
  active: boolean;
  onActivate: (id: ModuleId) => void;
}) {
  const Icon = item.icon;

  return (
    <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={() => onActivate(item.id)}>
      <span className="item-icon">
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <span className="item-label">{item.label}</span>
      {item.badge ? <span className="badge">{item.badge}</span> : null}
    </button>
  );
}

export default AppSidebar;
