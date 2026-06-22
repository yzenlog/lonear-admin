import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import "./Modal.css";

export type ModalSize = "small" | "default" | "large";

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnEsc?: boolean;
  maskClosable?: boolean;
  onClose: () => void;
};

function Modal({
  open,
  title,
  description,
  children,
  footer,
  size = "default",
  closeOnEsc = true,
  maskClosable = true,
  onClose,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    dialogRef.current?.focus();
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
      className="ui-modal-overlay"
      onMouseDown={(event) => {
        if (maskClosable && event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`ui-modal ui-modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className="ui-modal-header">
          <div className="ui-modal-heading">
            <h2 className="ui-modal-title" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="ui-modal-description" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button className="ui-modal-close" type="button" aria-label="关闭弹窗" onClick={onClose}>
            <X size={16} strokeWidth={2.2} />
          </button>
        </header>
        <div className="ui-modal-body">{children}</div>
        {footer ? <footer className="ui-modal-footer">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
