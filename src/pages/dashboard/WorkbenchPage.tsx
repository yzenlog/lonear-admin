import { TrendingUp } from "lucide-react";
import MetricCard from "../../components/shared/metric-card/MetricCard";
import PanelHeader from "../../components/shared/panel-header/PanelHeader";
import StatusText from "../../components/shared/status-text/StatusText";
import { moduleMeta } from "../../config/modules";
import { useLanguage } from "../../i18n";
import { contentHealth, metrics, workbenchTasks, workbenchTrend } from "../../mocks/dashboard";
import { moduleRecords } from "../../mocks/managementRecords";

const numberFormatter = new Intl.NumberFormat("zh-CN");

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function WorkbenchPage() {
  const { locale, t } = useLanguage();
  const recentLogs = moduleRecords.operationLogs.slice(0, 3);
  const numberFormatter = new Intl.NumberFormat(locale === "en-US" ? "en-US" : "zh-CN");
  const maxTrendVisits = Math.max(...workbenchTrend.map((item) => item.visits));
  const totalTrendVisits = workbenchTrend.reduce((total, item) => total + item.visits, 0);
  const totalPublished = workbenchTrend.reduce((total, item) => total + item.published, 0);
  const totalUsers = workbenchTrend.reduce((total, item) => total + item.users, 0);
  const trendPeak = workbenchTrend.reduce((peak, item) => (item.visits > peak.visits ? item : peak), workbenchTrend[0]);

  return (
    <>
      <div className="metric-grid">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} icon={metric.icon} label={t(metric.label)} value={metric.value} delta={t(metric.delta)} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="admin-panel dashboard-panel dashboard-wide dashboard-chart-panel" aria-label={t("近7日运营趋势")}>
          <PanelHeader icon={TrendingUp} title="近 7 日运营趋势" action="查看报表" />
          <div className="dashboard-chart-layout">
            <div className="dashboard-chart-summary" aria-label={t("趋势汇总")}>
              <div>
                <span>{t("总访问")}</span>
                <strong>{numberFormatter.format(totalTrendVisits)}</strong>
                <em>{t("较上周")} +12.4%</em>
              </div>
              <div>
                <span>{t("内容发布")}</span>
                <strong>{numberFormatter.format(totalPublished)}</strong>
                <em>{t("本周累计")}</em>
              </div>
              <div>
                <span>{t("新增用户")}</span>
                <strong>{numberFormatter.format(totalUsers)}</strong>
                <em>{t("注册转化")}</em>
              </div>
            </div>

            <div
              className="dashboard-chart"
              role="img"
              aria-label={
                locale === "en-US"
                  ? `7-day visit trend bar chart. Peak: ${t(trendPeak.day)}, ${numberFormatter.format(trendPeak.visits)} visits`
                  : `近7日访问趋势柱状图，峰值为${trendPeak.day}${formatNumber(trendPeak.visits)}次访问`
              }
            >
              <div className="dashboard-chart-scale" aria-hidden="true">
                <span>{numberFormatter.format(maxTrendVisits)}</span>
                <span>{numberFormatter.format(Math.round(maxTrendVisits / 2))}</span>
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
                            <span className="dashboard-chart-value">{numberFormatter.format(item.visits)}</span>
                          </span>
                        </div>
                        <span className="dashboard-chart-day">{t(item.day)}</span>
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
                  <strong>{t(task.title)}</strong>
                  <span>{t(task.owner)}</span>
                </div>
                <StatusText tone={task.tone}>{t("待处理")}</StatusText>
                <span className="muted-text">{t(task.time)}</span>
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
                  <strong>{t(log.title)}</strong>
                  <span>{t(log.owner)}</span>
                </div>
                <StatusText tone={log.tone}>{t(log.status)}</StatusText>
                <span className="muted-text">{t(log.updated)}</span>
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
                  <strong>{t(item.title)}</strong>
                  <span>{t(item.description)}</span>
                </div>
                <StatusText tone={item.tone}>{t("正常")}</StatusText>
                <span className="muted-text">{t("实时")}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

export default WorkbenchPage;
