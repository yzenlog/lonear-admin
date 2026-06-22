import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import "./LonInput.css";

export type LonInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
};

function LonInput({ label, hint, error, leadingIcon, id, className, ...inputProps }: LonInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = hint || error ? `${inputId}-message` : undefined;
  const describedBy = [inputProps["aria-describedby"], messageId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`lon-form-field ${error ? "has-error" : ""}`}>
      {label ? (
        <label className="lon-form-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <span className="lon-control lon-input-control">
        {leadingIcon ? <span className="lon-input-leading">{leadingIcon}</span> : null}
        <input
          {...inputProps}
          className={className}
          id={inputId}
          aria-invalid={error ? true : inputProps["aria-invalid"]}
          aria-describedby={describedBy}
        />
      </span>
      {error || hint ? (
        <span className={error ? "lon-form-error" : "lon-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}

export default LonInput;
