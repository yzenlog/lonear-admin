import { useMemo, useState } from "react";
import { Columns3, Database, KeyRound, Rows3, Search, Table2 } from "lucide-react";
import PanelHeader from "../../components/shared/panel-header/PanelHeader";
import { SearchTablePage } from "../../components/shared/search-table";
import { moduleMeta } from "../../config/modules";
import { dataModelDomainLabels, dataModelTables } from "../../mocks/dataModels";
import type { DataModelDomain, DataModelField, DataModelTable } from "../../mocks/dataModels";
import "./DataModelPage.css";

type DomainFilter = "all" | DataModelDomain;

type DomainOption = {
  label: string;
  value: DomainFilter;
};

type SummaryMetricProps = {
  icon: typeof Database;
  label: string;
  value: number | string;
};

const domainOptions: DomainOption[] = [
  { label: "全部", value: "all" },
  { label: dataModelDomainLabels.system, value: "system" },
  { label: dataModelDomainLabels.content, value: "content" },
  { label: dataModelDomainLabels.message, value: "message" },
  { label: dataModelDomainLabels.audit, value: "audit" },
];

const numberFormatter = new Intl.NumberFormat("zh-CN");

function DataModelPage() {
  const [keyword, setKeyword] = useState("");
  const [domainFilter, setDomainFilter] = useState<DomainFilter>("all");
  const [selectedTableId, setSelectedTableId] = useState(dataModelTables[0]?.id ?? "");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredTables = useMemo(
    () =>
      dataModelTables.filter((table) => {
        const domainMatched = domainFilter === "all" || table.domain === domainFilter;
        const keywordMatched = normalizedKeyword.length === 0 || matchesKeyword(table, normalizedKeyword);

        return domainMatched && keywordMatched;
      }),
    [domainFilter, normalizedKeyword],
  );
  const selectedTable = filteredTables.find((table) => table.id === selectedTableId) ?? filteredTables[0] ?? null;
  const tableCount = dataModelTables.length;
  const fieldCount = dataModelTables.reduce((total, table) => total + table.fields.length, 0);
  const keyFieldCount = dataModelTables.reduce(
    (total, table) => total + table.fields.filter((field) => Boolean(field.key)).length,
    0,
  );
  const rowEstimate = dataModelTables.reduce((total, table) => total + table.rowEstimate, 0);

  return (
    <SearchTablePage
      className="data-model-page"
      search={
        <section className="admin-panel data-model-overview" aria-label="数据模型概览">
          <div className="data-model-summary">
            <SummaryMetric icon={Table2} label="数据表" value={tableCount} />
            <SummaryMetric icon={Columns3} label="字段" value={fieldCount} />
            <SummaryMetric icon={KeyRound} label="索引字段" value={keyFieldCount} />
            <SummaryMetric icon={Rows3} label="估算记录" value={formatNumber(rowEstimate)} />
          </div>

          <div className="data-model-controls">
            <label className="data-model-search">
              <Search size={14} strokeWidth={2.2} aria-hidden="true" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索表名、字段或备注"
                aria-label="搜索数据模型"
              />
            </label>

            <div className="data-model-domain-tabs" role="tablist" aria-label="数据模型分类">
              {domainOptions.map((option) => (
                <button
                  className={`data-model-domain-tab ${domainFilter === option.value ? "active" : ""}`}
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={domainFilter === option.value}
                  onClick={() => setDomainFilter(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>
      }
      table={
        <div className="data-model-workspace">
          <TableListPanel
            activeTableId={selectedTable?.id ?? ""}
            tables={filteredTables}
            onSelectTable={setSelectedTableId}
          />
          <FieldDetailPanel table={selectedTable} />
        </div>
      }
    />
  );
}

export default DataModelPage;

function SummaryMetric({ icon: Icon, label, value }: SummaryMetricProps) {
  return (
    <div className="data-model-summary-metric">
      <span className="data-model-summary-icon" aria-hidden="true">
        <Icon size={15} strokeWidth={2.2} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TableListPanel({
  activeTableId,
  tables,
  onSelectTable,
}: {
  activeTableId: string;
  tables: DataModelTable[];
  onSelectTable: (tableId: string) => void;
}) {
  return (
    <section className="admin-panel table-module data-model-list-panel" aria-label="数据表清单">
      <PanelHeader icon={Table2} title="数据表" action={`${tables.length} 张表`} />
      <div className="table-scroll fill-remaining data-model-list-scroll">
        <table className="management-table data-model-list-table">
          <thead>
            <tr>
              <th>表名</th>
              <th>模块</th>
              <th>字段</th>
              <th>记录</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((table) => (
              <tr className={activeTableId === table.id ? "active" : ""} key={table.id}>
                <td>
                  <button className="data-model-table-button" type="button" onClick={() => onSelectTable(table.id)}>
                    <strong>{table.name}</strong>
                    <span>{table.displayName}</span>
                  </button>
                </td>
                <td>
                  <span className={`data-model-domain-pill domain-${table.domain}`}>
                    {dataModelDomainLabels[table.domain]}
                  </span>
                </td>
                <td>{table.fields.length}</td>
                <td>{formatNumber(table.rowEstimate)}</td>
              </tr>
            ))}
            {tables.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={4}>
                  没有匹配的数据表
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FieldDetailPanel({ table }: { table: DataModelTable | null }) {
  if (!table) {
    return (
      <section className="admin-panel table-module data-model-detail-panel" aria-label="字段明细">
        <PanelHeader icon={moduleMeta.dataModels.icon} title="字段明细" action={moduleMeta.dataModels.action} />
        <div className="data-model-empty-detail">
          <Database size={20} strokeWidth={2.1} />
          <span>选择一张数据表查看字段结构</span>
        </div>
      </section>
    );
  }

  const indexedFieldCount = table.fields.filter((field) => Boolean(field.key)).length;
  const requiredFieldCount = table.fields.filter((field) => !field.nullable).length;

  return (
    <section className="admin-panel table-module data-model-detail-panel" aria-label={`${table.displayName}字段明细`}>
      <PanelHeader icon={moduleMeta.dataModels.icon} title={table.displayName} action={moduleMeta.dataModels.action} />
      <div className="data-model-detail-head">
        <div className="data-model-title-block">
          <code>{table.name}</code>
          <p>{table.description}</p>
        </div>
        <div className="data-model-meta-grid">
          <ModelMeta label="所属模块" value={dataModelDomainLabels[table.domain]} />
          <ModelMeta label="存储引擎" value={table.engine} />
          <ModelMeta label="负责人" value={table.owner} />
          <ModelMeta label="更新时间" value={table.updated} />
        </div>
      </div>

      <div className="table-toolbar data-model-field-toolbar">
        <div className="data-model-field-title">
          <Columns3 size={15} strokeWidth={2.1} />
          <span>字段明细</span>
        </div>
        <div className="data-model-field-stats">
          <span>{table.fields.length} 个字段</span>
          <span>{requiredFieldCount} 个必填</span>
          <span>{indexedFieldCount} 个索引</span>
        </div>
      </div>

      <div className="table-scroll fill-remaining data-model-field-scroll">
        <table className="management-table data-model-field-table">
          <thead>
            <tr>
              <th>字段名称</th>
              <th>数据类型</th>
              <th>键</th>
              <th>允许空</th>
              <th>默认值</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {table.fields.map((field) => (
              <FieldRow field={field} key={field.name} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        <div className="table-footer-meta">
          <span>估算记录 {formatNumber(table.rowEstimate)} 条</span>
          <span>字段来自数据库结构快照</span>
        </div>
      </div>
    </section>
  );
}

function ModelMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-model-meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FieldRow({ field }: { field: DataModelField }) {
  return (
    <tr>
      <td>
        <code className="data-model-field-name">{field.name}</code>
      </td>
      <td>
        <span className="data-model-type">{field.type}</span>
      </td>
      <td>{field.key ? <span className={`data-model-key key-${field.key.toLowerCase()}`}>{field.key}</span> : "--"}</td>
      <td>{field.nullable ? "是" : "否"}</td>
      <td>{field.defaultValue ?? "--"}</td>
      <td>{field.comment}</td>
    </tr>
  );
}

function matchesKeyword(table: DataModelTable, keyword: string) {
  const tableText = [
    table.name,
    table.displayName,
    dataModelDomainLabels[table.domain],
    table.owner,
    table.description,
    ...table.fields.flatMap((field) => [field.name, field.type, field.comment, field.defaultValue ?? ""]),
  ]
    .join(" ")
    .toLowerCase();

  return tableText.includes(keyword);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}
