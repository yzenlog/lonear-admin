import type { StatusTone } from "../../../config/modules";
import "./StatusText.css";

type StatusTextProps = {
  tone: StatusTone;
  children: string;
};

function StatusText({ tone, children }: StatusTextProps) {
  return <span className={`status-text ${tone}`}>{children}</span>;
}

export default StatusText;
