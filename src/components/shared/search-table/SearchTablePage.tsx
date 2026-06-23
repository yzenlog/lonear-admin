import type { ReactNode } from "react";

type SearchTablePageProps = {
  children?: ReactNode;
  className?: string;
  search: ReactNode;
  table: ReactNode;
};

function SearchTablePage({ children, className, search, table }: SearchTablePageProps) {
  const pageClassName = ["search-table-page", className].filter(Boolean).join(" ");

  return (
    <div className={pageClassName}>
      {search}
      {table}
      {children}
    </div>
  );
}

export default SearchTablePage;
