import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./Input.css";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
};

function Input({ label, hint, error, leadingIcon, id, className, ...inputProps }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = hint || error ? `${inputId}-message` : undefined;
  const describedBy = [inputProps["aria-describedby"], messageId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`ui-form-field ${error ? "has-error" : ""}`}>
      {label ? (
        <label className="ui-form-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <span className="ui-control ui-input-control">
        {leadingIcon ? <span className="ui-input-leading">{leadingIcon}</span> : null}
        <input
          {...inputProps}
          className={className}
          id={inputId}
          aria-invalid={error ? true : inputProps["aria-invalid"]}
          aria-describedby={describedBy}
        />
      </span>
      {error || hint ? (
        <span className={error ? "ui-form-error" : "ui-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}

export default Input;
