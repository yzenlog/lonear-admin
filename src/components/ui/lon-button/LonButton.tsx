import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./LonButton.css";

export type LonButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type LonButtonVisualState = "default" | "hover" | "active";

export type LonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: LonButtonVariant;
  loading?: boolean;
  leadingIcon?: ReactNode;
  visualState?: LonButtonVisualState;
};

function LonButton({
  variant = "primary",
  loading = false,
  leadingIcon,
  visualState = "default",
  className,
  children,
  type = "button",
  "aria-busy": ariaBusy,
  ...buttonProps
}: LonButtonProps) {
  const classNames = [
    "lon-button",
    `lon-button-${variant}`,
    visualState !== "default" ? `is-${visualState}` : "",
    loading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...buttonProps} className={classNames} type={type} aria-busy={loading ? true : ariaBusy}>
      {loading ? <span className="lon-button-spinner" aria-hidden="true" /> : leadingIcon}
      {children}
    </button>
  );
}

export default LonButton;
