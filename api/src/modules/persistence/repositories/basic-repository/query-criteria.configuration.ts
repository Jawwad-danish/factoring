import { FilterOperator, SortingOrder } from '@core/data';

export interface QueryCriteriaConfiguration<E> {
  sortableColumns: {
    [P in keyof E]?: Set<SortingOrder>;
  };
  defaultSortableColumns: {
    [P in keyof E]?: SortingOrder;
  };
  searchableColumns: {
    [P in keyof E]?: Set<FilterOperator>;
  };
  pagination: {
    maxItemsPerPage: number;
  };
}
