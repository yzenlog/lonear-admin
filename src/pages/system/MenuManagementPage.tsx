import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Eye,
  FolderTree,
  ListFilter,
  Route,
  Rows3,
} from "lucide-react";
import PanelHeader from "../../components/shared/panel-header/PanelHeader";
import SearchTableLayout from "../../components/shared/search-table-layout/SearchTableLayout";
import StatusText from "../../components/shared/status-text/StatusText";
import { moduleMeta } from "../../config/modules";
import { menuTreeRecords } from "../../mocks/menuRecords";
import type { MenuLevel, MenuRecord } from "../../mocks/menuRecords";
import "./MenuManagementPage.css";

type MenuLevelFilter = "all" | "1" | "2" | "3";

type MenuRow = MenuRecord & {
  childCount: number;
  fullTitlePath: string;
  level: MenuLevel;
  parentTitle: string;
};

type MenuLevelOption = {
  label: string;
  value: MenuLevelFilter;
};

type MenuSummaryMetricProps = {
  label: string;
  value: number | string;
};

const menuLevelOptions: MenuLevelOption[] = [
  { label: "全部层级", value: "all" },
  { label: "一级", value: "1" },
  { label: "二级", value: "2" },
  { label: "三级", value: "3" },
];

function MenuManagementPage() {
  const [levelFilter, setLevelFilter] = useState<MenuLevelFilter>("all");
  const expandableMenuIds = useMemo(() => collectExpandableMenuIds(menuTreeRecords), []);
  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(() => new Set(expandableMenuIds));
  const allMenuRows = useMemo(() => flattenAllMenuRows(menuTreeRecords), []);
  const visibleMenuRows = useMemo(
    () => flattenMenuRows(menuTreeRecords, expandedMenuIds, levelFilter),
    [expandedMenuIds, levelFilter],
  );
  const levelCounts = useMemo(() => getMenuLevelCounts(allMenuRows), [allMenuRows]);
  const visibleMenuCount = allMenuRows.filter((row) => row.status === "显示").length;
  const hiddenMenuCount = allMenuRows.length - visibleMenuCount;
  const allRowsExpanded = expandedMenuIds.size === expandableMenuIds.length;

  function toggleMenuExpanded(menuId: string) {
    setExpandedMenuIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(menuId)) {
        nextIds.delete(menuId);
      } else {
        nextIds.add(menuId);
      }

      return nextIds;
    });
  }

  function expandAllMenus() {
    setExpandedMenuIds(new Set(expandableMenuIds));
  }

  function collapseAllMenus() {
    setExpandedMenuIds(new Set());
  }

  return (
    <SearchTableLayout
      className="menu-management-page"
      search={
        <section className="admin-panel menu-overview-panel" aria-label="菜单概览">
          <div className="menu-overview-stats">
            <MenuSummaryMetric label="全部菜单" value={allMenuRows.length} />
            <MenuSummaryMetric label="一级" value={levelCounts[1]} />
            <MenuSummaryMetric label="二级" value={levelCounts[2]} />
            <MenuSummaryMetric label="三级" value={levelCounts[3]} />
            <MenuSummaryMetric label="隐藏" value={hiddenMenuCount} />
          </div>

          <div className="menu-overview-controls">
            <div className="menu-level-tabs" role="tablist" aria-label="菜单层级查看">
              {menuLevelOptions.map((option) => (
                <button
                  className={`menu-level-tab ${levelFilter === option.value ? "active" : ""}`}
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={levelFilter === option.value}
                  onClick={() => setLevelFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="menu-expand-actions">
              <button className="filter-btn" type="button" disabled={allRowsExpanded} onClick={expandAllMenus}>
                <ChevronsDown size={13} strokeWidth={2.2} />
                展开全部
              </button>
              <button
                className="filter-btn"
                type="button"
                disabled={expandedMenuIds.size === 0}
                onClick={collapseAllMenus}
              >
                <ChevronsUp size={13} strokeWidth={2.2} />
                收起全部
              </button>
            </div>
          </div>
        </section>
      }
      table={
        <section className="admin-panel table-module menu-table-module">
          <PanelHeader icon={moduleMeta.menus.icon} title={moduleMeta.menus.title} action={moduleMeta.menus.action} />
          <div className="table-toolbar menu-table-toolbar">
            <div className="menu-table-toolbar-title">
              <FolderTree size={15} strokeWidth={2.1} />
              <span>{getLevelFilterSummary(levelFilter, visibleMenuRows.length)}</span>
            </div>
            <div className="table-toolbar-actions">
              <button className="filter-btn" type="button">
                <ListFilter size={13} strokeWidth={2.2} />
                状态：全部
              </button>
              <button className="filter-btn" type="button">
                <Eye size={13} strokeWidth={2.2} />
                显示字段
                <ChevronDown size={11} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          <div className="table-scroll fill-remaining menu-table-scroll">
            <table className="management-table menu-tree-table">
              <thead>
                <tr>
                  <th className="menu-name-column">菜单名称</th>
                  <th>层级</th>
                  <th>上级菜单</th>
                  <th>类型</th>
                  <th>路由地址</th>
                  <th>组件路径</th>
                  <th>权限标识</th>
                  <th>排序</th>
                  <th>负责人</th>
                  <th>状态</th>
                  <th>更新时间</th>
                </tr>
              </thead>
              <tbody>
                {visibleMenuRows.map((row) => (
                  <MenuTableRow
                    expanded={expandedMenuIds.has(row.id)}
                    key={row.id}
                    row={row}
                    showExpandControl={levelFilter === "all"}
                    onToggleExpanded={toggleMenuExpanded}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="table-footer-meta">
              <span>当前展示 {visibleMenuRows.length} 条</span>
              <span>显示 {visibleMenuCount} 条</span>
              <span>隐藏 {hiddenMenuCount} 条</span>
            </div>
            <div className="menu-footer-note">
              <Rows3 size={13} strokeWidth={2.2} />
              <span>最大深度 3 级</span>
            </div>
          </div>
        </section>
      }
    />
  );
}

export default MenuManagementPage;

function MenuSummaryMetric({ label, value }: MenuSummaryMetricProps) {
  return (
    <div className="menu-summary-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function MenuTableRow({
  expanded,
  row,
  showExpandControl,
  onToggleExpanded,
}: {
  expanded: boolean;
  row: MenuRow;
  showExpandControl: boolean;
  onToggleExpanded: (menuId: string) => void;
}) {
  const hasChildren = row.childCount > 0;
  const indentLevel = row.level - 1;

  return (
    <tr className={`menu-tree-row level-${row.level}`}>
      <td className="menu-name-column">
        <div className="menu-name-cell" title={row.fullTitlePath} style={{ paddingLeft: `${indentLevel * 22}px` }}>
          {showExpandControl && hasChildren ? (
            <button
              className="menu-expand-toggle"
              type="button"
              aria-label={`${expanded ? "收起" : "展开"}${row.title}`}
              aria-expanded={expanded}
              onClick={() => onToggleExpanded(row.id)}
            >
              {expanded ? <ChevronDown size={14} strokeWidth={2.2} /> : <ChevronRight size={14} strokeWidth={2.2} />}
            </button>
          ) : (
            <span className="menu-expand-placeholder" aria-hidden="true" />
          )}

          <span className="menu-node-icon" aria-hidden="true">
            <Route size={13} strokeWidth={2.1} />
          </span>
          <div className="table-main-cell menu-title-copy">
            <strong>{row.title}</strong>
            <span>{row.description}</span>
          </div>
        </div>
      </td>
      <td>
        <span className={`menu-level-badge level-${row.level}`}>{getMenuLevelLabel(row.level)}</span>
      </td>
      <td>{row.parentTitle}</td>
      <td>{row.type}</td>
      <td className="menu-code-cell">{row.path}</td>
      <td className="menu-code-cell">{row.component}</td>
      <td className="menu-code-cell">{row.permission}</td>
      <td>{row.sortOrder}</td>
      <td>{row.owner}</td>
      <td>
        <StatusText tone={row.tone}>{row.status}</StatusText>
      </td>
      <td className="muted-text">{row.updated}</td>
    </tr>
  );
}

function collectExpandableMenuIds(records: MenuRecord[]) {
  const ids: string[] = [];

  records.forEach((record) => {
    if (record.children?.length) {
      ids.push(record.id);
      ids.push(...collectExpandableMenuIds(record.children));
    }
  });

  return ids;
}

function flattenAllMenuRows(records: MenuRecord[]) {
  return flattenMenuRows(records, new Set(collectExpandableMenuIds(records)), "all");
}

function flattenMenuRows(records: MenuRecord[], expandedMenuIds: Set<string>, levelFilter: MenuLevelFilter) {
  const rows: MenuRow[] = [];

  appendMenuRows(records, {
    ancestors: [],
    expandedMenuIds,
    level: 1,
    levelFilter,
    rows,
  });

  return rows;
}

function appendMenuRows(
  records: MenuRecord[],
  context: {
    ancestors: MenuRecord[];
    expandedMenuIds: Set<string>;
    level: MenuLevel;
    levelFilter: MenuLevelFilter;
    rows: MenuRow[];
  },
) {
  records.forEach((record) => {
    const parentRecord = context.ancestors[context.ancestors.length - 1];
    const row: MenuRow = {
      ...record,
      childCount: record.children?.length ?? 0,
      fullTitlePath: [...context.ancestors.map((item) => item.title), record.title].join(" / "),
      level: context.level,
      parentTitle: parentRecord?.title ?? "根目录",
    };
    const matchesLevel = context.levelFilter === "all" || context.levelFilter === String(context.level);

    if (matchesLevel) {
      context.rows.push(row);
    }

    if (!record.children?.length || context.level === 3) {
      return;
    }

    if (context.levelFilter !== "all" || context.expandedMenuIds.has(record.id)) {
      appendMenuRows(record.children, {
        ...context,
        ancestors: [...context.ancestors, record],
        level: (context.level + 1) as MenuLevel,
      });
    }
  });
}

function getMenuLevelCounts(rows: MenuRow[]) {
  return rows.reduce(
    (counts, row) => ({
      ...counts,
      [row.level]: counts[row.level] + 1,
    }),
    { 1: 0, 2: 0, 3: 0 } satisfies Record<MenuLevel, number>,
  );
}

function getMenuLevelLabel(level: MenuLevel) {
  if (level === 1) {
    return "一级";
  }

  if (level === 2) {
    return "二级";
  }

  return "三级";
}

function getLevelFilterSummary(levelFilter: MenuLevelFilter, rowCount: number) {
  if (levelFilter === "all") {
    return `菜单树 · ${rowCount} 条`;
  }

  return `${getMenuLevelLabel(Number(levelFilter) as MenuLevel)}菜单 · ${rowCount} 条`;
}
