export type PageParams = {
  page?: number;
  pageSize?: number;
  keyword?: string;
};

export type PageResult<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};
