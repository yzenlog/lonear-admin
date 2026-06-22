import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonVisualState = "default" | "hover" | "active";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  leadingIcon?: ReactNode;
  visualState?: ButtonVisualState;
};

function Button({
  variant = "primary",
  loading = false,
  leadingIcon,
  visualState = "default",
  className,
  children,
  type = "button",
  "aria-busy": ariaBusy,
  ...buttonProps
}: ButtonProps) {
  const classNames = [
    "ui-button",
    `ui-button-${variant}`,
    visualState !== "default" ? `is-${visualState}` : "",
    loading ? "is-loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...buttonProps} className={classNames} type={type} aria-busy={loading ? true : ariaBusy}>
      {loading ? <span className="ui-button-spinner" aria-hidden="true" /> : leadingIcon}
      {children}
    </button>
  );
}

export default Button;
