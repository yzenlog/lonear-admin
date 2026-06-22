import { useId } from "react";
import type { ChoiceOption } from "../RadioGroup/RadioGroup";
import "./CheckboxGroup.css";

export type CheckboxGroupProps = {
  label: string;
  value: string[];
  options: ChoiceOption[];
  onValueChange: (value: string[]) => void;
  name?: string;
  hint?: string;
  error?: string;
  direction?: "horizontal" | "vertical";
};

function CheckboxGroup({
  label,
  value,
  options,
  onValueChange,
  name,
  hint,
  error,
  direction = "horizontal",
}: CheckboxGroupProps) {
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
    <fieldset className={`ui-form-field ui-choice-fieldset ${error ? "has-error" : ""}`} aria-describedby={messageId}>
      <legend className="ui-form-label">{label}</legend>
      <div className={`ui-choice-group ${direction}`}>
        {options.map((option) => (
          <label className="ui-choice-option ui-checkbox-option" key={option.value}>
            <input
              type="checkbox"
              name={groupName}
              value={option.value}
              checked={value.includes(option.value)}
              disabled={option.disabled}
              onChange={() => toggleValue(option.value)}
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

export default CheckboxGroup;
