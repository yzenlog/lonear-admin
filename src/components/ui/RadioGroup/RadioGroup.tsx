import { useId } from "react";
import type { ReactNode } from "react";
import "./RadioGroup.css";

export type ChoiceOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupProps = {
  label: string;
  value: string;
  options: ChoiceOption[];
  onValueChange: (value: string) => void;
  name?: string;
  hint?: string;
  error?: string;
  direction?: "horizontal" | "vertical";
  children?: ReactNode;
};

function RadioGroup({
  label,
  value,
  options,
  onValueChange,
  name,
  hint,
  error,
  direction = "horizontal",
}: RadioGroupProps) {
  const generatedName = useId();
  const groupName = name ?? generatedName;
  const messageId = hint || error ? `${groupName}-message` : undefined;

  return (
    <fieldset className={`ui-form-field ui-choice-fieldset ${error ? "has-error" : ""}`} aria-describedby={messageId}>
      <legend className="ui-form-label">{label}</legend>
      <div className={`ui-choice-group ${direction}`}>
        {options.map((option) => (
          <label className="ui-choice-option ui-radio-option" key={option.value}>
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onValueChange(option.value)}
            />
            <span className="ui-choice-mark" aria-hidden="true" />
            <span className="ui-choice-text">
              <span>{option.label}</span>
              {option.description ? <small>{option.description}</small> : null}
            </span>
          </label>
        ))}
      </div>
      {error || hint ? (
        <span className={error ? "ui-form-error" : "ui-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </fieldset>
  );
}

export default RadioGroup;
