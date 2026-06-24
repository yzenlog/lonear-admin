import { useId } from "react";
import type { ReactNode } from "react";
import "./LonRadioGroup.css";

export type LonChoiceOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type LonRadioGroupProps = {
  label: string;
  value: string;
  options: LonChoiceOption[];
  onValueChange: (value: string) => void;
  name?: string;
  hint?: string;
  error?: string;
  direction?: "horizontal" | "vertical";
  children?: ReactNode;
};

function LonRadioGroup({
  label,
  value,
  options,
  onValueChange,
  name,
  hint,
  error,
  direction = "horizontal",
}: LonRadioGroupProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const messageId = hint || error ? `${groupName}-message` : undefined;

  return (
    <fieldset className={`lon-form-field lon-choice-fieldset ${error ? "has-error" : ""}`} aria-describedby={messageId}>
      <legend className="lon-form-label">{label}</legend>
      <div className={`lon-choice-group ${direction}`} role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={value === option.value}
            className={`lon-choice-option lon-radio-option ${value === option.value ? "is-checked" : ""}`}
            disabled={option.disabled}
            key={option.value}
            role="radio"
            type="button"
            onClick={() => onValueChange(option.value)}
          >
            <span className="lon-choice-mark" aria-hidden="true" />
            <span className="lon-choice-text">
              <span>{option.label}</span>
              {option.description ? <small>{option.description}</small> : null}
            </span>
          </button>
        ))}
      </div>
      {error || hint ? (
        <span className={error ? "lon-form-error" : "lon-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </fieldset>
  );
}

export default LonRadioGroup;
