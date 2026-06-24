import type { HTMLAttributes } from "react";
import "./LonProgress.css";

export type LonProgressTone = "blue" | "green" | "amber" | "red" | "purple";
export type LonProgressSize = "small" | "default";
export type LonProgressVariant = "line" | "circle";

export type LonProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value: number;
  max?: number;
  label?: string;
  tone?: LonProgressTone;
  size?: LonProgressSize;
  variant?: LonProgressVariant;
  showValue?: boolean;
};

function clampProgress(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), max);
}

function LonProgress({
  value,
  max = 100,
  label,
  tone = "blue",
  size = "default",
  variant = "line",
  showValue = true,
  className,
  "aria-label": ariaLabel,
  ...progressProps
}: LonProgressProps) {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
  const safeValue = clampProgress(value, safeMax);
  const percent = Math.round((safeValue / safeMax) * 100);
  const classNames = ["lon-progress", `lon-progress-${variant}`, `lon-progress-${tone}`, `lon-progress-${size}`, className]
    .filter(Boolean)
    .join(" ");
  const circleRadius = 30;
  const circleCircumference = 2 * Math.PI * circleRadius;

  if (variant === "circle") {
    return (
      <div className={classNames} {...progressProps}>
        <div
          aria-label={ariaLabel ?? label ?? "进度"}
          aria-valuemax={safeMax}
          aria-valuemin={0}
          aria-valuenow={safeValue}
          aria-valuetext={`${percent}%`}
          className="lon-progress-circle-wrap"
          role="progressbar"
        >
          <svg aria-hidden="true" className="lon-progress-circle-svg" viewBox="0 0 72 72">
            <circle className="lon-progress-circle-track" cx="36" cy="36" r={circleRadius} />
            <circle
              className="lon-progress-circle-bar"
              cx="36"
              cy="36"
              r={circleRadius}
              strokeDasharray={circleCircumference}
              strokeDashoffset={circleCircumference - (percent / 100) * circleCircumference}
            />
          </svg>
          {showValue ? <span className="lon-progress-circle-value">{percent}%</span> : null}
        </div>
        {label ? <span className="lon-progress-circle-label">{label}</span> : null}
      </div>
    );
  }

  return (
    <div className={classNames} {...progressProps}>
      {label || showValue ? (
        <div className="lon-progress-header">
          {label ? <span className="lon-progress-label">{label}</span> : <span />}
          {showValue ? <span className="lon-progress-value">{percent}%</span> : null}
        </div>
      ) : null}
      <div
        aria-label={ariaLabel ?? label ?? "进度"}
        aria-valuemax={safeMax}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className="lon-progress-track"
        role="progressbar"
      >
        <span className="lon-progress-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default LonProgress;
