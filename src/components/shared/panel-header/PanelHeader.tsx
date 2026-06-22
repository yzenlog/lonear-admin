import type { LucideIcon } from "lucide-react";
import "./PanelHeader.css";

type PanelHeaderProps = {
  icon: LucideIcon;
  title: string;
  action: string;
};

function PanelHeader({ icon: Icon, title, action }: PanelHeaderProps) {
  return (
    <div className="panel-header">
      <div>
        <Icon size={17} strokeWidth={2.1} />
        <h2>{title}</h2>
      </div>
      <button type="button">{action}</button>
    </div>
  );
}

export default PanelHeader;
