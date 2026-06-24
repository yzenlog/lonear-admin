import { useId } from "react";
import type { LonChoiceOption } from "../lon-radio-group/LonRadioGroup";
import "./LonCheckboxGroup.css";

export type LonCheckboxGroupProps = {
  label: string;
  value: string[];
  options: LonChoiceOption[];
  onValueChange: (value: string[]) => void;
  name?: string;
  hint?: string;
  error?: string;
  direction?: "horizontal" | "vertical";
};

function LonCheckboxGroup({
  label,
  value,
  options,
  onValueChange,
  name,
  hint,
  error,
  direction = "horizontal",
}: LonCheckboxGroupProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const messageId = hint || error ? `${groupName}-message` : undefined;

  function toggleValue(optionValue: string) {
    onValueChange(
      value.includes(optionValue)
        ? value.filter((selectedValue) => selectedValue !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <fieldset className={`lon-form-field lon-choice-fieldset ${error ? "has-error" : ""}`} aria-describedby={messageId}>
      <legend className="lon-form-label">{label}</legend>
      <div className={`lon-choice-group ${direction}`} role="group">
        {options.map((option) => (
          <button
            aria-checked={value.includes(option.value)}
            className={`lon-choice-option lon-checkbox-option ${value.includes(option.value) ? "is-checked" : ""}`}
            disabled={option.disabled}
            key={option.value}
            role="checkbox"
            type="button"
            onClick={() => toggleValue(option.value)}
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

export default LonCheckboxGroup;
