import type { ReactNode } from "react";
import { X } from "lucide-react";
import "./LonTag.css";

export type LonTagTone = "neutral" | "blue" | "green" | "amber" | "red" | "purple";

export type LonTagProps = {
  children: ReactNode;
  tone?: LonTagTone;
  dot?: boolean;
  selected?: boolean;
  closable?: boolean;
  disabled?: boolean;
  className?: string;
  closeLabel?: string;
  onClick?: () => void;
  onClose?: () => void;
};

function LonTag({
  children,
  tone = "neutral",
  dot = true,
  selected = false,
  closable = false,
  disabled = false,
  className,
  closeLabel = "移除标签",
  onClick,
  onClose,
}: LonTagProps) {
  const classNames = [
    "lon-tag",
    `lon-tag-${tone}`,
    dot ? "has-dot" : "is-dotless",
    selected ? "is-selected" : "",
    closable ? "is-closable" : "",
    disabled ? "is-disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      {dot ? <span className="lon-tag-dot" aria-hidden="true" /> : null}
      <span className="lon-tag-label">{children}</span>
      {closable ? (
        <button
          aria-label={closeLabel}
          className="lon-tag-close"
          disabled={disabled}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose?.();
          }}
        >
          <X size={12} strokeWidth={2.2} />
        </button>
      ) : null}
    </>
  );

  if (onClick && !closable) {
    return (
      <button
        aria-pressed={selected}
        className={classNames}
        disabled={disabled}
        type="button"
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span aria-disabled={disabled || undefined} className={classNames}>
      {content}
    </span>
  );
}

export default LonTag;
