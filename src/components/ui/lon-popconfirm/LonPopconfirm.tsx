import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { createPortal } from "react-dom";
import { CircleAlert } from "lucide-react";
import LonButton from "../lon-button/LonButton";
import type { LonButtonVariant } from "../lon-button/LonButton";
import "./LonPopconfirm.css";

export type LonPopconfirmPlacement = "top" | "bottom" | "left" | "right";

export type LonPopconfirmProps = {
  title: ReactNode;
  children: ReactNode;
  description?: ReactNode;
  placement?: LonPopconfirmPlacement;
  open?: boolean;
  defaultOpen?: boolean;
  disabled?: boolean;
  okText?: ReactNode;
  cancelText?: ReactNode;
  okButtonVariant?: LonButtonVariant;
  closeOnEsc?: boolean;
  onConfirm?: () => unknown | Promise<unknown>;
  onCancel?: () => void;
  onOpenChange?: (open: boolean) => void;
};

type PopconfirmPosition = {
  top: number;
  left: number;
  arrowTop: number;
  arrowLeft: number;
  placement: LonPopconfirmPlacement;
};

const POPCONFIRM_GAP = 10;
const VIEWPORT_MARGIN = 12;
const MIN_ARROW_OFFSET = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFlippedPlacement(
  placement: LonPopconfirmPlacement,
  triggerRect: DOMRect,
  popupRect: DOMRect,
): LonPopconfirmPlacement {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (placement === "top" && triggerRect.top < popupRect.height + POPCONFIRM_GAP + VIEWPORT_MARGIN) {
    return viewportHeight - triggerRect.bottom > triggerRect.top ? "bottom" : placement;
  }

  if (placement === "bottom" && viewportHeight - triggerRect.bottom < popupRect.height + POPCONFIRM_GAP + VIEWPORT_MARGIN) {
    return triggerRect.top > viewportHeight - triggerRect.bottom ? "top" : placement;
  }

  if (placement === "left" && triggerRect.left < popupRect.width + POPCONFIRM_GAP + VIEWPORT_MARGIN) {
    return viewportWidth - triggerRect.right > triggerRect.left ? "right" : placement;
  }

  if (placement === "right" && viewportWidth - triggerRect.right < popupRect.width + POPCONFIRM_GAP + VIEWPORT_MARGIN) {
    return triggerRect.left > viewportWidth - triggerRect.right ? "left" : placement;
  }

  return placement;
}

function getPosition(
  placement: LonPopconfirmPlacement,
  triggerRect: DOMRect,
  popupRect: DOMRect,
): PopconfirmPosition {
  const resolvedPlacement = getFlippedPlacement(placement, triggerRect, popupRect);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const triggerCenterX = triggerRect.left + triggerRect.width / 2;
  const triggerCenterY = triggerRect.top + triggerRect.height / 2;
  let top = triggerRect.bottom + POPCONFIRM_GAP;
  let left = triggerCenterX - popupRect.width / 2;

  if (resolvedPlacement === "top") {
    top = triggerRect.top - popupRect.height - POPCONFIRM_GAP;
    left = triggerCenterX - popupRect.width / 2;
  }

  if (resolvedPlacement === "left") {
    top = triggerCenterY - popupRect.height / 2;
    left = triggerRect.left - popupRect.width - POPCONFIRM_GAP;
  }

  if (resolvedPlacement === "right") {
    top = triggerCenterY - popupRect.height / 2;
    left = triggerRect.right + POPCONFIRM_GAP;
  }

  const clampedLeft = clamp(left, VIEWPORT_MARGIN, viewportWidth - popupRect.width - VIEWPORT_MARGIN);
  const clampedTop = clamp(top, VIEWPORT_MARGIN, viewportHeight - popupRect.height - VIEWPORT_MARGIN);
  const arrowLeft = clamp(triggerCenterX - clampedLeft, MIN_ARROW_OFFSET, popupRect.width - MIN_ARROW_OFFSET);
  const arrowTop = clamp(triggerCenterY - clampedTop, MIN_ARROW_OFFSET, popupRect.height - MIN_ARROW_OFFSET);

  return {
    top: clampedTop,
    left: clampedLeft,
    arrowTop,
    arrowLeft,
    placement: resolvedPlacement,
  };
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return Boolean(value && (typeof value === "object" || typeof value === "function") && "then" in value);
}

function LonPopconfirm({
  title,
  children,
  description,
  placement = "top",
  open,
  defaultOpen = false,
  disabled = false,
  okText = "确定",
  cancelText = "取消",
  okButtonVariant = "primary",
  closeOnEsc = true,
  onConfirm,
  onCancel,
  onOpenChange,
}: LonPopconfirmProps) {
  const titleId = useId();
  const descriptionId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [confirming, setConfirming] = useState(false);
  const [position, setPosition] = useState<PopconfirmPosition | null>(null);
  const mergedOpen = open ?? internalOpen;

  const setMergedOpen = useCallback(
    (nextOpen: boolean) => {
      if (open === undefined) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [onOpenChange, open],
  );

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const popupElement = popupRef.current;

    if (!triggerElement || !popupElement) {
      return;
    }

    setPosition(getPosition(placement, triggerElement.getBoundingClientRect(), popupElement.getBoundingClientRect()));
  }, [placement]);

  useLayoutEffect(() => {
    if (!mergedOpen) {
      setPosition(null);
      return;
    }

    updatePosition();
  }, [mergedOpen, updatePosition]);

  useEffect(() => {
    if (!mergedOpen) {
      setConfirming(false);
      return;
    }

    const timer = window.requestAnimationFrame(updatePosition);
    return () => window.cancelAnimationFrame(timer);
  }, [mergedOpen, updatePosition, title, description]);

  useEffect(() => {
    if (!mergedOpen || disabled) {
      return;
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [disabled, mergedOpen, updatePosition]);

  useEffect(() => {
    if (!mergedOpen) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) {
        return;
      }

      setMergedOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [mergedOpen, setMergedOpen]);

  useEffect(() => {
    if (!mergedOpen || !closeOnEsc) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMergedOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeOnEsc, mergedOpen, setMergedOpen]);

  useEffect(() => {
    if (disabled && mergedOpen) {
      setMergedOpen(false);
    }
  }, [disabled, mergedOpen, setMergedOpen]);

  async function handleConfirm() {
    const result = onConfirm?.();

    if (!isPromiseLike(result)) {
      setMergedOpen(false);
      return;
    }

    setConfirming(true);

    try {
      await result;
      setMergedOpen(false);
    } catch {
      // Keep the popconfirm open so callers can surface the failure nearby.
    } finally {
      setConfirming(false);
    }
  }

  function handleCancel() {
    onCancel?.();
    setMergedOpen(false);
  }

  const popupStyle = {
    top: position?.top ?? 0,
    left: position?.left ?? 0,
    visibility: position ? undefined : "hidden",
    "--lon-popconfirm-arrow-left": `${position?.arrowLeft ?? MIN_ARROW_OFFSET}px`,
    "--lon-popconfirm-arrow-top": `${position?.arrowTop ?? MIN_ARROW_OFFSET}px`,
  } as CSSProperties;
  const resolvedPlacement = position?.placement ?? placement;

  return (
    <>
      <span
        className="lon-popconfirm-trigger"
        ref={triggerRef}
        onClick={() => {
          if (!disabled) {
            setMergedOpen(!mergedOpen);
          }
        }}
      >
        {children}
      </span>
      {mergedOpen
        ? createPortal(
            <div
              className={`lon-popconfirm lon-popconfirm-${resolvedPlacement}`}
              role="dialog"
              aria-modal="false"
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              ref={popupRef}
              style={popupStyle}
            >
              <span className="lon-popconfirm-arrow" aria-hidden="true" />
              <div className="lon-popconfirm-content">
                <span className="lon-popconfirm-icon" aria-hidden="true">
                  <CircleAlert size={17} strokeWidth={2.2} />
                </span>
                <div className="lon-popconfirm-copy">
                  <strong className="lon-popconfirm-title" id={titleId}>
                    {title}
                  </strong>
                  {description ? (
                    <span className="lon-popconfirm-description" id={descriptionId}>
                      {description}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="lon-popconfirm-actions">
                <LonButton variant="secondary" onClick={handleCancel}>
                  {cancelText}
                </LonButton>
                <LonButton variant={okButtonVariant} loading={confirming} onClick={handleConfirm}>
                  {okText}
                </LonButton>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export default LonPopconfirm;
