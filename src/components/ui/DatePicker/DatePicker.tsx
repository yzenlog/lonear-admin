import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { CalendarDays } from "lucide-react";
import "./DatePicker.css";

export type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  hint?: string;
  error?: string;
};

function DatePicker({ label, hint, error, id, ...inputProps }: DatePickerProps) {
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
      <span className="ui-control ui-date-control">
        <span className="ui-date-leading" aria-hidden="true">
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
        <span className={error ? "ui-form-error" : "ui-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}

export default DatePicker;
