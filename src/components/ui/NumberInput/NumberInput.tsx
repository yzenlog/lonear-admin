import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { Minus, Plus } from "lucide-react";
import "./NumberInput.css";

export type NumberInputValue = number | "";

export type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "min" | "max" | "step"
> & {
  label?: string;
  hint?: string;
  error?: string;
  value: NumberInputValue;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: NumberInputValue) => void;
};

function clampValue(value: number, min?: number, max?: number) {
  if (typeof min === "number" && value < min) {
    return min;
  }

  if (typeof max === "number" && value > max) {
    return max;
  }

  return value;
}

function NumberInput({
  label,
  hint,
  error,
  id,
  value,
  min,
  max,
  step = 1,
  disabled,
  onValueChange,
  ...inputProps
}: NumberInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = hint || error ? `${inputId}-message` : undefined;
  const describedBy = [inputProps["aria-describedby"], messageId].filter(Boolean).join(" ") || undefined;
  const numericValue = typeof value === "number" ? value : undefined;
  const canDecrease = !disabled && (typeof min !== "number" || typeof numericValue !== "number" || numericValue > min);
  const canIncrease = !disabled && (typeof max !== "number" || typeof numericValue !== "number" || numericValue < max);

  function stepValue(direction: 1 | -1) {
    const nextBase = typeof value === "number" ? value : typeof min === "number" ? min : 0;
    onValueChange(clampValue(nextBase + step * direction, min, max));
  }

  return (
    <div className={`ui-form-field ${error ? "has-error" : ""}`}>
      {label ? (
        <label className="ui-form-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <span className="ui-control ui-number-control">
        <input
          {...inputProps}
          id={inputId}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-invalid={error ? true : inputProps["aria-invalid"]}
          aria-describedby={describedBy}
          onChange={(event) => {
            const nextValue = event.target.value;
            onValueChange(nextValue === "" ? "" : clampValue(Number(nextValue), min, max));
          }}
        />
        <span className="ui-number-stepper" aria-hidden="true">
          <button type="button" disabled={!canDecrease} tabIndex={-1} onClick={() => stepValue(-1)}>
            <Minus size={13} strokeWidth={2.2} />
          </button>
          <button type="button" disabled={!canIncrease} tabIndex={-1} onClick={() => stepValue(1)}>
            <Plus size={13} strokeWidth={2.2} />
          </button>
        </span>
      </span>
      {error || hint ? (
        <span className={error ? "ui-form-error" : "ui-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}

export default NumberInput;
