import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import "./LonSelect.css";

export type LonSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type LonSelectProps = {
  value: string;
  label?: string;
  hint?: string;
  error?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  options: LonSelectOption[];
  onValueChange: (value: string) => void;
};

function LonSelect({
  value,
  label,
  hint,
  error,
  id,
  name,
  disabled = false,
  placeholder = "请选择",
  ariaLabel,
  options,
  onValueChange,
}: LonSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const [open, setOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((option) => option.value === value);
  const messageId = hint || error ? `${selectId}-message` : undefined;
  const describedBy = messageId;

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!selectRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`lon-form-field ${error ? "has-error" : ""}`}>
      {label ? (
        <label className="lon-form-label" htmlFor={selectId}>
          {label}
        </label>
      ) : null}
      <div className={`lon-select ${open ? "open" : ""}`} ref={selectRef}>
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <button
          className="lon-control lon-select-trigger"
          id={selectId}
          type="button"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onClick={() => setOpen((visible) => !visible)}
        >
          <span className={selectedOption ? "" : "placeholder"}>{selectedOption?.label ?? placeholder}</span>
          <ChevronDown size={13} strokeWidth={2.2} aria-hidden="true" />
        </button>
        {open ? (
          <div className="lon-select-popover" role="listbox" aria-label={ariaLabel ?? label ?? "下拉选择"}>
            {options.map((option) => {
              const selected = option.value === value;

              return (
                <button
                  className={`lon-select-option ${selected ? "selected" : ""}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span>{option.label}</span>
                  {selected ? <Check size={13} strokeWidth={2.4} /> : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {error || hint ? (
        <span className={error ? "lon-form-error" : "lon-form-hint"} id={messageId}>
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}

export default LonSelect;
