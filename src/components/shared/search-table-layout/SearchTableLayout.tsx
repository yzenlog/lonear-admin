import type { ReactNode } from "react";

type SearchTableLayoutProps = {
  children?: ReactNode;
  className?: string;
  search: ReactNode;
  table: ReactNode;
};

function SearchTableLayout({ children, className, search, table }: SearchTableLayoutProps) {
  const layoutClassName = ["search-table-layout", className].filter(Boolean).join(" ");

  return (
    <div className={layoutClassName}>
      {search}
      {table}
      {children}
    </div>
  );
}

export default SearchTableLayout;
