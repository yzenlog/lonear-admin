import { X } from "lucide-react";
import { moduleMeta } from "../../../config/modules";
import type { ModuleId } from "../../../config/modules";
import "./PageTabs.css";

type PageTabsProps = {
  tabs: ModuleId[];
  activeModule: ModuleId;
  onSelect: (id: ModuleId) => void;
  onClose: (id: ModuleId) => void;
};

function PageTabs({ tabs, activeModule, onSelect, onClose }: PageTabsProps) {
  return (
    <div className="tabs page-tabs" role="tablist" aria-label="已打开页面">
      {tabs.map((id) => {
        const meta = moduleMeta[id];
        const Icon = meta.icon;
        const active = id === activeModule;

        return (
          <div className={`tab-item ${active ? "active" : ""}`} key={id}>
            <button className="tab" type="button" role="tab" aria-selected={active} onClick={() => onSelect(id)}>
              <Icon size={13} strokeWidth={2.1} />
              <span>{meta.title}</span>
            </button>
            {id === "dashboard" ? null : (
              <button className="tab-close" type="button" aria-label={`关闭${meta.title}`} onClick={() => onClose(id)}>
                <X size={12} strokeWidth={2.1} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PageTabs;
