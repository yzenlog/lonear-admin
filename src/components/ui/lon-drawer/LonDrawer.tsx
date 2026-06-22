import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./LonDrawer.css";

export type LonDrawerPlacement = "right" | "top" | "bottom" | "left";
export type LonDrawerSize = "default" | "large";

export type LonDrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: LonDrawerPlacement;
  size?: LonDrawerSize;
  closeOnEsc?: boolean;
  maskClosable?: boolean;
  onClose: () => void;
};

function LonDrawer({
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
}: LonDrawerProps) {
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
      className="lon-drawer-overlay"
      onMouseDown={(event) => {
        if (maskClosable && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`lon-drawer lon-drawer-${placement} lon-drawer-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        ref={panelRef}
      >
        <header className="lon-drawer-header">
          <div className="lon-drawer-heading">
            <h2 className="lon-drawer-title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="lon-drawer-description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button className="lon-drawer-close" type="button" aria-label="关闭抽屉" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>
        <div className="lon-drawer-body">{children}</div>
        {footer ? <footer className="lon-drawer-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

export default LonDrawer;
