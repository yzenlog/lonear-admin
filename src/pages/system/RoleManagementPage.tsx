import { useEffect, useMemo, useRef, useState } from "react";
import type {
  Dispatch,
  FormEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  Ref,
  SetStateAction,
} from "react";
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
import { DataTablePanel, SearchFormPanel, SearchTablePage } from "../../components/shared/search-table";
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
const DEFAULT_ROLE_OWNER = "运营中心";
const DEFAULT_ROLE_STATUS = "启用";
const ROLE_OWNER_OPTIONS = ["系统内置", "运营中心", "风控部", "项目组", "财务部", "市场部", "数据中心"] as const;
const ROLE_STATUS_OPTIONS = ["启用", "只读", "待复核", "停用"] as const;
const ROLE_IMAGE_ASSETS = [
  { title: "测试图片 1", src: "/images/avatars/avatar-1.jpeg", meta: "152 x 152 · JPEG" },
  { title: "测试图片 2", src: "/images/avatars/avatar-2.png", meta: "990 x 798 · PNG" },
] as const;
const ROLE_BALANCE_AMOUNTS = [
  128600, 96320, 18200, 35680, 74250, 109800, 58640, 92700, 136500, 88420, 61400, 26800, 19650, 45230,
] as const;
const ROLE_UPDATED_AT_MAP: Record<string, string> = {
  今天: "2026-06-22 14:36:18",
  昨天: "2026-06-21 18:12:44",
  "2 天前": "2026-06-20 11:05:31",
  "3 天前": "2026-06-19 09:47:18",
  上周: "2026-06-15 16:20:09",
};
const roleCurrencyFormatter = new Intl.NumberFormat("zh-CN", {
  currency: "CNY",
  minimumFractionDigits: 2,
  style: "currency",
});
const roleDisplayFields = [
  { id: "image", label: "头像" },
  { id: "members", label: "成员" },
  { id: "roleType", label: "角色类型" },
  { id: "owner", label: "所属组织" },
  { id: "balance", label: "余额" },
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
type RoleRecordMetadata = {
  createdAt?: string;
  lastOperator?: string;
  permissionCount?: number;
  updatedAt?: string;
};
type RoleComputedRecord = ManagementRecord & RoleRecordMetadata;
type RoleRecord = RoleComputedRecord & { balance: number; id: string; image: RoleImage };
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
type RoleDialogMode = "create" | "detail" | "edit" | "delete" | "batchDelete" | null;
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
type RoleTableSummaryItem = {
  fieldId: RoleDisplayField;
  getValue: (records: RoleRecord[]) => string;
};
type RoleTableColumnWidths = Record<RoleDisplayField, number> & {
  actions: number;
  name: number;
  selection: number;
};
type RoleSortKey = "name" | RoleDisplayField;
type RoleSortDirection = "asc" | "desc";
type RoleSortState = {
  direction: RoleSortDirection;
  key: RoleSortKey;
} | null;
type RoleSortValue = number | string;
type RoleTableSortConfig = {
  enabled: boolean;
  getValue: (record: RoleRecord) => RoleSortValue;
};
type RoleFilterChangeHandler = (key: keyof RoleFilters, value: string) => void;
type RoleSearchFormProps = {
  draftFilters: RoleFilters;
  memberSizeOptions: SearchSelectOption[];
  onFilterChange: RoleFilterChangeHandler;
  onReset: () => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onToggleExpanded: () => void;
  ownerFilterOptions: SearchSelectOption[];
  roleTypeOptions: SearchSelectOption[];
  searchExpanded: boolean;
  statusFilterOptions: SearchSelectOption[];
  updatedRangeOptions: SearchSelectOption[];
};
type RoleTablePanelProps = {
  allPagedRolesSelected: boolean;
  batchActionMenuOpen: boolean;
  batchActionRef: Ref<HTMLDivElement>;
  currentPage: number;
  fieldMenuOpen: boolean;
  fieldMenuRef: Ref<HTMLDivElement>;
  filteredRoleCount: number;
  isRefreshing: boolean;
  onBatchActionMenuOpenChange: Dispatch<SetStateAction<boolean>>;
  onExportCurrentPageRoles: () => void;
  onExportSelectedRoles: () => void;
  onImagePreviewOpen: (image: RoleImage) => void;
  onOpenBatchDeleteDialog: () => void;
  onOpenCreateRoleDialog: () => void;
  onOpenRoleDialog: (mode: Exclude<RoleDialogMode, "create" | null>, record: RoleRecord) => void;
  onPageChange: Dispatch<SetStateAction<number>>;
  onPageSizeChange: (value: string) => void;
  onPagedRoleSelectionToggle: () => void;
  onRefreshRoles: () => void;
  onRoleSelectionToggle: (roleKey: string) => void;
  onRoleSort: (sortKey: RoleSortKey) => void;
  onRoleColumnToggle: (fieldId: RoleDisplayField) => void;
  onTableConfigToggle: (key: keyof TableDisplayConfig) => void;
  pageSize: number;
  pagedRoleKeys: string[];
  pagedRoles: RoleRecord[];
  roleSortState: RoleSortState;
  roleTableMinWidth: number;
  selectedRoleCount: number;
  selectedRoleKeySet: Set<string>;
  tableClassName: string;
  tableConfigOpen: boolean;
  tableConfigRef: Ref<HTMLDivElement>;
  tableDisplayConfig: TableDisplayConfig;
  tableScrollClassName: string;
  tableScrollRef: Ref<HTMLDivElement>;
  tableSummaryScrollClassName: string;
  tableSummaryScrollRef: Ref<HTMLDivElement>;
  tableSummaryValueMap: Map<RoleDisplayField, string>;
  totalPages: number;
  visibleRoleColumns: Record<RoleDisplayField, boolean>;
  visibleTableColumnCount: number;
  onFieldMenuOpenChange: Dispatch<SetStateAction<boolean>>;
  onTableConfigOpenChange: Dispatch<SetStateAction<boolean>>;
};

const DEFAULT_VISIBLE_ROLE_COLUMNS: Record<RoleDisplayField, boolean> = {
  image: true,
  members: true,
  roleType: true,
  owner: true,
  balance: true,
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
const ROLE_TABLE_PREFERENCES_STORAGE_KEY = "lonear-admin:role-management:table-preferences";
const DEFAULT_ROLE_IMAGE_PREVIEW_STATE: RoleImagePreviewState = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
};
const roleTableSummaryItems: RoleTableSummaryItem[] = [
  {
    fieldId: "balance",
    getValue: (records) => formatRoleBalance(records.reduce((sum, record) => sum + record.balance, 0)),
  },
];
const ROLE_TABLE_COLUMN_WIDTHS: RoleTableColumnWidths = {
  selection: 82,
  image: 88,
  name: 300,
  members: 92,
  roleType: 112,
  owner: 144,
  balance: 132,
  dataScope: 132,
  permissionCount: 96,
  memberLimit: 104,
  status: 92,
  updated: 168,
  lastOperator: 120,
  createdAt: 168,
  actions: 156,
};
type RoleTablePreferences = {
  pageSize: number;
  tableDisplayConfig: TableDisplayConfig;
  visibleRoleColumns: Record<RoleDisplayField, boolean>;
};

function createDefaultRoleTablePreferences(): RoleTablePreferences {
  return {
    pageSize: DEFAULT_ROLE_PAGE_SIZE,
    tableDisplayConfig: DEFAULT_TABLE_DISPLAY_CONFIG,
    visibleRoleColumns: DEFAULT_VISIBLE_ROLE_COLUMNS,
  };
}

function isRolePageSize(value: unknown): value is (typeof ROLE_PAGE_SIZE_OPTIONS)[number] {
  return (
    typeof value === "number" &&
    ROLE_PAGE_SIZE_OPTIONS.includes(value as (typeof ROLE_PAGE_SIZE_OPTIONS)[number])
  );
}

function parseVisibleRoleColumns(value: unknown) {
  const nextColumns = { ...DEFAULT_VISIBLE_ROLE_COLUMNS };

  if (!value || typeof value !== "object") {
    return nextColumns;
  }

  roleDisplayFields.forEach((field) => {
    const nextValue = (value as Partial<Record<RoleDisplayField, unknown>>)[field.id];

    if (typeof nextValue === "boolean") {
      nextColumns[field.id] = nextValue;
    }
  });

  return nextColumns;
}

function parseTableDisplayConfig(value: unknown) {
  const nextConfig = { ...DEFAULT_TABLE_DISPLAY_CONFIG };

  if (!value || typeof value !== "object") {
    return nextConfig;
  }

  (Object.keys(DEFAULT_TABLE_DISPLAY_CONFIG) as Array<keyof TableDisplayConfig>).forEach((key) => {
    const nextValue = (value as Partial<Record<keyof TableDisplayConfig, unknown>>)[key];

    if (typeof nextValue === "boolean") {
      nextConfig[key] = nextValue;
    }
  });

  return nextConfig;
}

function readRoleTablePreferences(): RoleTablePreferences {
  const fallbackPreferences = createDefaultRoleTablePreferences();

  if (typeof window === "undefined") {
    return fallbackPreferences;
  }

  try {
    const rawPreferences = window.localStorage.getItem(ROLE_TABLE_PREFERENCES_STORAGE_KEY);

    if (!rawPreferences) {
      return fallbackPreferences;
    }

    const parsedPreferences = JSON.parse(rawPreferences) as Partial<RoleTablePreferences>;

    return {
      pageSize: isRolePageSize(parsedPreferences.pageSize) ? parsedPreferences.pageSize : DEFAULT_ROLE_PAGE_SIZE,
      tableDisplayConfig: parseTableDisplayConfig(parsedPreferences.tableDisplayConfig),
      visibleRoleColumns: parseVisibleRoleColumns(parsedPreferences.visibleRoleColumns),
    };
  } catch {
    return fallbackPreferences;
  }
}

function saveRoleTablePreferences(preferences: RoleTablePreferences) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ROLE_TABLE_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Ignore storage failures so private mode or quota limits do not break table interactions.
  }
}

function getRoleMemberCount(record: ManagementRecord) {
  return Number.parseInt(record.meta, 10) || 0;
}

function formatRoleBalance(balance: number) {
  return roleCurrencyFormatter.format(balance);
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

function getRolePermissionCount(record: RoleComputedRecord) {
  if (typeof record.permissionCount === "number") {
    return `${record.permissionCount} 项`;
  }

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

function getRoleLastOperator(record: RoleComputedRecord) {
  if (record.lastOperator) {
    return record.lastOperator;
  }

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

function getRoleCreatedAt(record: RoleComputedRecord) {
  if (record.createdAt) {
    return record.createdAt;
  }

  if (record.owner === "系统内置") {
    return "2024-01-08 09:18:36";
  }

  if (record.owner === "运营中心") {
    return "2024-03-18 10:42:09";
  }

  if (record.owner === "风控部") {
    return "2024-05-26 16:28:45";
  }

  return "2025-01-14 13:06:22";
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

function getRoleUpdatedSortValue(record: RoleComputedRecord) {
  return Date.parse(getRoleUpdatedAt(record).replace(" ", "T"));
}

function getRoleCreatedSortValue(record: RoleComputedRecord) {
  return Date.parse(getRoleCreatedAt(record).replace(" ", "T"));
}

function getRoleUpdatedAt(record: RoleComputedRecord) {
  return record.updatedAt ?? ROLE_UPDATED_AT_MAP[record.updated] ?? record.updated;
}

function getRoleKey(record: RoleRecord) {
  return record.id;
}

const ROLE_TABLE_SORT_CONFIG: Record<RoleSortKey, RoleTableSortConfig> = {
  name: {
    enabled: true,
    getValue: (record) => record.title,
  },
  image: {
    enabled: false,
    getValue: (record) => record.image.title,
  },
  members: {
    enabled: true,
    getValue: (record) => getRoleMemberCount(record),
  },
  roleType: {
    enabled: false,
    getValue: (record) => getRoleTypeLabel(record),
  },
  owner: {
    enabled: true,
    getValue: (record) => record.owner,
  },
  balance: {
    enabled: true,
    getValue: (record) => record.balance,
  },
  dataScope: {
    enabled: false,
    getValue: (record) => getRoleDataScope(record),
  },
  permissionCount: {
    enabled: true,
    getValue: (record) => Number.parseInt(getRolePermissionCount(record), 10),
  },
  memberLimit: {
    enabled: false,
    getValue: (record) => {
      const limit = getRoleMemberLimit(record);

      return limit === "不限" ? Number.MAX_SAFE_INTEGER : Number.parseInt(limit, 10);
    },
  },
  status: {
    enabled: true,
    getValue: (record) => record.status,
  },
  updated: {
    enabled: true,
    getValue: (record) => getRoleUpdatedSortValue(record),
  },
  lastOperator: {
    enabled: false,
    getValue: (record) => getRoleLastOperator(record),
  },
  createdAt: {
    enabled: true,
    getValue: (record) => getRoleCreatedSortValue(record),
  },
};

function compareRoleSortValues(left: RoleSortValue, right: RoleSortValue) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  return String(left).localeCompare(String(right), "zh-CN", {
    numeric: true,
    sensitivity: "base",
  });
}

function sortRoleRecords(records: RoleRecord[], sortState: RoleSortState) {
  if (!sortState) {
    return records;
  }

  const sortConfig = ROLE_TABLE_SORT_CONFIG[sortState.key];

  if (!sortConfig.enabled) {
    return records;
  }

  const directionMultiplier = sortState.direction === "asc" ? 1 : -1;

  return records
    .map((record, index) => ({ index, record }))
    .sort((left, right) => {
      const result = compareRoleSortValues(sortConfig.getValue(left.record), sortConfig.getValue(right.record));

      return result === 0 ? left.index - right.index : result * directionMultiplier;
    })
    .map(({ record }) => record);
}

function createRoleRecords(records: ManagementRecord[]): RoleRecord[] {
  return records.map((record, index) => ({
    ...record,
    balance: ROLE_BALANCE_AMOUNTS[index % ROLE_BALANCE_AMOUNTS.length],
    id: `role-${index + 1}`,
    image: ROLE_IMAGE_ASSETS[index % ROLE_IMAGE_ASSETS.length],
  }));
}

function getRoleTableMinWidth(visibleRoleColumns: Record<RoleDisplayField, boolean>) {
  return (
    ROLE_TABLE_COLUMN_WIDTHS.selection +
    ROLE_TABLE_COLUMN_WIDTHS.name +
    ROLE_TABLE_COLUMN_WIDTHS.actions +
    roleDisplayFields.reduce(
      (width, field) => width + (visibleRoleColumns[field.id] ? ROLE_TABLE_COLUMN_WIDTHS[field.id] : 0),
      0,
    )
  );
}

function RoleTableColGroup({ visibleRoleColumns }: { visibleRoleColumns: Record<RoleDisplayField, boolean> }) {
  return (
    <colgroup>
      <col style={{ width: ROLE_TABLE_COLUMN_WIDTHS.selection }} />
      {visibleRoleColumns.image ? <col style={{ width: ROLE_TABLE_COLUMN_WIDTHS.image }} /> : null}
      <col style={{ width: ROLE_TABLE_COLUMN_WIDTHS.name }} />
      {roleDisplayFields.map((field) =>
        field.id !== "image" && visibleRoleColumns[field.id] ? (
          <col key={field.id} style={{ width: ROLE_TABLE_COLUMN_WIDTHS[field.id] }} />
        ) : null,
      )}
      <col style={{ width: ROLE_TABLE_COLUMN_WIDTHS.actions }} />
    </colgroup>
  );
}

function RoleSortableHeader({
  className,
  label,
  onSort,
  sortKey,
  sortState,
}: {
  className?: string;
  label: string;
  onSort: (sortKey: RoleSortKey) => void;
  sortKey: RoleSortKey;
  sortState: RoleSortState;
}) {
  const sortConfig = ROLE_TABLE_SORT_CONFIG[sortKey];
  const active = sortState?.key === sortKey;
  const ariaSort = active ? (sortState.direction === "asc" ? "ascending" : "descending") : "none";

  if (!sortConfig.enabled) {
    return <th className={className}>{label}</th>;
  }

  return (
    <th className={className} aria-sort={ariaSort}>
      <button
        className={`table-sort-trigger ${active ? "active" : ""}`}
        type="button"
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <span
          className={`table-sort-icon ${active ? `is-${sortState.direction}` : ""}`}
          aria-hidden="true"
        >
          <ChevronUp size={10} strokeWidth={2.4} />
          <ChevronDown size={10} strokeWidth={2.4} />
        </span>
      </button>
    </th>
  );
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

function createEmptyRoleForm(): RoleEditForm {
  return {
    title: "",
    description: "",
    owner: DEFAULT_ROLE_OWNER,
    status: DEFAULT_ROLE_STATUS,
    memberCount: 0,
  };
}

function formatRoleDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    " ",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
    ":",
    pad(date.getSeconds()),
  ].join("");
}

function createRoleRecordId() {
  return `role-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createRoleRecordFromForm(form: RoleEditForm, recordIndex: number): RoleRecord {
  const memberCount = typeof form.memberCount === "number" ? form.memberCount : 0;
  const now = formatRoleDateTime(new Date());

  return {
    id: createRoleRecordId(),
    title: form.title.trim(),
    description: form.description.trim(),
    meta: `${memberCount} 位成员`,
    owner: form.owner,
    status: form.status,
    tone: getRoleToneByStatus(form.status),
    updated: "今天",
    balance: 0,
    createdAt: now,
    image: ROLE_IMAGE_ASSETS[recordIndex % ROLE_IMAGE_ASSETS.length],
    lastOperator: "当前用户",
    permissionCount: 0,
    updatedAt: now,
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

  if (fieldId === "balance") {
    return formatRoleBalance(record.balance);
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
    return <span className="muted-text">{getRoleUpdatedAt(record)}</span>;
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

  if (fieldId === "balance") {
    return formatRoleBalance(record.balance);
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
    return getRoleUpdatedAt(record);
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

function getRoleFieldColumnClassName(fieldId: RoleDisplayField) {
  return fieldId === "balance" ? "role-balance-column" : undefined;
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

function RoleSearchForm({
  draftFilters,
  memberSizeOptions,
  onFilterChange,
  onReset,
  onSearch,
  onToggleExpanded,
  ownerFilterOptions,
  roleTypeOptions,
  searchExpanded,
  statusFilterOptions,
  updatedRangeOptions,
}: RoleSearchFormProps) {
  return (
    <SearchFormPanel
      expanded={searchExpanded}
      onSubmit={onSearch}
      actions={
        <>
          <button className="btn-secondary" type="button" onClick={onReset}>
            <X size={13} strokeWidth={2.1} />
            重置
          </button>
          <button className="btn-primary form-submit" type="submit">
            <Search size={13} strokeWidth={2.3} />
            查询
          </button>
          <button className={`expand-btn ${searchExpanded ? "active" : ""}`} type="button" onClick={onToggleExpanded}>
            {searchExpanded ? "收起" : "展开"}
            <ChevronDown size={13} strokeWidth={2.1} />
          </button>
        </>
      }
    >
      <label className="form-field">
        <span>角色名称</span>
        <input
          value={draftFilters.keyword}
          onChange={(event) => onFilterChange("keyword", event.target.value)}
          placeholder="请输入角色名称 / 描述"
        />
      </label>

      <div className="form-field">
        <span>状态</span>
        <SearchSelect
          ariaLabel="选择角色状态"
          options={statusFilterOptions}
          value={draftFilters.status}
          onChange={(value) => onFilterChange("status", value)}
        />
      </div>

      <div className="form-field">
        <span>所属组织</span>
        <SearchSelect
          ariaLabel="选择所属组织"
          options={ownerFilterOptions}
          value={draftFilters.owner}
          onChange={(value) => onFilterChange("owner", value)}
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
              onChange={(value) => onFilterChange("roleType", value)}
            />
          </div>

          <div className="form-field">
            <span>成员规模</span>
            <SearchSelect
              ariaLabel="选择成员规模"
              options={memberSizeOptions}
              value={draftFilters.memberSize}
              onChange={(value) => onFilterChange("memberSize", value)}
            />
          </div>

          <div className="form-field">
            <span>更新时间</span>
            <SearchSelect
              ariaLabel="选择更新时间"
              options={updatedRangeOptions}
              value={draftFilters.updatedRange}
              onChange={(value) => onFilterChange("updatedRange", value)}
            />
          </div>
        </>
      ) : null}
    </SearchFormPanel>
  );
}

function RoleTablePanel({
  allPagedRolesSelected,
  batchActionMenuOpen,
  batchActionRef,
  currentPage,
  fieldMenuOpen,
  fieldMenuRef,
  filteredRoleCount,
  isRefreshing,
  onBatchActionMenuOpenChange,
  onExportCurrentPageRoles,
  onExportSelectedRoles,
  onFieldMenuOpenChange,
  onImagePreviewOpen,
  onOpenBatchDeleteDialog,
  onOpenCreateRoleDialog,
  onOpenRoleDialog,
  onPageChange,
  onPageSizeChange,
  onPagedRoleSelectionToggle,
  onRefreshRoles,
  onRoleColumnToggle,
  onRoleSelectionToggle,
  onRoleSort,
  onTableConfigOpenChange,
  onTableConfigToggle,
  pageSize,
  pagedRoleKeys,
  pagedRoles,
  roleSortState,
  roleTableMinWidth,
  selectedRoleCount,
  selectedRoleKeySet,
  tableClassName,
  tableConfigOpen,
  tableConfigRef,
  tableDisplayConfig,
  tableScrollClassName,
  tableScrollRef,
  tableSummaryScrollClassName,
  tableSummaryScrollRef,
  tableSummaryValueMap,
  totalPages,
  visibleRoleColumns,
  visibleTableColumnCount,
}: RoleTablePanelProps) {
  return (
    <DataTablePanel
      loading={isRefreshing}
      toolbar={
        <>
        <button
          className="btn-primary table-create-btn"
          type="button"
          disabled={isRefreshing}
          onClick={onOpenCreateRoleDialog}
        >
          <Plus size={13} strokeWidth={2.3} />
          {moduleMeta.roles.action}
        </button>
        <div className="table-toolbar-actions">
          <button
            className={`filter-btn table-icon-btn table-refresh-btn ${isRefreshing ? "is-loading" : ""}`}
            type="button"
            aria-label={isRefreshing ? "正在刷新列表" : "刷新列表"}
            title={isRefreshing ? "正在刷新" : "刷新列表"}
            disabled={isRefreshing}
            onClick={onRefreshRoles}
          >
            <RefreshCw size={14} strokeWidth={2.2} />
          </button>

          <button
            className="filter-btn table-icon-btn"
            type="button"
            aria-label="导出为 Excel"
            title="导出为 Excel"
            disabled={isRefreshing}
            onClick={onExportCurrentPageRoles}
          >
            <Download size={14} strokeWidth={2.2} />
          </button>

          <div className="field-control" ref={fieldMenuRef}>
            <button
              className={`filter-btn field-trigger ${fieldMenuOpen ? "active" : ""}`}
              type="button"
              aria-haspopup="menu"
              aria-expanded={fieldMenuOpen}
              disabled={isRefreshing}
              onClick={() => {
                onFieldMenuOpenChange((open) => !open);
                onTableConfigOpenChange(false);
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
                      onChange={() => onRoleColumnToggle(field.id)}
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
              disabled={isRefreshing}
              onClick={() => {
                onTableConfigOpenChange((open) => !open);
                onFieldMenuOpenChange(false);
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
                    onChange={() => onTableConfigToggle("bordered")}
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
                    onChange={() => onTableConfigToggle("striped")}
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
                    onChange={() => onTableConfigToggle("compact")}
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
                    onChange={() => onTableConfigToggle("hoverable")}
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
        </>
      }
      footer={
        <>
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
                  disabled={isRefreshing}
                  onClick={() => onBatchActionMenuOpenChange((open) => !open)}
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
                    <button
                      className="batch-action-option danger"
                      type="button"
                      role="menuitem"
                      onClick={onOpenBatchDeleteDialog}
                    >
                      <Trash2 size={13} strokeWidth={2.2} />
                      批量删除
                    </button>
                    <button
                      className="batch-action-option"
                      type="button"
                      role="menuitem"
                      onClick={onExportSelectedRoles}
                    >
                      <Download size={13} strokeWidth={2.2} />
                      导出表格
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
          <span>共 {filteredRoleCount} 条</span>
          <div className="table-page-size">
            <LonSelect
              ariaLabel="选择单页显示条数"
              value={String(pageSize)}
              options={rolePageSizeOptions}
              onValueChange={onPageSizeChange}
            />
          </div>
        </div>
        <div className="pagination" aria-label="角色分页">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange((page) => Math.max(1, page - 1))}
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
            <button
              className={page === currentPage ? "active" : ""}
              type="button"
              key={page}
              aria-current={page === currentPage ? "page" : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange((page) => Math.min(totalPages, page + 1))}
          >
            下一页
          </button>
        </div>
        </>
      }
    >
        <div className={tableScrollClassName} ref={tableScrollRef}>
          <table className={tableClassName} style={{ minWidth: roleTableMinWidth }}>
            <RoleTableColGroup visibleRoleColumns={visibleRoleColumns} />
            <thead>
              <tr>
                <th className="role-selection-column">
                  <button
                    className="table-selection-toggle"
                    type="button"
                    disabled={isRefreshing || pagedRoleKeys.length === 0}
                    onClick={onPagedRoleSelectionToggle}
                  >
                    {allPagedRolesSelected ? "取消全选" : "全选"}
                  </button>
                </th>
                {visibleRoleColumns.image ? (
                  <RoleSortableHeader
                    className="role-image-column"
                    label="头像"
                    sortKey="image"
                    sortState={roleSortState}
                    onSort={onRoleSort}
                  />
                ) : null}
                <RoleSortableHeader
                  className="role-name-column"
                  label="角色名称"
                  sortKey="name"
                  sortState={roleSortState}
                  onSort={onRoleSort}
                />
                {roleDisplayFields.map((field) =>
                  field.id !== "image" && visibleRoleColumns[field.id] ? (
                    <RoleSortableHeader
                      className={getRoleFieldColumnClassName(field.id)}
                      label={field.label}
                      key={field.id}
                      sortKey={field.id}
                      sortState={roleSortState}
                      onSort={onRoleSort}
                    />
                  ) : null,
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
                        disabled={isRefreshing}
                        onChange={() => onRoleSelectionToggle(roleKey)}
                      />
                    </td>
                    {visibleRoleColumns.image ? (
                      <td className="role-image-column">
                        {renderRoleColumnValue("image", record, isRefreshing ? undefined : onImagePreviewOpen)}
                      </td>
                    ) : null}
                    <td className="role-name-column">
                      <div className="table-main-cell">
                        <strong>{record.title}</strong>
                        <span>{record.description}</span>
                      </div>
                    </td>
                    {roleDisplayFields.map((field) =>
                      field.id !== "image" && visibleRoleColumns[field.id] ? (
                        <td className={getRoleFieldColumnClassName(field.id)} key={field.id}>
                          {renderRoleColumnValue(field.id, record)}
                        </td>
                      ) : null,
                    )}
                    <td className="role-actions-column">
                      <div className="table-actions">
                        <button type="button" disabled={isRefreshing} onClick={() => onOpenRoleDialog("detail", record)}>
                          查看
                        </button>
                        <button type="button" disabled={isRefreshing} onClick={() => onOpenRoleDialog("edit", record)}>
                          编辑
                        </button>
                        <button
                          className="danger"
                          type="button"
                          disabled={isRefreshing}
                          onClick={() => onOpenRoleDialog("delete", record)}
                        >
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

        <div className={tableSummaryScrollClassName} ref={tableSummaryScrollRef}>
          <table
            className={`${tableClassName} role-summary-table`}
            style={{ minWidth: roleTableMinWidth }}
            aria-label="角色统计"
          >
            <RoleTableColGroup visibleRoleColumns={visibleRoleColumns} />
            <tbody>
              <tr className="role-summary-row">
                <td className="role-selection-column" />
                {visibleRoleColumns.image ? <td className="role-image-column" /> : null}
                <td className="role-name-column">
                  <span className="role-summary-title">合计</span>
                </td>
                {roleDisplayFields.map((field) => {
                  const summaryValue = tableSummaryValueMap.get(field.id);

                  return field.id !== "image" && visibleRoleColumns[field.id] ? (
                    <td className={getRoleFieldColumnClassName(field.id)} key={field.id}>
                      {summaryValue ? <span className="role-summary-value">{summaryValue}</span> : null}
                    </td>
                  ) : null;
                })}
                <td className="role-actions-column" />
              </tr>
            </tbody>
          </table>
        </div>
    </DataTablePanel>
  );
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
  const [roleRefreshing, setRoleRefreshing] = useState(false);
  const [selectedRoleKeys, setSelectedRoleKeys] = useState<string[]>([]);
  const [activeRoleKey, setActiveRoleKey] = useState<string | null>(null);
  const [roleDialogMode, setRoleDialogMode] = useState<RoleDialogMode>(null);
  const [editForm, setEditForm] = useState<RoleEditForm>(() => createEmptyRoleForm());
  const [roleActionsPinned, setRoleActionsPinned] = useState(false);
  const [roleSelectionPinned, setRoleSelectionPinned] = useState(false);
  const [pageSize, setPageSize] = useState(() => readRoleTablePreferences().pageSize);
  const [roleSortState, setRoleSortState] = useState<RoleSortState>(null);
  const [previewImage, setPreviewImage] = useState<RoleImage | null>(null);
  const [imagePreviewState, setImagePreviewState] = useState<RoleImagePreviewState>(
    DEFAULT_ROLE_IMAGE_PREVIEW_STATE,
  );
  const [imageDragOrigin, setImageDragOrigin] = useState<RoleImageDragOrigin | null>(null);
  const [visibleRoleColumns, setVisibleRoleColumns] = useState<Record<RoleDisplayField, boolean>>(
    () => readRoleTablePreferences().visibleRoleColumns,
  );
  const [tableDisplayConfig, setTableDisplayConfig] =
    useState<TableDisplayConfig>(() => readRoleTablePreferences().tableDisplayConfig);
  const fieldMenuRef = useRef<HTMLDivElement>(null);
  const tableConfigRef = useRef<HTMLDivElement>(null);
  const batchActionRef = useRef<HTMLDivElement>(null);
  const tableSummaryScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const refreshTimerRef = useRef<number | null>(null);

  const statusOptions = useMemo(
    () => Array.from(new Set([...ROLE_STATUS_OPTIONS, ...records.map((record) => record.status)])),
    [records],
  );
  const ownerOptions = useMemo(
    () => Array.from(new Set([...ROLE_OWNER_OPTIONS, ...records.map((record) => record.owner)])),
    [records],
  );
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
          getRoleUpdatedAt(record),
          getRoleTypeLabel(record),
          getRoleDataScope(record),
          getRolePermissionCount(record),
          getRoleMemberLimit(record),
          getRoleLastOperator(record),
          getRoleCreatedAt(record),
          formatRoleBalance(record.balance),
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
  const sortedRoles = useMemo(() => sortRoleRecords(filteredRoles, roleSortState), [filteredRoles, roleSortState]);
  const totalPages = Math.max(1, Math.ceil(sortedRoles.length / pageSize));
  const pagedRoles = useMemo(() => {
    const pageStart = (currentPage - 1) * pageSize;

    return sortedRoles.slice(pageStart, pageStart + pageSize);
  }, [currentPage, pageSize, sortedRoles]);
  const pagedRoleKeys = useMemo(() => pagedRoles.map(getRoleKey), [pagedRoles]);
  const selectedRoleKeySet = useMemo(() => new Set(selectedRoleKeys), [selectedRoleKeys]);
  const selectedRoles = useMemo(
    () => records.filter((record) => selectedRoleKeySet.has(getRoleKey(record))),
    [records, selectedRoleKeySet],
  );
  const selectedRoleCount = selectedRoleKeys.length;
  const selectedPagedRoleCount = pagedRoleKeys.filter((roleKey) => selectedRoleKeySet.has(roleKey)).length;
  const allPagedRolesSelected = pagedRoleKeys.length > 0 && selectedPagedRoleCount === pagedRoleKeys.length;
  const visibleTableColumnCount = 3 + roleDisplayFields.filter((field) => visibleRoleColumns[field.id]).length;
  const tableSummaryValueMap = useMemo(
    () => new Map(roleTableSummaryItems.map((item) => [item.fieldId, item.getValue(pagedRoles)])),
    [pagedRoles],
  );
  const roleTableMinWidth = useMemo(() => getRoleTableMinWidth(visibleRoleColumns), [visibleRoleColumns]);
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
  const tableScrollClassName = [
    "table-scroll",
    roleActionsPinned ? "has-fixed-actions" : "",
    roleSelectionPinned ? "has-fixed-selection" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const tableSummaryScrollClassName = [
    "table-summary-scroll",
    roleActionsPinned ? "has-fixed-actions" : "",
    roleSelectionPinned ? "has-fixed-selection" : "",
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (selectedRoleCount === 0) {
      setBatchActionMenuOpen(false);
    }
  }, [selectedRoleCount]);

  useEffect(() => {
    saveRoleTablePreferences({
      pageSize,
      tableDisplayConfig,
      visibleRoleColumns,
    });
  }, [pageSize, tableDisplayConfig, visibleRoleColumns]);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const scrollElement = tableScrollRef.current;
    const summaryScrollElement = tableSummaryScrollRef.current;

    if (!scrollElement) {
      return;
    }

    const updatePinnedState = () => {
      const maxScrollLeft = scrollElement.scrollWidth - scrollElement.clientWidth;

      if (summaryScrollElement) {
        summaryScrollElement.scrollLeft = scrollElement.scrollLeft;
      }

      setRoleActionsPinned(maxScrollLeft > 1 && scrollElement.scrollLeft < maxScrollLeft - 1);
      setRoleSelectionPinned(maxScrollLeft > 1 && scrollElement.scrollLeft > 1);
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

  function handleRoleSort(sortKey: RoleSortKey) {
    const sortConfig = ROLE_TABLE_SORT_CONFIG[sortKey];

    if (!sortConfig.enabled) {
      return;
    }

    setCurrentPage(1);
    setRoleSortState((current) => {
      if (current?.key === sortKey) {
        if (current.direction === "desc") {
          return null;
        }

        return {
          key: sortKey,
          direction: "desc",
        };
      }

      return {
        key: sortKey,
        direction: "asc",
      };
    });
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

  function handleRoleRefresh() {
    if (roleRefreshing) {
      return;
    }

    setFieldMenuOpen(false);
    setTableConfigOpen(false);
    setBatchActionMenuOpen(false);
    setRoleRefreshing(true);

    refreshTimerRef.current = window.setTimeout(() => {
      setRecords((current) => [...current]);
      setRoleRefreshing(false);
      refreshTimerRef.current = null;
    }, 700);
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

  function openRoleCreateDialog() {
    setFieldMenuOpen(false);
    setTableConfigOpen(false);
    setBatchActionMenuOpen(false);
    setActiveRoleKey(null);
    setEditForm(createEmptyRoleForm());
    setRoleDialogMode("create");
  }

  function openRoleDialog(mode: Exclude<RoleDialogMode, "create" | null>, record: RoleRecord) {
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

  function handleRoleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextTitle = editForm.title.trim();
    const nextDescription = editForm.description.trim();

    if (!nextTitle || !nextDescription) {
      return;
    }

    if (roleDialogMode === "create") {
      const nextRecord = createRoleRecordFromForm(editForm, records.length);

      setRecords((current) => [nextRecord, ...current]);
      setSelectedRoleKeys([]);
      setDraftFilters(DEFAULT_ROLE_FILTERS);
      setAppliedFilters(DEFAULT_ROLE_FILTERS);
      setRoleSortState(null);
      setCurrentPage(1);
      closeRoleDialog();
      return;
    }

    if (!activeRole || !activeRoleKey) {
      return;
    }

    const memberCount = typeof editForm.memberCount === "number" ? editForm.memberCount : getRoleMemberCount(activeRole);
    const now = formatRoleDateTime(new Date());
    const nextRecord: RoleRecord = {
      ...activeRole,
      title: nextTitle,
      description: nextDescription,
      meta: `${memberCount} 位成员`,
      owner: editForm.owner,
      lastOperator: "当前用户",
      status: editForm.status,
      tone: getRoleToneByStatus(editForm.status),
      updated: "今天",
      updatedAt: now,
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
    <SearchTablePage
      className="role-page"
      search={
        <RoleSearchForm
          draftFilters={draftFilters}
          memberSizeOptions={memberSizeOptions}
          ownerFilterOptions={ownerFilterOptions}
          roleTypeOptions={roleTypeOptions}
          searchExpanded={searchExpanded}
          statusFilterOptions={statusFilterOptions}
          updatedRangeOptions={updatedRangeOptions}
          onFilterChange={updateDraftFilter}
          onReset={handleRoleReset}
          onSearch={handleRoleSearch}
          onToggleExpanded={() => setSearchExpanded((expanded) => !expanded)}
        />
      }
      table={
        <RoleTablePanel
          allPagedRolesSelected={allPagedRolesSelected}
          batchActionMenuOpen={batchActionMenuOpen}
          batchActionRef={batchActionRef}
          currentPage={currentPage}
          fieldMenuOpen={fieldMenuOpen}
          fieldMenuRef={fieldMenuRef}
          filteredRoleCount={filteredRoles.length}
          isRefreshing={roleRefreshing}
          pageSize={pageSize}
          pagedRoleKeys={pagedRoleKeys}
          pagedRoles={pagedRoles}
          roleSortState={roleSortState}
          roleTableMinWidth={roleTableMinWidth}
          selectedRoleCount={selectedRoleCount}
          selectedRoleKeySet={selectedRoleKeySet}
          tableClassName={tableClassName}
          tableConfigOpen={tableConfigOpen}
          tableConfigRef={tableConfigRef}
          tableDisplayConfig={tableDisplayConfig}
          tableScrollClassName={tableScrollClassName}
          tableScrollRef={tableScrollRef}
          tableSummaryScrollClassName={tableSummaryScrollClassName}
          tableSummaryScrollRef={tableSummaryScrollRef}
          tableSummaryValueMap={tableSummaryValueMap}
          totalPages={totalPages}
          visibleRoleColumns={visibleRoleColumns}
          visibleTableColumnCount={visibleTableColumnCount}
          onBatchActionMenuOpenChange={setBatchActionMenuOpen}
          onExportCurrentPageRoles={handleExportCurrentPageRoles}
          onExportSelectedRoles={handleExportSelectedRoles}
          onFieldMenuOpenChange={setFieldMenuOpen}
          onImagePreviewOpen={openImagePreview}
          onOpenBatchDeleteDialog={openBatchDeleteDialog}
          onOpenCreateRoleDialog={openRoleCreateDialog}
          onOpenRoleDialog={openRoleDialog}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          onPagedRoleSelectionToggle={togglePagedRoleSelection}
          onRefreshRoles={handleRoleRefresh}
          onRoleColumnToggle={toggleRoleColumn}
          onRoleSelectionToggle={toggleRoleSelection}
          onRoleSort={handleRoleSort}
          onTableConfigOpenChange={setTableConfigOpen}
          onTableConfigToggle={toggleTableDisplayConfig}
        />
      }
    >

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

      {roleDialogMode === "create" || (roleDialogMode === "edit" && activeRole) ? (
        <LonDrawer
          open={roleDialogMode === "create" || roleDialogMode === "edit"}
          title={roleDialogMode === "create" ? "新建角色" : "编辑"}
          description={
            roleDialogMode === "create"
              ? "填写角色基础信息，创建后会插入当前演示表格。"
              : "调整当前记录的基础信息，保存后会同步更新演示表格。"
          }
          size="large"
          onClose={closeRoleDialog}
          footer={
            <>
              <LonButton variant="secondary" onClick={closeRoleDialog}>
                取消
              </LonButton>
              <LonButton form="role-form" type="submit">
                {roleDialogMode === "create" ? "创建" : "保存"}
              </LonButton>
            </>
          }
        >
          <form className="role-edit-form" id="role-form" onSubmit={handleRoleFormSubmit}>
            <LonInput
              label="角色名称"
              placeholder="请输入角色名称"
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
                placeholder="请输入角色描述"
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
    </SearchTablePage>
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
