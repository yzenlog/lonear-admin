import { TrendingUp } from "lucide-react";
import MetricCard from "../../components/shared/metric-card/MetricCard";
import PanelHeader from "../../components/shared/panel-header/PanelHeader";
import StatusText from "../../components/shared/status-text/StatusText";
import { moduleMeta } from "../../config/modules";
import { contentHealth, metrics, workbenchTasks, workbenchTrend } from "../../mocks/dashboard";
import { moduleRecords } from "../../mocks/managementRecords";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function WorkbenchPage() {
  const recentLogs = moduleRecords.operationLogs.slice(0, 3);
  const maxTrendVisits = Math.max(...workbenchTrend.map((item) => item.visits));
  const totalTrendVisits = workbenchTrend.reduce((total, item) => total + item.visits, 0);
  const totalPublished = workbenchTrend.reduce((total, item) => total + item.published, 0);
  const totalUsers = workbenchTrend.reduce((total, item) => total + item.users, 0);
  const trendPeak = workbenchTrend.reduce((peak, item) => (item.visits > peak.visits ? item : peak), workbenchTrend[0]);

  return (
    <>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} icon={metric.icon} label={metric.label} value={metric.value} delta={metric.delta} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="admin-panel dashboard-panel dashboard-wide dashboard-chart-panel" aria-label="近7日运营趋势">
          <PanelHeader icon={TrendingUp} title="近 7 日运营趋势" action="查看报表" />
          <div className="dashboard-chart-layout">
            <div className="dashboard-chart-summary" aria-label="趋势汇总">
              <div>
                <span>总访问</span>
                <strong>{formatNumber(totalTrendVisits)}</strong>
                <em>较上周 +12.4%</em>
              </div>
              <div>
                <span>内容发布</span>
                <strong>{formatNumber(totalPublished)}</strong>
                <em>本周累计</em>
              </div>
              <div>
                <span>新增用户</span>
                <strong>{formatNumber(totalUsers)}</strong>
                <em>注册转化</em>
              </div>
            </div>

            <div
              className="dashboard-chart"
              role="img"
              aria-label={`近7日访问趋势柱状图，峰值为${trendPeak.day}${formatNumber(trendPeak.visits)}次访问`}
            >
              <div className="dashboard-chart-scale" aria-hidden="true">
                <span>{formatNumber(maxTrendVisits)}</span>
                <span>{formatNumber(Math.round(maxTrendVisits / 2))}</span>
                <span>0</span>
              </div>
              <div className="dashboard-chart-plot">
                <div className="dashboard-chart-gridline" aria-hidden="true" />
                <div className="dashboard-chart-gridline" aria-hidden="true" />
                <div className="dashboard-chart-gridline" aria-hidden="true" />
                <div className="dashboard-chart-bars">
                  {workbenchTrend.map((item) => {
                    const barHeight = Math.max(Math.round((item.visits / maxTrendVisits) * 100), 8);

                    return (
                      <div className="dashboard-chart-column" key={item.day}>
                        <div className="dashboard-chart-bar-track">
                          <span className="dashboard-chart-bar" style={{ height: `${barHeight}%` }}>
                            <span className="dashboard-chart-value">{formatNumber(item.visits)}</span>
                          </span>
                        </div>
                        <span className="dashboard-chart-day">{item.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

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
