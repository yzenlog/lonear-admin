import MetricCard from "../../components/shared/metric-card/MetricCard";
import PanelHeader from "../../components/shared/panel-header/PanelHeader";
import StatusText from "../../components/shared/status-text/StatusText";
import { moduleMeta } from "../../config/modules";
import { contentHealth, metrics, workbenchTasks } from "../../mocks/dashboard";
import { moduleRecords } from "../../mocks/managementRecords";

function WorkbenchPage() {
  const recentLogs = moduleRecords.operationLogs.slice(0, 3);

  return (
    <>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="admin-panel dashboard-panel">
          <PanelHeader icon={moduleMeta.dashboard.icon} title="待办与风险" action="查看全部" />
          <div className="data-table">
            {workbenchTasks.map((task) => (
              <div className="data-row dashboard-row" key={task.title}>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.owner}</span>
                </div>
                <StatusText tone={task.tone}>待处理</StatusText>
                <span className="muted-text">{task.time}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel dashboard-panel">
          <PanelHeader icon={moduleMeta.operationLogs.icon} title="最近操作" action="审计" />
          <div className="data-table">
            {recentLogs.map((log) => (
              <div className="data-row dashboard-row" key={`${log.title}-${log.updated}`}>
                <div>
                  <strong>{log.title}</strong>
                  <span>{log.owner}</span>
                </div>
                <StatusText tone={log.tone}>{log.status}</StatusText>
                <span className="muted-text">{log.updated}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel dashboard-panel dashboard-wide">
          <PanelHeader icon={moduleMeta.articles.icon} title="内容运营概况" action="查看内容" />
          <div className="data-table">
            {contentHealth.map((item) => (
              <div className="data-row dashboard-row" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </div>
                <StatusText tone={item.tone}>正常</StatusText>
                <span className="muted-text">实时</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default WorkbenchPage;
