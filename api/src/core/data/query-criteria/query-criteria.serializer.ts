import { FilterOperator, QueryCriteria } from '@core/data';

export const serializeQueryCriteria = (
  query?: Partial<QueryCriteria>,
): string => {
  if (!query) {
    return '';
  }
  const sortQuery = query.sort
    ?.map((sort) => {
      return `sort=${sort.name}:${sort.order}`;
    })
    .join('&');
  const filterQuery = query.filters
    ?.map((filter) => {
      const values = Array.isArray(filter.value)
        ? filter.value
        : [filter.value];
      return `filter=${filter.name}:${filter.operator}:[${values.join(',')}]`;
    })
    .join('&');
  const pageQuery = query.page
    ? `page=${query.page.page}&limit=${query.page.limit}`
    : undefined;

  return [sortQuery, filterQuery, pageQuery].filter((query) => query).join('&');
};

export const serializeQueryCriteriaForTransfersService = (
  query?: Partial<QueryCriteria>,
): string => {
  if (!query) {
    return '';
  }
  const filterQuery = query.filters
    ?.map((filter) => {
      if (filter.operator === FilterOperator.LTE) {
        return `${filter.name}[before]=${filter.value}`;
      }
      if (filter.operator === FilterOperator.GTE) {
        return `${filter.name}[after]=${filter.value}`;
      }
      return `${filter.name}=${filter.value}`;
    })
    .join('&');
  const limit = query.page ? `limit=${query.page.limit}` : undefined;
  if (query.filters?.find((filter) => filter.name === 'cursor')) {
    return [filterQuery, limit].filter((query) => query).join('&');
  }

  return [filterQuery, limit].filter((query) => query).join('&');
};
