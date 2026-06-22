import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent, ReactNode, Ref } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
  Search,
  Settings,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import StatusText from "../../components/shared/status-text/StatusText";
import { LonButton, LonDrawer, LonInput, LonModal, LonNumberInput, LonSelect } from "../../components/ui";
import type { LonNumberInputValue } from "../../components/ui";
import { moduleMeta } from "../../config/modules";
import { moduleRecords } from "../../mocks/managementRecords";
import type { ManagementRecord } from "../../mocks/managementRecords";

const DEFAULT_ROLE_FILTERS = {
  keyword: "",
  status: "all",
  owner: "all",
  roleType: "all",
  memberSize: "all",
  updatedRange: "all",
};
const DEFAULT_ROLE_PAGE_SIZE = 10;
const ROLE_PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100, 150, 200, 500, 1000, 1500, 2000] as const;
const rolePageSizeOptions = ROLE_PAGE_SIZE_OPTIONS.map((pageSize) => ({
  value: String(pageSize),
  label: `${pageSize} 条/页`,
}));
const ROLE_IMAGE_ASSETS = [
  { title: "测试图片 1", src: "/images/avatars/avatar-1.jpeg", meta: "152 x 152 · JPEG" },
  { title: "测试图片 2", src: "/images/avatars/avatar-2.png", meta: "990 x 798 · PNG" },
] as const;
const roleDisplayFields = [
  { id: "image", label: "头像" },
  { id: "members", label: "成员" },
  { id: "roleType", label: "角色类型" },
  { id: "owner", label: "所属组织" },
  { id: "dataScope", label: "数据范围" },
  { id: "permissionCount", label: "权限数" },
  { id: "memberLimit", label: "成员上限" },
  { id: "status", label: "状态" },
  { id: "updated", label: "更新时间" },
  { id: "lastOperator", label: "最后操作人" },
  { id: "createdAt", label: "创建时间" },
] as const;

type RoleFilters = typeof DEFAULT_ROLE_FILTERS;
type RoleImage = (typeof ROLE_IMAGE_ASSETS)[number];
type RoleRecord = ManagementRecord & { image: RoleImage };
type RoleDisplayField = (typeof roleDisplayFields)[number]["id"];
type SearchSelectOption = {
  value: string;
  label: string;
};
type RoleImagePreviewState = {
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
};
type RoleImageDragOrigin = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
};
type TableDisplayConfig = {
  bordered: boolean;
  striped: boolean;
  compact: boolean;
  hoverable: boolean;
};
type RoleDialogMode = "detail" | "edit" | "delete" | "batchDelete" | null;
type RoleEditForm = {
  title: string;
  description: string;
  owner: string;
  status: string;
  memberCount: LonNumberInputValue;
};
type RoleExportColumn = {
  label: string;
  getValue: (record: RoleRecord, index: number) => string;
};

const DEFAULT_VISIBLE_ROLE_COLUMNS: Record<RoleDisplayField, boolean> = {
  image: true,
  members: true,
  roleType: true,
  owner: true,
  dataScope: true,
  permissionCount: true,
  memberLimit: true,
  status: true,
  updated: true,
  lastOperator: true,
  createdAt: true,
};
const DEFAULT_TABLE_DISPLAY_CONFIG = {
  bordered: false,
  striped: false,
  compact: false,
  hoverable: true,
};
const DEFAULT_ROLE_IMAGE_PREVIEW_STATE: RoleImagePreviewState = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};

function getRoleMemberCount(record: ManagementRecord) {
  return Number.parseInt(record.meta, 10) || 0;
}

function getRoleToneByStatus(status: string): ManagementRecord["tone"] {
  if (status === "启用") {
    return "green";
  }

  if (status === "只读") {
    return "blue";
  }

  if (status === "待复核") {
    return "amber";
  }

  return "muted";
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

function getRoleTypeLabel(record: ManagementRecord) {
  const roleType = getRoleType(record);

  if (roleType === "system") {
    return "内置角色";
  }

  if (roleType === "readonly") {
    return "只读角色";
  }

  if (roleType === "temporary") {
    return "临时角色";
  }

  return "业务角色";
}

function getRoleDataScope(record: ManagementRecord) {
  if (record.owner === "系统内置") {
    return "全部数据";
  }

  if (record.status === "只读") {
    return "审计只读";
  }

  if (record.status === "待复核") {
    return "项目数据";
  }

  return `${record.owner}数据`;
}

function getRolePermissionCount(record: ManagementRecord) {
  const roleType = getRoleType(record);
  const permissionCountMap: Record<ReturnType<typeof getRoleType>, number> = {
    system: 128,
    business: 56,
    readonly: 22,
    temporary: 14,
  };

  return `${permissionCountMap[roleType]} 项`;
}

function getRoleMemberLimit(record: ManagementRecord) {
  const memberCount = getRoleMemberCount(record);

  if (record.owner === "系统内置") {
    return "不限";
  }

  if (memberCount >= 11) {
    return "30 人";
  }

  if (memberCount >= 6) {
    return "20 人";
  }

  return "10 人";
}

function getRoleLastOperator(record: ManagementRecord) {
  if (record.owner === "系统内置") {
    return "系统";
  }

  if (record.owner === "运营中心") {
    return "赵运营";
  }

  if (record.owner === "风控部") {
    return "周审计";
  }

  return "李项目";
}

function getRoleCreatedAt(record: ManagementRecord) {
  if (record.owner === "系统内置") {
    return "2024-01-08";
  }

  if (record.owner === "运营中心") {
    return "2024-03-18";
  }

  if (record.owner === "风控部") {
    return "2024-05-26";
  }

  return "2025-01-14";
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

function getRoleKey(record: ManagementRecord) {
  return `${record.title}-${record.owner}-${record.updated}`;
}

function createRoleRecords(records: ManagementRecord[]): RoleRecord[] {
  return records.map((record, index) => ({
    ...record,
    image: ROLE_IMAGE_ASSETS[index % ROLE_IMAGE_ASSETS.length],
  }));
}

function createRoleEditForm(record: ManagementRecord): RoleEditForm {
  return {
    title: record.title,
    description: record.description,
    owner: record.owner,
    status: record.status,
    memberCount: getRoleMemberCount(record),
  };
}

function getRoleDetailItems(
  record: RoleRecord,
  onPreviewImage?: (image: RoleImage) => void,
): Array<{ label: string; value: ReactNode }> {
  return [
    { label: "角色名称", value: record.title },
    { label: "角色描述", value: record.description },
    ...roleDisplayFields.map((field) => ({
      label: field.label,
      value: renderRoleColumnValue(field.id, record, onPreviewImage),
    })),
  ];
}

function renderRoleImage(record: RoleRecord, onPreviewImage?: (image: RoleImage) => void) {
  const thumb = (
    <span className="image-showcase-thumb role-image-thumb">
      <img alt={`${record.title}图片`} src={record.image.src} />
    </span>
  );

  if (!onPreviewImage) {
    return thumb;
  }

  return (
    <button
      className="role-image-trigger"
      type="button"
      aria-label={`预览${record.title}图片`}
      onClick={() => onPreviewImage(record.image)}
    >
      {thumb}
    </button>
  );
}

function renderRoleColumnValue(
  fieldId: RoleDisplayField,
  record: RoleRecord,
  onPreviewImage?: (image: RoleImage) => void,
): ReactNode {
  if (fieldId === "image") {
    return renderRoleImage(record, onPreviewImage);
  }

  if (fieldId === "members") {
    return record.meta;
  }

  if (fieldId === "roleType") {
    return getRoleTypeLabel(record);
  }

  if (fieldId === "owner") {
    return record.owner;
  }

  if (fieldId === "dataScope") {
    return getRoleDataScope(record);
  }

  if (fieldId === "permissionCount") {
    return getRolePermissionCount(record);
  }

  if (fieldId === "memberLimit") {
    return getRoleMemberLimit(record);
  }

  if (fieldId === "status") {
    return <StatusText tone={record.tone}>{record.status}</StatusText>;
  }

  if (fieldId === "updated") {
    return <span className="muted-text">{record.updated}</span>;
  }

  if (fieldId === "lastOperator") {
    return getRoleLastOperator(record);
  }

  return getRoleCreatedAt(record);
}

function getRoleExportFieldValue(fieldId: RoleDisplayField, record: RoleRecord) {
  if (fieldId === "image") {
    return `${record.image.title} ${record.image.src}`;
  }

  if (fieldId === "members") {
    return record.meta;
  }

  if (fieldId === "roleType") {
    return getRoleTypeLabel(record);
  }

  if (fieldId === "owner") {
    return record.owner;
  }

  if (fieldId === "dataScope") {
    return getRoleDataScope(record);
  }

  if (fieldId === "permissionCount") {
    return getRolePermissionCount(record);
  }

  if (fieldId === "memberLimit") {
    return getRoleMemberLimit(record);
  }

  if (fieldId === "status") {
    return record.status;
  }

  if (fieldId === "updated") {
    return record.updated;
  }

  if (fieldId === "lastOperator") {
    return getRoleLastOperator(record);
  }

  return getRoleCreatedAt(record);
}

function createRoleExportColumns(visibleRoleColumns: Record<RoleDisplayField, boolean>): RoleExportColumn[] {
  const visibleFields = roleDisplayFields.filter((field) => visibleRoleColumns[field.id]);

  return [
    { label: "角色名称", getValue: (record) => record.title },
    { label: "角色描述", getValue: (record) => record.description },
    ...visibleFields.map((field) => ({
      label: field.label,
      getValue: (record: RoleRecord) => getRoleExportFieldValue(field.id, record),
    })),
  ];
}

function escapeExcelCell(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getExportTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "-",
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join("");
}

function downloadRoleExcelFile(fileName: string, columns: RoleExportColumn[], records: RoleRecord[]) {
  const tableHead = columns.map((column) => `<th>${escapeExcelCell(column.label)}</th>`).join("");
  const tableRows = records
    .map((record, index) => {
      const cells = columns
        .map((column) => `<td>${escapeExcelCell(column.getValue(record, index))}</td>`)
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
  </head>
  <body>
    <table border="1">
      <thead><tr>${tableHead}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}

function RoleManagementPage() {
  const [records, setRecords] = useState<RoleRecord[]>(() => createRoleRecords(moduleRecords.roles));
  const [draftFilters, setDraftFilters] = useState<RoleFilters>(DEFAULT_ROLE_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<RoleFilters>(DEFAULT_ROLE_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [fieldMenuOpen, setFieldMenuOpen] = useState(false);
  const [tableConfigOpen, setTableConfigOpen] = useState(false);
  const [batchActionMenuOpen, setBatchActionMenuOpen] = useState(false);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [activeRoleKey, setActiveRoleKey] = useState<string | null>(null);
  const [roleDialogMode, setRoleDialogMode] = useState<RoleDialogMode>(null);
  const [editForm, setEditForm] = useState<RoleEditForm>(() => createRoleEditForm(moduleRecords.roles[0]));
  const [roleActionsPinned, setRoleActionsPinned] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_ROLE_PAGE_SIZE);
  const [previewImage, setPreviewImage] = useState<RoleImage | null>(null);
  const [imagePreviewState, setImagePreviewState] = useState<RoleImagePreviewState>(
    DEFAULT_ROLE_IMAGE_PREVIEW_STATE,
  );
  const [imageDragOrigin, setImageDragOrigin] = useState<RoleImageDragOrigin | null>(null);
  const [visibleRoleColumns, setVisibleRoleColumns] = useState<Record<RoleDisplayField, boolean>>(
    DEFAULT_VISIBLE_ROLE_COLUMNS,
  );
  const [tableDisplayConfig, setTableDisplayConfig] =
    useState<TableDisplayConfig>(DEFAULT_TABLE_DISPLAY_CONFIG);
  const fieldMenuRef = useRef<HTMLDivElement>(null);
  const tableConfigRef = useRef<HTMLDivElement>(null);
  const batchActionRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const allRolesCheckboxRef = useRef<HTMLInputElement>(null);

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
  const ownerEditOptions = useMemo(() => ownerOptions.map((owner) => ({ value: owner, label: owner })), [ownerOptions]);
  const statusEditOptions = useMemo(
    () => statusOptions.map((status) => ({ value: status, label: status })),
    [statusOptions],
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
  const activeRole = useMemo(
    () => (activeRoleKey ? records.find((record) => getRoleKey(record) === activeRoleKey) ?? null : null),
    [activeRoleKey, records],
  );

  const filteredRoles = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();

    return records.filter((record) => {
      const matchesKeyword =
        !keyword ||
        [
          record.title,
          record.description,
          record.meta,
          record.owner,
          record.status,
          getRoleTypeLabel(record),
          getRoleDataScope(record),
          getRolePermissionCount(record),
          getRoleMemberLimit(record),
          getRoleLastOperator(record),
          getRoleCreatedAt(record),
          record.image.title,
        ].some((value) => value.toLowerCase().includes(keyword));
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
  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const pagedRoles = useMemo(() => {
    const pageStart = (currentPage - 1) * pageSize;

    return filteredRoles.slice(pageStart, pageStart + pageSize);
  }, [currentPage, filteredRoles, pageSize]);
  const pagedRoleKeys = useMemo(() => pagedRoles.map(getRoleKey), [pagedRoles]);
  const selectedRoleKeySet = useMemo(() => new Set(selectedRoleKeys), [selectedRoleKeys]);
  const selectedRoles = useMemo(
    () => records.filter((record) => selectedRoleKeySet.has(getRoleKey(record))),
    [records, selectedRoleKeySet],
  );
  const selectedRoleCount = selectedRoleKeys.length;
  const selectedPagedRoleCount = pagedRoleKeys.filter((roleKey) => selectedRoleKeySet.has(roleKey)).length;
  const allPagedRolesSelected = pagedRoleKeys.length > 0 && selectedPagedRoleCount === pagedRoleKeys.length;
  const hasPartialPagedRoleSelection = selectedPagedRoleCount > 0 && !allPagedRolesSelected;
  const visibleTableColumnCount = 3 + roleDisplayFields.filter((field) => visibleRoleColumns[field.id]).length;
  const tableClassName = [
    "management-table",
    "role-table",
    tableDisplayConfig.bordered ? "table-bordered" : "",
    tableDisplayConfig.striped ? "table-striped" : "",
    tableDisplayConfig.compact ? "table-compact" : "",
    tableDisplayConfig.hoverable ? "" : "table-no-hover",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (allRolesCheckboxRef.current) {
      allRolesCheckboxRef.current.indeterminate = hasPartialPagedRoleSelection;
    }
  }, [hasPartialPagedRoleSelection]);

  useEffect(() => {
    if (selectedRoleCount === 0) {
      setBatchActionMenuOpen(false);
    }
  }, [selectedRoleCount]);

  useEffect(() => {
    const scrollElement = tableScrollRef.current;

    if (!scrollElement) {
      return;
    }

    const updatePinnedState = () => {
      const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;

      setRoleActionsPinned(maxScrollLeft > 1 && scrollElement.scrollLeft < maxScrollLeft - 1);
    };

    updatePinnedState();
    scrollElement.addEventListener("scroll", updatePinnedState);
    window.addEventListener("resize", updatePinnedState);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updatePinnedState();
          });
    const tableElement = scrollElement.querySelector(".role-table");

    resizeObserver?.observe(scrollElement);
    if (tableElement) {
      resizeObserver?.observe(tableElement);
    }

    return () => {
      scrollElement.removeEventListener("scroll", updatePinnedState);
      window.removeEventListener("resize", updatePinnedState);
      resizeObserver?.disconnect();
    };
  }, [pagedRoles.length, visibleRoleColumns]);

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

  useEffect(() => {
    if (!tableConfigOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!tableConfigRef.current?.contains(event.target as Node)) {
        setTableConfigOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTableConfigOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [tableConfigOpen]);

  useEffect(() => {
    if (!batchActionMenuOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!batchActionRef.current?.contains(event.target as Node)) {
        setBatchActionMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBatchActionMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [batchActionMenuOpen]);

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

  function toggleTableDisplayConfig(key: keyof TableDisplayConfig) {
    setTableDisplayConfig((current) => ({ ...current, [key]: !current[key] }));
  }

  function toggleRoleSelection(roleKey: string) {
    setSelectedRoleKeys((current) => {
      if (current.includes(roleKey)) {
        return current.filter((currentRoleKey) => currentRoleKey !== roleKey);
      }

      return [...current, roleKey];
    });
  }

  function togglePagedRoleSelection() {
    setSelectedRoleKeys((current) => {
      const nextRoleKeys = new Set(current);
      const shouldClearPagedRoles = pagedRoleKeys.every((roleKey) => nextRoleKeys.has(roleKey));

      pagedRoleKeys.forEach((roleKey) => {
        if (shouldClearPagedRoles) {
          nextRoleKeys.delete(roleKey);
        } else {
          nextRoleKeys.add(roleKey);
        }
      });

      return Array.from(nextRoleKeys);
    });
  }

  function handlePageSizeChange(value: string) {
    const nextPageSize = Number(value);

    if (ROLE_PAGE_SIZE_OPTIONS.includes(nextPageSize as (typeof ROLE_PAGE_SIZE_OPTIONS)[number])) {
      setPageSize(nextPageSize);
      setCurrentPage(1);
    }
  }

  function handleExportCurrentPageRoles() {
    if (pagedRoles.length === 0) {
      return;
    }

    const columns = createRoleExportColumns(visibleRoleColumns);

    downloadRoleExcelFile(`角色管理-第${currentPage}页-${getExportTimestamp()}.xls`, columns, pagedRoles);
  }

  function handleExportSelectedRoles() {
    if (selectedRoles.length === 0) {
      return;
    }

    const columns = createRoleExportColumns(visibleRoleColumns);

    setBatchActionMenuOpen(false);
    downloadRoleExcelFile(`角色管理-已选${selectedRoles.length}条-${getExportTimestamp()}.xls`, columns, selectedRoles);
  }

  function openImagePreview(image: RoleImage) {
    setPreviewImage(image);
    setImagePreviewState(DEFAULT_ROLE_IMAGE_PREVIEW_STATE);
    setImageDragOrigin(null);
  }

  function closeImagePreview() {
    setPreviewImage(null);
    setImagePreviewState(DEFAULT_ROLE_IMAGE_PREVIEW_STATE);
    setImageDragOrigin(null);
  }

  function updatePreviewScale(delta: number) {
    setImagePreviewState((currentState) => ({
      ...currentState,
      scale: Math.min(2.5, Math.max(0.5, Number((currentState.scale + delta).toFixed(2)))),
    }));
  }

  function rotatePreview(delta: number) {
    setImagePreviewState((currentState) => ({
      ...currentState,
      rotation: currentState.rotation + delta,
    }));
  }

  function resetImagePreview() {
    setImagePreviewState(DEFAULT_ROLE_IMAGE_PREVIEW_STATE);
    setImageDragOrigin(null);
  }

  function startImageDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setImageDragOrigin({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: imagePreviewState.offsetX,
      offsetY: imagePreviewState.offsetY,
    });
  }

  function updateImageDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageDragOrigin || imageDragOrigin.pointerId !== event.pointerId) {
      return;
    }

    setImagePreviewState((currentState) => ({
      ...currentState,
      offsetX: imageDragOrigin.offsetX + event.clientX - imageDragOrigin.startX,
      offsetY: imageDragOrigin.offsetY + event.clientY - imageDragOrigin.startY,
    }));
  }

  function stopImageDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (!imageDragOrigin || imageDragOrigin.pointerId !== event.pointerId) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    setImageDragOrigin(null);
  }

  function openRoleDialog(mode: Exclude<RoleDialogMode, null>, record: RoleRecord) {
    setActiveRoleKey(getRoleKey(record));
    setRoleDialogMode(mode);

    if (mode === "edit") {
      setEditForm(createRoleEditForm(record));
    }
  }

  function closeRoleDialog() {
    setRoleDialogMode(null);
    setActiveRoleKey(null);
  }

  function updateEditForm<Key extends keyof RoleEditForm>(key: Key, value: RoleEditForm[Key]) {
    setEditForm((current) => ({ ...current, [key]: value }));
  }

  function handleRoleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeRole || !activeRoleKey) {
      return;
    }

    const memberCount = typeof editForm.memberCount === "number" ? editForm.memberCount : getRoleMemberCount(activeRole);
    const nextRecord: RoleRecord = {
      ...activeRole,
      title: editForm.title.trim() || activeRole.title,
      description: editForm.description.trim() || activeRole.description,
      meta: `${memberCount} 位成员`,
      owner: editForm.owner,
      status: editForm.status,
      tone: getRoleToneByStatus(editForm.status),
      updated: "今天",
    };
    const nextRoleKey = getRoleKey(nextRecord);

    setRecords((current) => current.map((record) => (getRoleKey(record) === activeRoleKey ? nextRecord : record)));
    setSelectedRoleKeys((current) =>
      current.map((roleKey) => (roleKey === activeRoleKey ? nextRoleKey : roleKey)),
    );
    closeRoleDialog();
  }

  function handleRoleDeleteConfirm() {
    if (!activeRoleKey) {
      return;
    }

    setRecords((current) => current.filter((record) => getRoleKey(record) !== activeRoleKey));
    setSelectedRoleKeys((current) => current.filter((roleKey) => roleKey !== activeRoleKey));
    closeRoleDialog();
  }

  function openBatchDeleteDialog() {
    if (selectedRoleCount === 0) {
      return;
    }

    setBatchActionMenuOpen(false);
    setActiveRoleKey(null);
    setRoleDialogMode("batchDelete");
  }

  function handleRoleBatchDeleteConfirm() {
    if (selectedRoleCount === 0) {
      closeRoleDialog();
      return;
    }

    const roleKeysToDelete = new Set(selectedRoleKeys);

    setRecords((current) => current.filter((record) => !roleKeysToDelete.has(getRoleKey(record))));
    setSelectedRoleKeys([]);
    closeRoleDialog();
  }

  return (
    <div className="role-page">
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
          <div className="table-toolbar-actions">
            <button
              className="filter-btn table-icon-btn"
              type="button"
              aria-label="导出为 Excel"
              title="导出为 Excel"
              onClick={handleExportCurrentPageRoles}
            >
              <Download size={14} strokeWidth={2.2} />
            </button>

            <div className="field-control" ref={fieldMenuRef}>
              <button
                className={`filter-btn field-trigger ${fieldMenuOpen ? "active" : ""}`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={fieldMenuOpen}
                onClick={() => {
                  setFieldMenuOpen((open) => !open);
                  setTableConfigOpen(false);
                }}
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

            <div className="field-control" ref={tableConfigRef}>
              <button
                className={`filter-btn field-trigger ${tableConfigOpen ? "active" : ""}`}
                type="button"
                aria-haspopup="menu"
                aria-expanded={tableConfigOpen}
                onClick={() => {
                  setTableConfigOpen((open) => !open);
                  setFieldMenuOpen(false);
                }}
              >
                <Settings size={13} strokeWidth={2.2} />
                表格配置
                <ChevronDown size={11} strokeWidth={2.2} />
              </button>
              {tableConfigOpen ? (
                <div className="field-popover table-config-popover" role="menu" aria-label="表格配置">
                  <label className="field-option table-config-option">
                    <input
                      type="checkbox"
                      checked={tableDisplayConfig.bordered}
                      onChange={() => toggleTableDisplayConfig("bordered")}
                    />
                    <span className="field-checkbox" aria-hidden="true">
                      {tableDisplayConfig.bordered ? <Check size={11} strokeWidth={2.5} /> : null}
                    </span>
                    <span>
                      <strong>显示边框</strong>
                      <small>显示完整表格网格线</small>
                    </span>
                  </label>
                  <label className="field-option table-config-option">
                    <input
                      type="checkbox"
                      checked={tableDisplayConfig.striped}
                      onChange={() => toggleTableDisplayConfig("striped")}
                    />
                    <span className="field-checkbox" aria-hidden="true">
                      {tableDisplayConfig.striped ? <Check size={11} strokeWidth={2.5} /> : null}
                    </span>
                    <span>
                      <strong>斑马纹</strong>
                      <small>隔行增加浅色背景</small>
                    </span>
                  </label>
                  <label className="field-option table-config-option">
                    <input
                      type="checkbox"
                      checked={tableDisplayConfig.compact}
                      onChange={() => toggleTableDisplayConfig("compact")}
                    />
                    <span className="field-checkbox" aria-hidden="true">
                      {tableDisplayConfig.compact ? <Check size={11} strokeWidth={2.5} /> : null}
                    </span>
                    <span>
                      <strong>紧凑行高</strong>
                      <small>降低单行纵向留白</small>
                    </span>
                  </label>
                  <label className="field-option table-config-option">
                    <input
                      type="checkbox"
                      checked={tableDisplayConfig.hoverable}
                      onChange={() => toggleTableDisplayConfig("hoverable")}
                    />
                    <span className="field-checkbox" aria-hidden="true">
                      {tableDisplayConfig.hoverable ? <Check size={11} strokeWidth={2.5} /> : null}
                    </span>
                    <span>
                      <strong>悬停高亮</strong>
                      <small>鼠标移入时高亮当前行</small>
                    </span>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`table-scroll ${roleActionsPinned ? "has-fixed-actions" : ""}`} ref={tableScrollRef}>
          <table className={tableClassName}>
            <thead>
              <tr>
                <th className="role-selection-column">
                  <TableSelectionCheckbox
                    ariaLabel="选择当前页角色"
                    checked={allPagedRolesSelected}
                    disabled={pagedRoleKeys.length === 0}
                    indeterminate={hasPartialPagedRoleSelection}
                    inputRef={allRolesCheckboxRef}
                    onChange={togglePagedRoleSelection}
                  />
                </th>
                {visibleRoleColumns.image ? <th className="role-image-column">头像</th> : null}
                <th className="role-name-column">角色名称</th>
                {roleDisplayFields.map((field) =>
                  field.id !== "image" && visibleRoleColumns[field.id] ? <th key={field.id}>{field.label}</th> : null,
                )}
                <th className="role-actions-column">操作</th>
              </tr>
            </thead>
            <tbody>
              {pagedRoles.map((record) => {
                const roleKey = getRoleKey(record);
                const roleSelected = selectedRoleKeySet.has(roleKey);

                return (
                  <tr key={roleKey}>
                    <td className="role-selection-column">
                      <TableSelectionCheckbox
                        ariaLabel={`选择角色 ${record.title}`}
                        checked={roleSelected}
                        onChange={() => toggleRoleSelection(roleKey)}
                      />
                    </td>
                    {visibleRoleColumns.image ? (
                      <td className="role-image-column">{renderRoleColumnValue("image", record, openImagePreview)}</td>
                    ) : null}
                    <td className="role-name-column">
                      <div className="table-main-cell">
                        <strong>{record.title}</strong>
                        <span>{record.description}</span>
                      </div>
                    </td>
                    {roleDisplayFields.map((field) =>
                      field.id !== "image" && visibleRoleColumns[field.id] ? (
                        <td key={field.id}>{renderRoleColumnValue(field.id, record)}</td>
                      ) : null,
                    )}
                    <td className="role-actions-column">
                      <div className="table-actions">
                        <button type="button" onClick={() => openRoleDialog("detail", record)}>
                          查看
                        </button>
                        <button type="button" onClick={() => openRoleDialog("edit", record)}>
                          编辑
                        </button>
                        <button className="danger" type="button" onClick={() => openRoleDialog("delete", record)}>
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          <div className="table-footer-meta">
            {selectedRoleCount > 0 ? (
              <div className="table-selected-actions">
                <span className="table-selected-count">已选 {selectedRoleCount} 条</span>
                <div className="batch-action-control" ref={batchActionRef}>
                  <button
                    className={`table-batch-action ${batchActionMenuOpen ? "active" : ""}`}
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={batchActionMenuOpen}
                    onClick={() => setBatchActionMenuOpen((open) => !open)}
                  >
                    操作
                    {batchActionMenuOpen ? (
                      <ChevronDown size={11} strokeWidth={2.2} />
                    ) : (
                      <ChevronUp size={11} strokeWidth={2.2} />
                    )}
                  </button>
                  {batchActionMenuOpen ? (
                    <div className="batch-action-popover" role="menu" aria-label="批量操作">
                      <button className="batch-action-option danger" type="button" role="menuitem" onClick={openBatchDeleteDialog}>
                        <Trash2 size={13} strokeWidth={2.2} />
                        批量删除
                      </button>
                      <button className="batch-action-option" type="button" role="menuitem" onClick={handleExportSelectedRoles}>
                        <Download size={13} strokeWidth={2.2} />
                        导出表格
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
            <span>共 {filteredRoles.length} 条</span>
            <div className="table-page-size">
              <LonSelect
                ariaLabel="选择单页显示条数"
                value={String(pageSize)}
                options={rolePageSizeOptions}
                onValueChange={handlePageSizeChange}
              />
            </div>
          </div>
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

      {activeRole ? (
        <LonModal
          open={roleDialogMode === "detail"}
          title="详情"
          description="查看当前记录的基础信息与维护数据。"
          size="large"
          onClose={closeRoleDialog}
          footer={
            <LonButton variant="secondary" onClick={closeRoleDialog}>
              关闭
            </LonButton>
          }
        >
          <div className="record-detail-list">
            {getRoleDetailItems(activeRole, openImagePreview).map((item) => (
              <div className="record-detail-row" key={item.label}>
                <span className="record-detail-label">{item.label}</span>
                <div className="record-detail-value">{item.value}</div>
              </div>
            ))}
          </div>
        </LonModal>
      ) : null}

      {activeRole ? (
        <LonDrawer
          open={roleDialogMode === "edit"}
          title="编辑"
          description="调整当前记录的基础信息，保存后会同步更新演示表格。"
          size="large"
          onClose={closeRoleDialog}
          footer={
            <>
              <LonButton variant="secondary" onClick={closeRoleDialog}>
                取消
              </LonButton>
              <LonButton form="role-edit-form" type="submit">
                保存
              </LonButton>
            </>
          }
        >
          <form className="role-edit-form" id="role-edit-form" onSubmit={handleRoleEditSubmit}>
            <LonInput
              label="角色名称"
              value={editForm.title}
              required
              onChange={(event) => updateEditForm("title", event.target.value)}
            />
            <LonNumberInput
              label="成员数"
              value={editForm.memberCount}
              min={0}
              max={999}
              onValueChange={(value) => updateEditForm("memberCount", value)}
            />
            <LonSelect
              label="所属组织"
              value={editForm.owner}
              options={ownerEditOptions}
              onValueChange={(value) => updateEditForm("owner", value)}
            />
            <LonSelect
              label="状态"
              value={editForm.status}
              options={statusEditOptions}
              onValueChange={(value) => updateEditForm("status", value)}
            />
            <label className="role-textarea-field">
              <span className="lon-form-label">角色描述</span>
              <textarea
                value={editForm.description}
                rows={4}
                required
                onChange={(event) => updateEditForm("description", event.target.value)}
              />
            </label>
          </form>
        </LonDrawer>
      ) : null}

      {activeRole ? (
        <LonModal
          open={roleDialogMode === "delete"}
          title="删除角色"
          description="删除后当前演示列表将不再显示该角色。"
          size="small"
          onClose={closeRoleDialog}
          footer={
            <>
              <LonButton variant="secondary" onClick={closeRoleDialog}>
                取消
              </LonButton>
              <LonButton variant="danger" onClick={handleRoleDeleteConfirm}>
                确认删除
              </LonButton>
            </>
          }
        >
          <div className="role-delete-copy">
            确定要删除 <strong>{activeRole.title}</strong> 吗？
          </div>
        </LonModal>
      ) : null}

      <LonModal
        open={roleDialogMode === "batchDelete"}
        title="批量删除角色"
        description="删除后当前演示列表将不再显示这些角色。"
        size="small"
        onClose={closeRoleDialog}
        footer={
          <>
            <LonButton variant="secondary" onClick={closeRoleDialog}>
              取消
            </LonButton>
            <LonButton variant="danger" onClick={handleRoleBatchDeleteConfirm}>
              确认删除
            </LonButton>
          </>
        }
      >
        <div className="role-delete-copy">
          确定要删除已选的 <strong>{selectedRoleCount}</strong> 个角色吗？
        </div>
      </LonModal>

      <LonModal
        open={Boolean(previewImage)}
        title={previewImage?.title ?? "图片预览"}
        description={previewImage?.meta}
        size="large"
        onClose={closeImagePreview}
        footer={
          <div className="image-preview-toolbar" aria-label="图片预览操作">
            <button
              aria-label="缩小图片"
              className="image-preview-tool"
              disabled={imagePreviewState.scale <= 0.5}
              title="缩小"
              type="button"
              onClick={() => updatePreviewScale(-0.25)}
            >
              <ZoomOut size={15} strokeWidth={2.2} />
            </button>
            <span className="image-preview-scale">{Math.round(imagePreviewState.scale * 100)}%</span>
            <button
              aria-label="放大图片"
              className="image-preview-tool"
              disabled={imagePreviewState.scale >= 2.5}
              title="放大"
              type="button"
              onClick={() => updatePreviewScale(0.25)}
            >
              <ZoomIn size={15} strokeWidth={2.2} />
            </button>
            <span className="image-preview-divider" aria-hidden="true" />
            <button
              aria-label="向左旋转"
              className="image-preview-tool"
              title="向左旋转"
              type="button"
              onClick={() => rotatePreview(-90)}
            >
              <RotateCcw size={15} strokeWidth={2.2} />
            </button>
            <button
              aria-label="向右旋转"
              className="image-preview-tool"
              title="向右旋转"
              type="button"
              onClick={() => rotatePreview(90)}
            >
              <RotateCw size={15} strokeWidth={2.2} />
            </button>
            <span className="image-preview-divider" aria-hidden="true" />
            <button
              aria-label="重置图片"
              className="image-preview-tool"
              title="重置"
              type="button"
              onClick={resetImagePreview}
            >
              <RefreshCw size={15} strokeWidth={2.2} />
            </button>
          </div>
        }
      >
        {previewImage ? (
          <div
            className={`image-preview-stage ${imageDragOrigin ? "is-dragging" : ""}`}
            onPointerDown={startImageDrag}
            onPointerMove={updateImageDrag}
            onPointerUp={stopImageDrag}
            onPointerCancel={stopImageDrag}
          >
            <img
              alt={previewImage.title}
              className="image-preview-media"
              src={previewImage.src}
              style={{
                transform: `translate(${imagePreviewState.offsetX}px, ${imagePreviewState.offsetY}px) scale(${imagePreviewState.scale}) rotate(${imagePreviewState.rotation}deg)`,
              }}
            />
          </div>
        ) : null}
      </LonModal>
    </div>
  );
}

function TableSelectionCheckbox({
  ariaLabel,
  checked,
  disabled,
  indeterminate = false,
  inputRef,
  onChange,
}: {
  ariaLabel: string;
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  inputRef?: Ref<HTMLInputElement>;
  onChange: () => void;
}) {
  return (
    <label className={`table-selection-control ${disabled ? "disabled" : ""}`}>
      <input
        ref={inputRef}
        type="checkbox"
        aria-label={ariaLabel}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className={`table-selection-box ${indeterminate ? "indeterminate" : ""}`} aria-hidden="true">
        {checked ? <Check size={11} strokeWidth={2.6} /> : null}
        {indeterminate ? <span className="table-selection-dash" /> : null}
      </span>
    </label>
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

export default RoleManagementPage;
