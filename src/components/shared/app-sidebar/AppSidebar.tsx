import { useMemo } from "react";
import type { CSSProperties, RefObject } from "react";
import {
  Check,
  ChevronDown,
  Command,
  ListPlus,
  LocateFixed,
  LogOut,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import type { CurrentUser } from "../../../api/auth";
import type { ModuleId, NavGroup, NavItem, NavSection } from "../../../config/modules";
import { useLanguage } from "../../../i18n";
import UserAvatar from "../user-avatar/UserAvatar";
import "./AppSidebar.css";

type AppSidebarProps = {
  sections: NavSection[];
  activeNavKey: string;
  query: string;
  workspaceOpen: boolean;
  userMenuOpen: boolean;
  folded: boolean;
  collapsedSections: Record<string, boolean>;
  collapsedGroups: Record<string, boolean>;
  currentUser: CurrentUser | null;
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
  onExpandAllMenus: () => void;
  onFocusActiveMenu: () => void;
  onToggleFolded: () => void;
  onToggleSection: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onQuickAdd: (section: NavSection) => void;
  onActivate: (id: ModuleId) => void;
};

type FoldedNavItemModel = {
  active: boolean;
  icon: NavItem["icon"] | undefined;
  id: string;
  label: string;
  section: NavSection;
  targetId: ModuleId;
};

function AppSidebar({
  sections,
  activeNavKey,
  query,
  workspaceOpen,
  userMenuOpen,
  folded,
  collapsedSections,
  collapsedGroups,
  currentUser,
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
  onExpandAllMenus,
  onFocusActiveMenu,
  onToggleFolded,
  onToggleSection,
  onToggleGroup,
  onQuickAdd,
  onActivate,
}: AppSidebarProps) {
  const { t } = useLanguage();
  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0;
  const visibleSections = useMemo(() => filterNavSections(sections, normalizedQuery, t), [sections, normalizedQuery, t]);
  const foldedSections = useMemo(() => getFoldedNavItems(sections, activeNavKey), [activeNavKey, sections]);
  const userName = currentUser?.name.trim() || t("未登录用户");
  const userStatus = currentUser?.email?.trim() || t("在线");
  const userInitials = getUserInitials(userName);

  return (
    <aside className={`sidebar ${folded ? "folded" : ""}`} aria-label={t("主导航")}>
      <div className="sidebar-scroll">
        <div className="sidebar-header">
          <div className="sidebar-title-row">
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
                <div className="workspace-menu-popover" role="menu" aria-label={t("工作区菜单")}>
                  <button className="active" type="button" role="menuitem" onClick={() => onWorkspaceSelect("Lonear Admin")}>
                    <span className="ws-menu-logo">
                      <img src="/logo.png" alt="" />
                    </span>
                    <span>
                      <strong>Lonear Admin</strong>
                      <small>{t("当前工作区")}</small>
                    </span>
                    <Check size={14} strokeWidth={2.2} />
                  </button>
                  <button type="button" role="menuitem" onClick={() => onWorkspaceSelect("运营后台")}>
                    <span className="ws-menu-logo muted">{t("运营后台").slice(0, 1).toUpperCase()}</span>
                    <span>
                      <strong>{t("运营后台")}</strong>
                      <small>{t("内容与消息")}</small>
                    </span>
                  </button>
                  <button type="button" role="menuitem" onClick={onWorkspaceManage}>
                    <Plus size={14} strokeWidth={2.2} />
                    <span>
                      <strong>{t("管理工作区")}</strong>
                      <small>{t("切换、创建或配置")}</small>
                    </span>
                  </button>
                </div>
              ) : null}
            </div>

            {!folded ? (
              <div className="sidebar-menu-actions" aria-label={t("菜单快捷操作")}>
                <button
                  className="sidebar-menu-action-btn"
                  type="button"
                  aria-label={t("展开全部菜单")}
                  data-tooltip={t("展开菜单")}
                  onClick={onExpandAllMenus}
                >
                  <ListPlus size={17} strokeWidth={2.2} />
                </button>
                <button
                  className="sidebar-menu-action-btn"
                  type="button"
                  aria-label={t("只展开当前菜单")}
                  data-tooltip={t("聚焦菜单")}
                  onClick={onFocusActiveMenu}
                >
                  <LocateFixed size={17} strokeWidth={2.2} />
                </button>
                <button
                  className="sidebar-menu-action-btn sidebar-fold-toggle"
                  type="button"
                  aria-label={t("收起侧边栏")}
                  aria-pressed={false}
                  data-tooltip={t("收起菜单")}
                  onClick={onToggleFolded}
                >
                  <PanelLeftClose size={17} strokeWidth={2.2} />
                </button>
              </div>
            ) : null}
          </div>

          {!folded ? (
            <div className="sidebar-search-row">
              <label className="search-box">
                <Search size={15} strokeWidth={2.1} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder={t("搜索菜单...")}
                  aria-label={t("搜索菜单")}
                />
                <kbd>
                  <Command size={10} strokeWidth={2.4} />K
                </kbd>
              </label>
            </div>
          ) : null}
        </div>

        {folded ? (
          <nav className="folded-nav-stack" aria-label={t("一级菜单")}>
            {foldedSections.map((section) => (
              <FoldedNavItem
                key={section.id}
                item={section}
                activeNavKey={activeNavKey}
                collapsedGroups={collapsedGroups}
                onToggleGroup={onToggleGroup}
                onActivate={onActivate}
              />
            ))}
          </nav>
        ) : (
          <nav className="nav-stack">
            {visibleSections.map((section) => (
              <SidebarSection
                key={section.id}
                section={section}
                activeNavKey={activeNavKey}
                collapsed={isFiltering ? false : Boolean(collapsedSections[section.id])}
                collapsedGroups={collapsedGroups}
                isFiltering={isFiltering}
                onToggleSection={onToggleSection}
                onToggleGroup={onToggleGroup}
                onQuickAdd={onQuickAdd}
                onActivate={onActivate}
              />
            ))}
            {isFiltering && visibleSections.length === 0 ? <div className="nav-empty">{t("没有匹配的菜单")}</div> : null}
          </nav>
        )}
      </div>

      {folded ? (
        <button
          className="sidebar-round-expand"
          type="button"
          aria-label={t("展开侧边栏")}
          aria-pressed={true}
          title={t("展开菜单")}
          onClick={onToggleFolded}
        >
          <PanelLeftOpen size={15} strokeWidth={2.2} />
          <span className="sidebar-round-tooltip">{t("展开菜单")}</span>
        </button>
      ) : null}

      <div className="sidebar-footer" ref={userMenuRef}>
        <button className="sidebar-user" type="button" onClick={() => onUserMenuAction("个人资料")}>
          <UserAvatar initials={userInitials} color="#1066cc" />
          <span className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-status">
              <span className="status-dot" />
              {userStatus}
            </span>
          </span>
        </button>
        <button
          className={`footer-menu-btn ${userMenuOpen ? "active" : ""}`}
          type="button"
          aria-label={t("打开个人菜单")}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
          onClick={onUserMenuToggle}
        >
          <MoreHorizontal size={16} strokeWidth={2.1} />
        </button>

        {userMenuOpen ? (
          <div className="user-menu-popover" role="menu" aria-label={t("个人菜单")}>
            <button type="button" role="menuitem" onClick={() => onUserMenuAction("个人资料")}>
              <UserRound size={14} strokeWidth={2.1} />
              {t("个人资料")}
            </button>
            <button type="button" role="menuitem" onClick={() => onUserMenuAction("账号设置")}>
              <Settings size={14} strokeWidth={2.1} />
              {t("账号设置")}
            </button>
            <button className="danger" type="button" role="menuitem" onClick={onLogout}>
              <LogOut size={14} strokeWidth={2.1} />
              {t("退出登录")}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function getUserInitials(name: string) {
  const segments = name.trim().split(/\s+/).filter(Boolean);

  if (segments.length >= 2) {
    return `${segments[0][0]}${segments[1][0]}`.toUpperCase();
  }

  return Array.from(name.replace(/\s+/g, "")).slice(0, 2).join("").toUpperCase() || "U";
}

function matchesQuery(value: string, query: string, translate: (text: string) => string) {
  const normalizedValue = value.toLowerCase();
  const translatedValue = translate(value).toLowerCase();

  return normalizedValue.includes(query) || translatedValue.includes(query);
}

function filterNavSections(sections: NavSection[], query: string, translate: (text: string) => string) {
  if (!query) {
    return sections;
  }

  return sections.reduce<NavSection[]>((matchedSections, section) => {
    const sectionMatched = matchesQuery(section.title, query, translate);
    const items = sectionMatched
      ? section.items
      : section.items?.filter((item) => matchesQuery(item.label, query, translate));
    const groups = sectionMatched
      ? section.groups
      : section.groups
          ?.map((group) => {
            const groupMatched = matchesQuery(group.name, query, translate);
            const groupItems = groupMatched
              ? group.items
              : group.items.filter((item) => matchesQuery(item.label, query, translate));

            if (!groupMatched && groupItems.length === 0) {
              return null;
            }

            return { ...group, items: groupItems, count: groupItems.length };
          })
          .filter((group): group is NavGroup => Boolean(group));

    if (sectionMatched || (items?.length ?? 0) > 0 || (groups?.length ?? 0) > 0) {
      matchedSections.push({ ...section, items, groups });
    }

    return matchedSections;
  }, []);
}

function getActiveNavPath(activeNavKey: string) {
  const [activeType, activeSectionId, activeGroupId] = activeNavKey.split(":");

  return {
    groupId: activeType === "group" ? activeGroupId : undefined,
    sectionId: activeSectionId,
  };
}

function getSectionTargetItem(section: NavSection) {
  return section.items?.[0] ?? section.groups?.find((group) => group.items.length > 0)?.items[0] ?? null;
}

function getFoldedNavItems(sections: NavSection[], activeNavKey: string): FoldedNavItemModel[] {
  const activeNavPath = getActiveNavPath(activeNavKey);

  return sections
    .map((section) => {
      const targetItem = getSectionTargetItem(section);

      if (!targetItem) {
        return null;
      }

      return {
        active: activeNavPath.sectionId === section.id,
        icon: section.icon,
        id: section.id,
        label: section.title,
        section,
        targetId: targetItem.id,
      };
    })
    .filter(
      (item): item is FoldedNavItemModel => Boolean(item),
    );
}

function FoldedNavItem({
  activeNavKey,
  collapsedGroups,
  item,
  onToggleGroup,
  onActivate,
}: {
  activeNavKey: string;
  collapsedGroups: Record<string, boolean>;
  item: FoldedNavItemModel;
  onToggleGroup: (id: string) => void;
  onActivate: (id: ModuleId) => void;
}) {
  const { t } = useLanguage();
  const Icon = item.icon;
  const label = t(item.label);
  const textIcon = getTextIcon(label);
  const activeNavPath = getActiveNavPath(activeNavKey);

  return (
    <div className="folded-nav-entry">
      <button
        className={`folded-nav-item ${item.active ? "active" : ""}`}
        type="button"
        title={label}
        aria-current={item.active ? "page" : undefined}
        onClick={() => onActivate(item.targetId)}
      >
        <span className="folded-nav-icon">
          {Icon ? <Icon size={18} strokeWidth={2.1} /> : <span className="folded-nav-text-icon">{textIcon}</span>}
        </span>
      </button>
      <div className="folded-submenu-popover" role="menu" aria-label={label}>
        <div className="folded-submenu-title">{label}</div>
        <div className="folded-submenu-list">
          {item.section.items?.map((navItem) => (
            <FoldedSubmenuItem
              key={`${item.id}-${navItem.id}-${navItem.label}`}
              active={activeNavKey === `section:${item.id}:${navItem.id}:${navItem.label}`}
              item={navItem}
              onActivate={onActivate}
            />
          ))}
          {item.section.groups?.map((group) => {
            const groupCollapsed = Boolean(collapsedGroups[group.id]);
            const groupActive = activeNavPath.sectionId === item.id && activeNavPath.groupId === group.id;
            const groupName = t(group.name);

            return (
              <div
                className="folded-submenu-group"
                key={group.id}
                style={{ "--folded-submenu-group-color": group.color } as CSSProperties}
              >
                <button
                  className={`folded-submenu-group-title ${groupCollapsed ? "collapsed" : ""} ${
                    groupCollapsed && groupActive ? "active" : ""
                  }`}
                  type="button"
                  aria-expanded={!groupCollapsed}
                  onClick={() => onToggleGroup(group.id)}
                >
                  <ChevronDown className="folded-submenu-group-chevron" size={11} strokeWidth={2.2} />
                  <span className="folded-submenu-group-icon" style={{ background: group.color }}>
                    {groupName.slice(0, 1).toUpperCase() || group.initials}
                  </span>
                  <span className="folded-submenu-group-name">{groupName}</span>
                </button>
                <div className={`folded-submenu-group-items ${groupCollapsed ? "collapsed" : ""}`}>
                  {group.items.map((navItem) => (
                    <FoldedSubmenuItem
                      key={`${group.id}-${navItem.id}-${navItem.label}`}
                      active={activeNavKey === `group:${item.id}:${group.id}:${navItem.id}:${navItem.label}`}
                      item={navItem}
                      onActivate={onActivate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getTextIcon(label: string) {
  return Array.from(label.trim()).slice(0, 1).join("").toUpperCase() || "?";
}

function FoldedSubmenuItem({
  active,
  item,
  onActivate,
}: {
  active: boolean;
  item: NavItem;
  onActivate: (id: ModuleId) => void;
}) {
  const { t } = useLanguage();
  const Icon = item.icon;

  return (
    <button
      className={`folded-submenu-item ${active ? "active" : ""}`}
      type="button"
      role="menuitem"
      onClick={() => onActivate(item.id)}
    >
      <span className="folded-submenu-item-icon">
        <Icon size={15} strokeWidth={2.1} />
      </span>
      <span className="folded-submenu-item-label">{t(item.label)}</span>
      {item.badge ? <span className="folded-submenu-badge">{item.badge}</span> : null}
    </button>
  );
}

function SidebarSection({
  section,
  activeNavKey,
  collapsed,
  collapsedGroups,
  isFiltering,
  onToggleSection,
  onToggleGroup,
  onQuickAdd,
  onActivate,
}: {
  section: NavSection;
  activeNavKey: string;
  collapsed: boolean;
  collapsedGroups: Record<string, boolean>;
  isFiltering: boolean;
  onToggleSection: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onQuickAdd: (section: NavSection) => void;
  onActivate: (id: ModuleId) => void;
}) {
  const { t } = useLanguage();
  const activeNavPath = getActiveNavPath(activeNavKey);
  const sectionActive = activeNavPath.sectionId === section.id;

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
      <div className={`section-label ${collapsed && sectionActive ? "active" : ""}`}>
        <button
          className="section-toggle"
          type="button"
          aria-expanded={!collapsed}
          onClick={() => onToggleSection(section.id)}
        >
          <ChevronDown className="section-chevron" size={11} strokeWidth={2.2} />
          <span className="section-title">{t(section.title)}</span>
        </button>
        {section.addable ? (
          <button
            className="add-btn"
            type="button"
            aria-label={`${t("新增")}${t(section.title)}`}
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
            collapsed={isFiltering ? false : Boolean(collapsedGroups[group.id])}
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
  const { t } = useLanguage();
  const translatedGroupName = t(group.name);
  const activeNavPath = getActiveNavPath(activeNavKey);
  const groupActive = activeNavPath.sectionId === sectionId && activeNavPath.groupId === group.id;

  return (
    <div className="menu-group" style={{ "--menu-group-color": group.color } as CSSProperties}>
      <button
        className={`menu-group-header ${collapsed ? "collapsed" : ""} ${collapsed && groupActive ? "active" : ""}`}
        type="button"
        aria-expanded={!collapsed}
        onClick={onToggle}
      >
        <ChevronDown className="menu-group-chevron" size={11} strokeWidth={2.2} />
        <span className="menu-group-icon" style={{ background: group.color }}>
          {translatedGroupName.slice(0, 1).toUpperCase() || group.initials}
        </span>
        <span className="menu-group-name">{translatedGroupName}</span>
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
  const { t } = useLanguage();
  const Icon = item.icon;

  return (
    <button className={`nav-item ${active ? "active" : ""}`} type="button" onClick={() => onActivate(item.id)}>
      <span className="item-icon">
        <Icon size={17} strokeWidth={2.1} />
      </span>
      <span className="item-label">{t(item.label)}</span>
      {item.badge ? <span className="badge">{item.badge}</span> : null}
    </button>
  );
}

export default AppSidebar;
