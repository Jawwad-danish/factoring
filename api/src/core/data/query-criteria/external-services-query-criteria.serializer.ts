import { ExternalServicesQueryCriteria } from './external-services-query-criteria.model';

export const externalServicesSerializeQueryCriteria = (
  query?: Partial<ExternalServicesQueryCriteria>,
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
      const hasSpecialChars =
        values.join(',') !== encodeURIComponent(values.join(','));
      if (hasSpecialChars) {
        const encodedInnerContent = encodeURIComponent(values.join(','));
        return `filters=${filter.name}:${filter.operator}:[${encodedInnerContent}]`;
      }
      return `filters=${filter.name}:${filter.operator}:[${values.join(',')}]`;
    })
    .join('&');
  const filterModeQuery = query.filterStrategy
    ? `filterMode=${query.filterStrategy.filterMode}`
    : undefined;
  const pageQuery = query.page
    ? `page=${query.page.page}&limit=${query.page.limit}`
    : undefined;

  return [sortQuery, filterQuery, pageQuery, filterModeQuery]
    .filter((query) => query)
    .join('&');
};
