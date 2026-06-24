import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../../i18n";
import "./PanelHeader.css";

type PanelHeaderProps = {
  icon: LucideIcon;
  title: string;
  action: string;
  onActionClick?: () => void;
};

function PanelHeader({ icon: Icon, title, action, onActionClick }: PanelHeaderProps) {
  const { t } = useLanguage();

  return (
    <div className="panel-header">
      <div>
        <Icon size={17} strokeWidth={2.1} />
        <h2>{t(title)}</h2>
      </div>
      <button type="button" onClick={onActionClick}>
        {t(action)}
      </button>
    </div>
  );
}

export default PanelHeader;
