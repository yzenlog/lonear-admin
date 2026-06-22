import { ChevronDown, Eye, ListFilter, X } from "lucide-react";
import PanelHeader from "../panel-header/PanelHeader";
import StatusText from "../status-text/StatusText";
import { moduleMeta } from "../../../config/modules";
import type { ModuleId } from "../../../config/modules";
import type { ManagementRecord } from "../../../mocks/managementRecords";
import "./ManagementModulePage.css";

type ManagementModulePageProps = {
  moduleId: Exclude<ModuleId, "dashboard">;
  records: ManagementRecord[];
};

function ManagementModulePage({ moduleId, records }: ManagementModulePageProps) {
  const meta = moduleMeta[moduleId];

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
            <div className="empty-state">暂无记录</div>
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

export default ManagementModulePage;
