import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Download,
  Eye,
  FolderTree,
  ListFilter,
  Pencil,
  Plus,
  Route,
  Rows3,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { SearchTablePage } from "../../components/shared/search-table";
import StatusText from "../../components/shared/status-text/StatusText";
import { LonButton, LonDrawer, LonInput, LonModal, LonNumberInput, LonRadioGroup, LonSelect, useLonMessage } from "../../components/ui";
import type { LonNumberInputValue } from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import { menuTreeRecords } from "../../mocks/menuRecords";
import type { MenuLevel, MenuNodeType, MenuRecord } from "../../mocks/menuRecords";
import "./MenuManagementPage.css";

type MenuLevelFilter = "all" | "1" | "2" | "3";
type MenuDrawerMode = "create" | "view" | "edit";
type MenuStatus = "显示" | "隐藏";

type MenuRow = MenuRecord & {
  ancestorIds: string[];
  childCount: number;
  fullTitlePath: string;
  level: MenuLevel;
  parentId: string;
  parentTitle: string;
};

type MenuLevelOption = {
  label: string;
  value: MenuLevelFilter;
};

type MenuFormValues = {
  title: string;
  description: string;
  type: MenuNodeType;
  parentId: string;
  icon: string;
  path: string;
  component: string;
  permission: string;
  sortOrder: LonNumberInputValue;
  owner: string;
  status: MenuStatus;
};

type MenuFormErrors = Partial<Record<keyof MenuFormValues, string>>;

const ROOT_PARENT_ID = "root";
const IMPORTABLE_MENU_KEYS = ["menus", "menuTree", "menuTreeRecords", "items", "data"];

const menuLevelOptions: MenuLevelOption[] = [
  { label: "全部层级", value: "all" },
  { label: "一级", value: "1" },
  { label: "二级", value: "2" },
  { label: "三级", value: "3" },
];

const menuTypeOptions = [
  { value: "目录", label: "目录", description: "承载子菜单，通常使用 AdminLayout" },
  { value: "菜单", label: "菜单", description: "可访问页面，需要配置组件路径" },
];

const menuStatusOptions = [
  { value: "显示", label: "显示", description: "在后台导航和菜单列表中可见" },
  { value: "隐藏", label: "隐藏", description: "保留路由配置，但不在导航中展示" },
];

const menuIconOptions = [
  { value: "Menu", label: "Menu" },
  { value: "Settings", label: "Settings" },
  { value: "LayoutDashboard", label: "LayoutDashboard" },
  { value: "Shield", label: "Shield" },
  { value: "Key", label: "Key" },
  { value: "Building2", label: "Building2" },
  { value: "Tags", label: "Tags" },
  { value: "Globe2", label: "Globe2" },
  { value: "Database", label: "Database" },
  { value: "BookOpen", label: "BookOpen" },
  { value: "Image", label: "Image" },
  { value: "Folder", label: "Folder" },
  { value: "Mail", label: "Mail" },
  { value: "Megaphone", label: "Megaphone" },
  { value: "FileText", label: "FileText" },
  { value: "Activity", label: "Activity" },
];

function MenuManagementPage() {
  const message = useLonMessage();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [menuTree, setMenuTree] = useState<MenuRecord[]>(menuTreeRecords);
  const [levelFilter, setLevelFilter] = useState<MenuLevelFilter>("all");
  const expandableMenuIds = useMemo(() => collectExpandableMenuIds(menuTree), [menuTree]);
  const [expandedMenuIds, setExpandedMenuIds] = useState<Set<string>>(() => new Set(collectExpandableMenuIds(menuTreeRecords)));
  const allMenuRows = useMemo(() => flattenAllMenuRows(menuTree), [menuTree]);
  const visibleMenuRows = useMemo(
    () => flattenMenuRows(menuTree, expandedMenuIds, levelFilter),
    [expandedMenuIds, levelFilter, menuTree],
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const parentOptions = useMemo(() => createParentOptions(allMenuRows, activeMenuId), [activeMenuId, allMenuRows]);
  const levelCounts = useMemo(() => getMenuLevelCounts(allMenuRows), [allMenuRows]);
  const visibleMenuCount = allMenuRows.filter((row) => row.status === "显示").length;
  const hiddenMenuCount = allMenuRows.length - visibleMenuCount;
  const menuFooterStats = [
    { label: "全部", tone: "blue", value: allMenuRows.length },
    { label: "一级", tone: "indigo", value: levelCounts[1] },
    { label: "二级", tone: "green", value: levelCounts[2] },
    { label: "三级", tone: "amber", value: levelCounts[3] },
    { label: "显示", tone: "emerald", value: visibleMenuCount },
    { label: "隐藏", tone: "muted", value: hiddenMenuCount },
  ];
  const allRowsExpanded = expandableMenuIds.length > 0 && expandableMenuIds.every((menuId) => expandedMenuIds.has(menuId));
  const [drawerMode, setDrawerMode] = useState<MenuDrawerMode | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormValues>(() => createDefaultMenuForm(menuTreeRecords, flattenAllMenuRows(menuTreeRecords)));
  const [menuFormErrors, setMenuFormErrors] = useState<MenuFormErrors>({});
  const [savingMenu, setSavingMenu] = useState(false);
  const [importingMenu, setImportingMenu] = useState(false);
  const MenuModuleIcon = moduleMeta.menus.icon;
  const drawerReadOnly = drawerMode === "view";
  const drawerTitle = drawerMode === "edit" ? "编辑菜单" : drawerMode === "view" ? "查看菜单" : "新增菜单";
  const drawerDescription =
    drawerMode === "edit" ? "调整后台导航节点、路由地址、组件路径与权限标识。" : "维护后台导航节点、路由地址、组件路径与权限标识。";
  const disabledMenuTypeOptions = getDisabledChoiceOptions(menuTypeOptions, drawerReadOnly);
  const disabledMenuStatusOptions = getDisabledChoiceOptions(menuStatusOptions, drawerReadOnly);
  const pendingDeleteMenu = deleteMenuId ? allMenuRows.find((row) => row.id === deleteMenuId) ?? null : null;

  function updateMenuForm<K extends keyof MenuFormValues>(key: K, value: MenuFormValues[K]) {
    setMenuForm((currentForm) => ({ ...currentForm, [key]: value }));
    setMenuFormErrors((currentErrors) => ({ ...currentErrors, [key]: undefined }));
  }

  function updateParent(parentId: string) {
    setMenuForm((currentForm) => ({
      ...currentForm,
      parentId,
      sortOrder: getNextSortOrder(menuTree, parentId),
    }));
    setMenuFormErrors((currentErrors) => ({ ...currentErrors, parentId: undefined, type: undefined }));
  }

  function openCreateDrawer() {
    setMenuForm(createDefaultMenuForm(menuTree, allMenuRows));
    setMenuFormErrors({});
    setActiveMenuId(null);
    setDrawerMode("create");
  }

  function openViewDrawer(row: MenuRow) {
    setMenuForm(createMenuFormFromRow(row));
    setMenuFormErrors({});
    setActiveMenuId(row.id);
    setDrawerMode("view");
  }

  function openEditDrawer(row: MenuRow) {
    setMenuForm(createMenuFormFromRow(row));
    setMenuFormErrors({});
    setActiveMenuId(row.id);
    setDrawerMode("edit");
  }

  function closeMenuDrawer() {
    if (savingMenu) {
      return;
    }

    setDrawerMode(null);
    setActiveMenuId(null);
    setMenuFormErrors({});
  }

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

  function exportMenuJson() {
    const exportPayload = {
      schema: "lonear-admin.menu-tree",
      version: 1,
      exportedAt: new Date().toISOString(),
      menus: menuTree,
    };
    const jsonText = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `lonear-menu-tree-${getDateStamp()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    message.success("菜单 JSON 已导出");
  }

  function openImportFilePicker() {
    importInputRef.current?.click();
  }

  async function importMenuJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".json") && file.type && file.type !== "application/json") {
      message.warning("请选择 JSON 文件");
      return;
    }

    setImportingMenu(true);

    try {
      const jsonText = await file.text();
      const parsedValue = JSON.parse(jsonText) as unknown;
      const importedMenuTree = normalizeImportedMenuTree(parsedValue);

      setMenuTree(importedMenuTree);
      setExpandedMenuIds(new Set(collectExpandableMenuIds(importedMenuTree)));
      setLevelFilter("all");
      setDrawerMode(null);
      setActiveMenuId(null);
      message.success(`已导入 ${flattenAllMenuRows(importedMenuTree).length} 个菜单`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "导入失败，请检查 JSON 格式");
    } finally {
      setImportingMenu(false);
    }
  }

  async function submitMenuForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (savingMenu || drawerReadOnly || !drawerMode) {
      return;
    }

    const nextErrors = validateMenuForm(menuForm, allMenuRows, drawerMode === "edit" ? activeMenuId : null);

    setMenuFormErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      message.warning("请先修正菜单信息");
      return;
    }

    setSavingMenu(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 360));

      if (drawerMode === "edit" && activeMenuId) {
        const currentMenu = findMenuRecord(menuTree, activeMenuId);

        if (!currentMenu) {
          throw new Error("菜单不存在");
        }

        const nextMenu = createUpdatedMenuRecord(currentMenu, menuForm);

        setMenuTree((currentTree) => moveMenuRecord(currentTree, activeMenuId, menuForm.parentId, nextMenu));

        if (menuForm.parentId !== ROOT_PARENT_ID) {
          setExpandedMenuIds((currentIds) => new Set([...currentIds, menuForm.parentId]));
        }

        setDrawerMode(null);
        setActiveMenuId(null);
        message.success(`已更新菜单「${nextMenu.title}」`);
        return;
      }

      const nextMenu = createMenuRecord(menuForm, allMenuRows);

      setMenuTree((currentTree) => addMenuRecord(currentTree, menuForm.parentId, nextMenu));

      if (menuForm.parentId !== ROOT_PARENT_ID) {
        setExpandedMenuIds((currentIds) => new Set([...currentIds, menuForm.parentId]));
      }

      setDrawerMode(null);
      message.success(`已新增菜单「${nextMenu.title}」`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存菜单失败，请稍后重试");
    } finally {
      setSavingMenu(false);
    }
  }

  function deleteMenu(row: MenuRow) {
    const deletedIds = new Set(collectMenuRecordIds([row]));

    setMenuTree((currentTree) => removeMenuRecord(currentTree, row.id).records);
    setExpandedMenuIds((currentIds) => {
      const nextIds = new Set(currentIds);

      deletedIds.forEach((menuId) => nextIds.delete(menuId));

      return nextIds;
    });

    if (activeMenuId && deletedIds.has(activeMenuId)) {
      setDrawerMode(null);
      setActiveMenuId(null);
    }

    message.success(`已删除菜单「${row.title}」`);
  }

  function openDeleteMenu(row: MenuRow) {
    setDeleteMenuId(row.id);
  }

  function closeDeleteMenu() {
    setDeleteMenuId(null);
  }

  function confirmDeleteMenu() {
    if (!pendingDeleteMenu) {
      return;
    }

    deleteMenu(pendingDeleteMenu);
    setDeleteMenuId(null);
  }

  return (
    <>
      <SearchTablePage
        className="menu-management-page"
        search={null}
        table={
          <section className="admin-panel table-module menu-table-module">
            <div className="menu-panel-header">
              <div className="menu-panel-heading">
                <MenuModuleIcon size={17} strokeWidth={2.1} />
                <div>
                  <h2>{moduleMeta.menus.title}</h2>
                  <span>维护后台导航结构、路由路径和显示状态</span>
                </div>
              </div>

              <div className="menu-expand-actions" aria-label="菜单操作">
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
                <button className="filter-btn" type="button" onClick={exportMenuJson}>
                  <Download size={13} strokeWidth={2.2} />
                  导出 JSON
                </button>
                <button className="filter-btn" type="button" disabled={importingMenu} onClick={openImportFilePicker}>
                  <Upload size={13} strokeWidth={2.2} />
                  导入 JSON
                </button>
                <button className="filter-btn menu-create-button" type="button" onClick={openCreateDrawer}>
                  <Plus size={13} strokeWidth={2.2} />
                  新增菜单
                </button>
                <input
                  className="menu-json-file-input"
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={importMenuJson}
                />
              </div>
            </div>

            <div className="table-toolbar menu-table-toolbar">
              <div className="menu-table-toolbar-title">
                <FolderTree size={15} strokeWidth={2.1} />
                <span>{getLevelFilterSummary(levelFilter, visibleMenuRows.length)}</span>
              </div>
              <div className="table-toolbar-actions">
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
                    <th className="menu-actions-column">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMenuRows.map((row) => (
                    <MenuTableRow
                      expanded={expandedMenuIds.has(row.id)}
                      key={row.id}
                      row={row}
                      showExpandControl={levelFilter === "all"}
                      onDelete={openDeleteMenu}
                      onEdit={openEditDrawer}
                      onToggleExpanded={toggleMenuExpanded}
                      onView={openViewDrawer}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <div className="table-footer-meta menu-footer-summary" aria-label="菜单统计">
                {menuFooterStats.map((item) => (
                  <span className={`menu-footer-stat tone-${item.tone}`} key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </span>
                ))}
              </div>
              <div className="menu-footer-note">
                <Rows3 size={13} strokeWidth={2.2} />
                <span>最大深度 3 级</span>
              </div>
            </div>
          </section>
        }
      />

      <LonDrawer
        open={drawerMode !== null}
        title={drawerTitle}
        description={drawerDescription}
        size="large"
        maskClosable={!savingMenu}
        onClose={closeMenuDrawer}
        footer={
          drawerReadOnly ? (
            <>
              <LonButton type="button" variant="secondary" onClick={closeMenuDrawer}>
                关闭
              </LonButton>
              <LonButton
                type="button"
                leadingIcon={<Pencil size={14} strokeWidth={2.2} />}
                onClick={() => setDrawerMode("edit")}
              >
                编辑菜单
              </LonButton>
            </>
          ) : (
            <>
              <LonButton type="button" variant="secondary" disabled={savingMenu} onClick={closeMenuDrawer}>
                取消
              </LonButton>
              <LonButton type="submit" form="menu-create-form" loading={savingMenu} leadingIcon={<Save size={14} strokeWidth={2.2} />}>
                {drawerMode === "edit" ? "保存修改" : "保存菜单"}
              </LonButton>
            </>
          )
        }
      >
        <form className="menu-create-form" id="menu-create-form" onSubmit={submitMenuForm}>
          <section className="menu-form-section">
            <h3>基础信息</h3>
            <div className="menu-form-grid">
              <LonInput
                label="菜单名称"
                value={menuForm.title}
                error={menuFormErrors.title}
                placeholder="例如 活动配置"
                disabled={drawerReadOnly}
                onChange={(event) => updateMenuForm("title", event.target.value)}
              />
              <LonSelect
                label="上级菜单"
                value={menuForm.parentId}
                options={parentOptions}
                error={menuFormErrors.parentId}
                disabled={drawerReadOnly}
                onValueChange={updateParent}
              />
              <div className="menu-choice-pair">
                <LonRadioGroup
                  label="菜单类型"
                  value={menuForm.type}
                  options={disabledMenuTypeOptions}
                  error={menuFormErrors.type}
                  direction="vertical"
                  onValueChange={(value) => updateMenuForm("type", value as MenuNodeType)}
                />
                <LonRadioGroup
                  label="显示状态"
                  value={menuForm.status}
                  options={disabledMenuStatusOptions}
                  direction="vertical"
                  onValueChange={(value) => updateMenuForm("status", value as MenuStatus)}
                />
              </div>
              <TextareaField
                label="菜单描述"
                value={menuForm.description}
                error={menuFormErrors.description}
                placeholder="用于说明该菜单的用途和管理范围"
                disabled={drawerReadOnly}
                onChange={(value) => updateMenuForm("description", value)}
              />
            </div>
          </section>

          <section className="menu-form-section">
            <h3>路由配置</h3>
            <div className="menu-form-grid">
              <LonInput
                label="路由地址"
                value={menuForm.path}
                error={menuFormErrors.path}
                placeholder="/system/activity"
                disabled={drawerReadOnly}
                onChange={(event) => updateMenuForm("path", event.target.value)}
              />
              <LonInput
                label="组件路径"
                value={menuForm.component}
                error={menuFormErrors.component}
                placeholder={menuForm.type === "目录" ? "AdminLayout" : "pages/system/ActivityConfigPage"}
                disabled={drawerReadOnly}
                onChange={(event) => updateMenuForm("component", event.target.value)}
              />
              <LonInput
                label="权限标识"
                value={menuForm.permission}
                error={menuFormErrors.permission}
                placeholder="system:activity:view"
                disabled={drawerReadOnly}
                onChange={(event) => updateMenuForm("permission", event.target.value)}
              />
              <LonSelect
                label="菜单图标"
                value={menuForm.icon}
                options={menuIconOptions}
                disabled={drawerReadOnly}
                onValueChange={(value) => updateMenuForm("icon", value)}
              />
            </div>
          </section>

          <section className="menu-form-section">
            <h3>维护信息</h3>
            <div className="menu-form-grid compact">
              <LonNumberInput
                label="排序值"
                value={menuForm.sortOrder}
                min={1}
                max={9999}
                step={1}
                error={menuFormErrors.sortOrder}
                hint="同级菜单按排序值从小到大展示。"
                disabled={drawerReadOnly}
                onValueChange={(value) => updateMenuForm("sortOrder", value)}
              />
              <LonInput
                label="负责人"
                value={menuForm.owner}
                error={menuFormErrors.owner}
                hint="用于后续权限、配置变更和运维责任归属。"
                placeholder="系统管理"
                disabled={drawerReadOnly}
                onChange={(event) => updateMenuForm("owner", event.target.value)}
              />
            </div>
            <div className="menu-create-preview" aria-label="新增菜单预览">
              <span>{menuForm.status}</span>
              <strong>{menuForm.title || "未命名菜单"}</strong>
              <small>{getParentPreviewLabel(menuForm.parentId, allMenuRows)}</small>
            </div>
          </section>
        </form>
      </LonDrawer>

      <LonModal
        open={pendingDeleteMenu !== null}
        title="删除菜单"
        description="删除后当前菜单树将不再显示该菜单。"
        size="small"
        onClose={closeDeleteMenu}
        footer={
          <>
            <LonButton variant="secondary" onClick={closeDeleteMenu}>
              取消
            </LonButton>
            <LonButton variant="danger" leadingIcon={<Trash2 size={14} strokeWidth={2.2} />} onClick={confirmDeleteMenu}>
              确认删除
            </LonButton>
          </>
        }
      >
        {pendingDeleteMenu ? (
          <div className="menu-delete-copy">
            确定要删除 <strong>{pendingDeleteMenu.title}</strong> 吗？
            {pendingDeleteMenu.childCount > 0 ? <span> 将同时删除 {pendingDeleteMenu.childCount} 个子菜单。</span> : null}
          </div>
        ) : null}
      </LonModal>
    </>
  );
}

export default MenuManagementPage;

function TextareaField({
  label,
  value,
  error,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`lon-form-field menu-textarea-field ${error ? "has-error" : ""}`}>
      <span className="lon-form-label">{label}</span>
      <textarea
        className="menu-textarea"
        value={value}
        rows={4}
        aria-invalid={error ? true : undefined}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? <span className="lon-form-error">{error}</span> : null}
    </label>
  );
}

function getDateStamp() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return `${now.getFullYear()}${month}${date}-${hours}${minutes}`;
}

function MenuTableRow({
  expanded,
  row,
  showExpandControl,
  onDelete,
  onEdit,
  onToggleExpanded,
  onView,
}: {
  expanded: boolean;
  row: MenuRow;
  showExpandControl: boolean;
  onDelete: (row: MenuRow) => void;
  onEdit: (row: MenuRow) => void;
  onToggleExpanded: (menuId: string) => void;
  onView: (row: MenuRow) => void;
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
      <td className="menu-actions-column">
        <div className="table-actions menu-row-actions">
          <button type="button" onClick={() => onView(row)}>
            <Eye size={13} strokeWidth={2.2} />
            查看
          </button>
          <button type="button" onClick={() => onEdit(row)}>
            <Pencil size={13} strokeWidth={2.2} />
            编辑
          </button>
          <button className="danger" type="button" onClick={() => onDelete(row)}>
            <Trash2 size={13} strokeWidth={2.2} />
            删除
          </button>
        </div>
      </td>
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractImportMenuRecords(value: unknown) {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    throw new Error("JSON 根节点需要是菜单数组或包含 menus 的对象");
  }

  const importKey = IMPORTABLE_MENU_KEYS.find((key) => Array.isArray(value[key]));

  if (!importKey) {
    throw new Error("JSON 中未找到可导入的菜单数组");
  }

  return value[importKey] as unknown[];
}

function readImportedString(record: Record<string, unknown>, key: keyof MenuRecord, path: string) {
  const value = record[key];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${path} 缺少 ${String(key)} 字段`);
  }

  return value.trim();
}

function readImportedSortOrder(record: Record<string, unknown>, path: string) {
  const value = record.sortOrder;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${path} 缺少有效 sortOrder 字段`);
  }

  return value;
}

function readImportedMenuType(record: Record<string, unknown>, path: string): MenuNodeType {
  const value = record.type;

  if (value !== "目录" && value !== "菜单") {
    throw new Error(`${path} 的 type 只能是「目录」或「菜单」`);
  }

  return value;
}

function readImportedStatus(record: Record<string, unknown>, path: string): MenuStatus {
  const value = record.status;

  if (value !== "显示" && value !== "隐藏") {
    throw new Error(`${path} 的 status 只能是「显示」或「隐藏」`);
  }

  return value;
}

function normalizeImportedMenuRecord(value: unknown, context: { depth: MenuLevel; index: number }): MenuRecord {
  const path = `第 ${context.index + 1} 个${getMenuLevelLabel(context.depth)}菜单`;

  if (!isRecord(value)) {
    throw new Error(`${path} 不是有效对象`);
  }

  const type = readImportedMenuType(value, path);
  const status = readImportedStatus(value, path);
  const rawChildren = value.children;

  if (context.depth === 3 && Array.isArray(rawChildren) && rawChildren.length > 0) {
    throw new Error(`${path} 超过最大 3 级层级`);
  }

  if (type === "菜单" && Array.isArray(rawChildren) && rawChildren.length > 0) {
    throw new Error(`${path} 是菜单类型，不能包含 children`);
  }

  const children =
    Array.isArray(rawChildren) && context.depth < 3
      ? rawChildren.map((childRecord, index) =>
          normalizeImportedMenuRecord(childRecord, { depth: (context.depth + 1) as MenuLevel, index }),
        )
      : undefined;

  return {
    id: readImportedString(value, "id", path),
    title: readImportedString(value, "title", path),
    description: readImportedString(value, "description", path),
    type,
    icon: readImportedString(value, "icon", path),
    path: readImportedString(value, "path", path),
    component: readImportedString(value, "component", path),
    permission: readImportedString(value, "permission", path),
    owner: readImportedString(value, "owner", path),
    status,
    tone: status === "显示" ? "green" : "muted",
    sortOrder: readImportedSortOrder(value, path),
    updated: typeof value.updated === "string" && value.updated.trim() ? value.updated.trim() : "刚刚",
    ...(children?.length ? { children: sortMenuRecords(children) } : {}),
  };
}

function assertNoDuplicateImportedValues(records: MenuRecord[]) {
  const duplicateFields: Array<keyof Pick<MenuRecord, "id" | "path" | "permission">> = ["id", "path", "permission"];
  const rows = flattenAllMenuRows(records);

  duplicateFields.forEach((field) => {
    const valueCount = new Map<string, number>();

    rows.forEach((row) => {
      valueCount.set(row[field], (valueCount.get(row[field]) ?? 0) + 1);
    });

    const duplicateValue = [...valueCount.entries()].find(([, count]) => count > 1)?.[0];

    if (duplicateValue) {
      throw new Error(`导入失败：${String(field)}「${duplicateValue}」重复`);
    }
  });
}

function normalizeImportedMenuTree(value: unknown) {
  const importRecords = extractImportMenuRecords(value);
  const normalizedRecords = sortMenuRecords(
    importRecords.map((record, index) => normalizeImportedMenuRecord(record, { depth: 1, index })),
  );

  if (normalizedRecords.length === 0) {
    throw new Error("JSON 中没有可导入的菜单");
  }

  assertNoDuplicateImportedValues(normalizedRecords);

  return normalizedRecords;
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
      ancestorIds: context.ancestors.map((item) => item.id),
      childCount: record.children?.length ?? 0,
      fullTitlePath: [...context.ancestors.map((item) => item.title), record.title].join(" / "),
      level: context.level,
      parentId: parentRecord?.id ?? ROOT_PARENT_ID,
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

function getDisabledChoiceOptions<TOption extends { value: string; label: string; description?: string; disabled?: boolean }>(
  options: TOption[],
  disabled: boolean,
) {
  return disabled ? options.map((option) => ({ ...option, disabled: true })) : options;
}

function createParentOptions(rows: MenuRow[], excludedMenuId?: string | null) {
  return [
    { value: ROOT_PARENT_ID, label: "根目录" },
    ...rows
      .filter(
        (row) =>
          row.level < 3 &&
          row.type === "目录" &&
          row.id !== excludedMenuId &&
          (excludedMenuId ? !row.ancestorIds.includes(excludedMenuId) : true),
      )
      .map((row) => ({
        value: row.id,
        label: `${"　".repeat(row.level - 1)}${row.fullTitlePath}`,
      })),
  ];
}

function getDefaultParentId(rows: MenuRow[]) {
  return rows.some((row) => row.id === "system") ? "system" : ROOT_PARENT_ID;
}

function createDefaultMenuForm(records: MenuRecord[], rows: MenuRow[]): MenuFormValues {
  const parentId = getDefaultParentId(rows);

  return {
    title: "",
    description: "",
    type: "菜单",
    parentId,
    icon: "Menu",
    path: "",
    component: "",
    permission: "",
    sortOrder: getNextSortOrder(records, parentId),
    owner: "系统管理",
    status: "显示",
  };
}

function createMenuFormFromRow(row: MenuRow): MenuFormValues {
  return {
    title: row.title,
    description: row.description,
    type: row.type,
    parentId: row.parentId,
    icon: row.icon,
    path: row.path,
    component: row.component,
    permission: row.permission,
    sortOrder: row.sortOrder,
    owner: row.owner,
    status: row.status === "隐藏" ? "隐藏" : "显示",
  };
}

function findMenuRecord(records: MenuRecord[], menuId: string): MenuRecord | null {
  for (const record of records) {
    if (record.id === menuId) {
      return record;
    }

    if (record.children?.length) {
      const matchedRecord = findMenuRecord(record.children, menuId);

      if (matchedRecord) {
        return matchedRecord;
      }
    }
  }

  return null;
}

function getSiblingMenus(records: MenuRecord[], parentId: string) {
  if (parentId === ROOT_PARENT_ID) {
    return records;
  }

  return findMenuRecord(records, parentId)?.children ?? [];
}

function getNextSortOrder(records: MenuRecord[], parentId: string) {
  const siblingMenus = getSiblingMenus(records, parentId);
  const maxSortOrder = siblingMenus.reduce((maxValue, record) => Math.max(maxValue, record.sortOrder), 0);

  return maxSortOrder + 10;
}

function getParentPreviewLabel(parentId: string, rows: MenuRow[]) {
  if (parentId === ROOT_PARENT_ID) {
    return "挂载到根目录";
  }

  const parentRow = rows.find((row) => row.id === parentId);

  return parentRow ? `挂载到 ${parentRow.fullTitlePath}` : "请选择上级菜单";
}

function validateMenuForm(values: MenuFormValues, rows: MenuRow[], currentMenuId?: string | null) {
  const errors: MenuFormErrors = {};
  const parentLevel = values.parentId === ROOT_PARENT_ID ? 0 : rows.find((row) => row.id === values.parentId)?.level;
  const currentRow = currentMenuId ? rows.find((row) => row.id === currentMenuId) : undefined;
  const selectedParentRow = values.parentId === ROOT_PARENT_ID ? undefined : rows.find((row) => row.id === values.parentId);
  const normalizedPath = values.path.trim();
  const normalizedComponent = values.component.trim();
  const normalizedPermission = values.permission.trim();

  if (!values.title.trim()) {
    errors.title = "请输入菜单名称";
  }

  if (!values.description.trim()) {
    errors.description = "请输入菜单描述";
  }

  if (typeof parentLevel !== "number") {
    errors.parentId = "请选择有效上级菜单";
  }

  if (currentMenuId && (values.parentId === currentMenuId || selectedParentRow?.ancestorIds.includes(currentMenuId))) {
    errors.parentId = "不能将菜单挂载到自身或子菜单下";
  }

  if (currentRow?.childCount && typeof parentLevel === "number" && parentLevel >= 2) {
    errors.parentId = "包含子菜单的节点不能移动到三级层级";
  }

  if (parentLevel === 2 && values.type === "目录") {
    errors.type = "三级节点不能继续创建目录";
  }

  if (currentRow?.childCount && values.type === "菜单") {
    errors.type = "包含子菜单的节点不能改为菜单类型";
  }

  if (!normalizedPath) {
    errors.path = "请输入路由地址";
  } else if (!normalizedPath.startsWith("/")) {
    errors.path = "路由地址需要以 / 开头";
  } else if (normalizedPath !== currentRow?.path && rows.some((row) => row.id !== currentMenuId && row.path === normalizedPath)) {
    errors.path = "路由地址已存在";
  }

  if (values.type === "菜单" && !normalizedComponent) {
    errors.component = "菜单类型需要配置组件路径";
  }

  if (!normalizedPermission) {
    errors.permission = "请输入权限标识";
  } else if (
    normalizedPermission !== currentRow?.permission &&
    rows.some((row) => row.id !== currentMenuId && row.permission === normalizedPermission)
  ) {
    errors.permission = "权限标识已存在";
  }

  if (typeof values.sortOrder !== "number" || !Number.isFinite(values.sortOrder)) {
    errors.sortOrder = "请输入排序值";
  }

  if (!values.owner.trim()) {
    errors.owner = "请输入负责人";
  }

  return errors;
}

function slugifyMenuPath(path: string, title: string) {
  const normalizedPath = path
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .join("-");

  if (normalizedPath) {
    return normalizedPath;
  }

  return title.trim().toLowerCase().replace(/\s+/g, "-") || "custom-menu";
}

function createUniqueMenuId(path: string, title: string, rows: MenuRow[]) {
  const existingIds = new Set(rows.map((row) => row.id));
  const baseId = slugifyMenuPath(path, title);
  let nextId = baseId;
  let suffix = 1;

  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  return nextId;
}

function createMenuRecord(values: MenuFormValues, rows: MenuRow[]): MenuRecord {
  return {
    id: createUniqueMenuId(values.path, values.title, rows),
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    icon: values.icon,
    path: values.path.trim(),
    component: values.type === "目录" ? values.component.trim() || "AdminLayout" : values.component.trim(),
    permission: values.permission.trim(),
    owner: values.owner.trim(),
    status: values.status,
    tone: values.status === "显示" ? "green" : "muted",
    sortOrder: typeof values.sortOrder === "number" ? values.sortOrder : 1,
    updated: "刚刚",
  };
}

function createUpdatedMenuRecord(record: MenuRecord, values: MenuFormValues): MenuRecord {
  return {
    ...record,
    title: values.title.trim(),
    description: values.description.trim(),
    type: values.type,
    icon: values.icon,
    path: values.path.trim(),
    component: values.type === "目录" ? values.component.trim() || "AdminLayout" : values.component.trim(),
    permission: values.permission.trim(),
    owner: values.owner.trim(),
    status: values.status,
    tone: values.status === "显示" ? "green" : "muted",
    sortOrder: typeof values.sortOrder === "number" ? values.sortOrder : 1,
    updated: "刚刚",
    children: values.type === "目录" ? record.children : undefined,
  };
}

function sortMenuRecords(records: MenuRecord[]) {
  return [...records].sort((leftRecord, rightRecord) => leftRecord.sortOrder - rightRecord.sortOrder);
}

function addMenuRecord(records: MenuRecord[], parentId: string, newRecord: MenuRecord): MenuRecord[] {
  if (parentId === ROOT_PARENT_ID) {
    return sortMenuRecords([...records, newRecord]);
  }

  return records.map((record) => {
    if (record.id === parentId) {
      return {
        ...record,
        children: sortMenuRecords([...(record.children ?? []), newRecord]),
      };
    }

    if (!record.children?.length) {
      return record;
    }

    return {
      ...record,
      children: addMenuRecord(record.children, parentId, newRecord),
    };
  });
}

function removeMenuRecord(records: MenuRecord[], menuId: string): { records: MenuRecord[]; removed?: MenuRecord } {
  let removedRecord: MenuRecord | undefined;
  const nextRecords: MenuRecord[] = [];

  records.forEach((record) => {
    if (record.id === menuId) {
      removedRecord = record;
      return;
    }

    if (!record.children?.length) {
      nextRecords.push(record);
      return;
    }

    const result = removeMenuRecord(record.children, menuId);

    if (result.removed) {
      removedRecord = result.removed;
    }

    nextRecords.push({
      ...record,
      ...(result.records.length ? { children: result.records } : { children: undefined }),
    });
  });

  return { records: nextRecords, removed: removedRecord };
}

function moveMenuRecord(records: MenuRecord[], menuId: string, parentId: string, updatedRecord: MenuRecord) {
  const result = removeMenuRecord(records, menuId);

  if (!result.removed) {
    return records;
  }

  return addMenuRecord(result.records, parentId, updatedRecord);
}

function collectMenuRecordIds(records: MenuRecord[]): string[] {
  return records.flatMap((record) => [record.id, ...(record.children?.length ? collectMenuRecordIds(record.children) : [])]);
}
