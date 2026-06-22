import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { CalendarDays } from "lucide-react";
import "./LonDatePicker.css";

export type LonDatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  hint?: string;
  error?: string;
};

function LonDatePicker({ label, hint, error, id, ...inputProps }: LonDatePickerProps) {
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
      <span className="lon-control lon-date-control">
        <span className="lon-date-leading" aria-hidden="true">
          <CalendarDays size={15} strokeWidth={2.1} />
        </span>
        <input
          {...inputProps}
          id={inputId}
          type="date"
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

export default LonDatePicker;
