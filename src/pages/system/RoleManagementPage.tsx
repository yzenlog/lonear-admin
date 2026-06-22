import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Check, ChevronDown, Eye, Plus, Search, X } from "lucide-react";
import StatusText from "../../components/shared/status-text/StatusText";
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
const ROLE_PAGE_SIZE = 10;
const roleDisplayFields = [
  { id: "members", label: "成员" },
  { id: "owner", label: "所属组织" },
  { id: "status", label: "状态" },
  { id: "updated", label: "更新时间" },
] as const;

type RoleFilters = typeof DEFAULT_ROLE_FILTERS;
type RoleDisplayField = (typeof roleDisplayFields)[number]["id"];
type SearchSelectOption = {
  value: string;
  label: string;
};

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

function RoleManagementPage() {
  const records = moduleRecords.roles;
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
  const visibleTableColumnCount = 2 + roleDisplayFields.filter((field) => visibleRoleColumns[field.id]).length;

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

export default RoleManagementPage;
