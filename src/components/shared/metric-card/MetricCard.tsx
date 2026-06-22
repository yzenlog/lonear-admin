import type { LucideIcon } from "lucide-react";
import "./MetricCard.css";

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  delta: string;
};

function MetricCard({ icon: Icon, label, value, delta }: MetricCardProps) {
  return (
    <article className="metric-card">
      <span className="metric-icon">
        <Icon size={18} strokeWidth={2.1} />
      </span>
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{delta}</em>
    </article>
  );
}

export default MetricCard;
