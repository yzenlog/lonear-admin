import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./Drawer.css";

export type DrawerPlacement = "right" | "top" | "bottom" | "left";
export type DrawerSize = "default" | "large";

export type DrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: DrawerPlacement;
  size?: DrawerSize;
  closeOnEsc?: boolean;
  maskClosable?: boolean;
  onClose: () => void;
};

function Drawer({
  open,
  title,
  description,
  children,
  footer,
  placement = "right",
  size = "default",
  closeOnEsc = true,
  maskClosable = true,
  onClose,
}: DrawerProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    panelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || !closeOnEsc) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOnEsc, onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="ui-drawer-overlay"
      onMouseDown={(event) => {
        if (maskClosable && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`ui-drawer ui-drawer-${placement} ui-drawer-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="ui-drawer-header">
          <div className="ui-drawer-heading">
            <h2 className="ui-drawer-title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="ui-drawer-description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button className="ui-drawer-close" type="button" aria-label="关闭抽屉" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>
        <div className="ui-drawer-body">{children}</div>
        {footer ? <footer className="ui-drawer-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

export default Drawer;
