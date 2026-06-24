import type { ReactNode } from "react";
import { useLanguage } from "../../../i18n";

type DataTablePanelProps = {
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  summary?: ReactNode;
  toolbar: ReactNode;
};

function DataTablePanel({
  children,
  className,
  footer,
  loading = false,
  loadingText = "正在刷新列表...",
  summary,
  toolbar,
}: DataTablePanelProps) {
  const { t } = useLanguage();
  const panelClassName = ["admin-panel", "table-module", loading ? "is-refreshing" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <section className={panelClassName} aria-busy={loading}>
      <div className="table-toolbar">{toolbar}</div>

      <div className="table-data-region">
        {children}
        {summary}
        {loading ? (
          <div className="table-loading-overlay" role="status" aria-live="polite">
            <span className="table-loading-spinner" aria-hidden="true" />
            <span>{t(loadingText)}</span>
          </div>
        ) : null}
      </div>

      {footer ? <div className="table-footer">{footer}</div> : null}
    </section>
  );
}

export default DataTablePanel;
