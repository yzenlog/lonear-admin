import type { FormEvent, ReactNode } from "react";

type SearchFormPanelProps = {
  actions: ReactNode;
  children: ReactNode;
  className?: string;
  expanded?: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function SearchFormPanel({ actions, children, className, expanded = false, onSubmit }: SearchFormPanelProps) {
  const formClassName = ["admin-panel", "search-form", className].filter(Boolean).join(" ");
  const gridClassName = ["search-form-grid", expanded ? "expanded" : ""].filter(Boolean).join(" ");

  return (
    <form className={formClassName} onSubmit={onSubmit}>
      <div className={gridClassName}>
        {children}
        <div className="search-form-actions">{actions}</div>
      </div>
    </form>
  );
}

export default SearchFormPanel;
