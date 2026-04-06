import { ValidationError } from 'class-validator';
import { SortCriteria, SortingOrder } from '../sort-criteria.model';

const VALUE_SEPARATOR = ':';

// Example &sort=createdAt:ASC&sort=updatedAt:DESC
export const parseSortQuery = (
  query: Record<string, unknown>,
): SortCriteria[] => {
  // Get sort criteria from either sort or sort[] parameter
  const sortParam = query.sort ?? query['sort[]'];

  if (!sortParam) {
    return [];
  }

  const sortQueryParams = Array.isArray(sortParam) ? sortParam : [sortParam];

  return sortQueryParams.map((sort) => {
    const split = sort.split(VALUE_SEPARATOR);
    if (split.length !== 2) {
      const error = new ValidationError();
      error.property = 'sort';
      error.value = sort;
      error.constraints = {
        pattern: `Expected 'name${VALUE_SEPARATOR}value' pattern for item ${sort}`,
      };
      throw error;
    }
    return new SortCriteria({
      name: split[0],
      order: split[1] as SortingOrder,
    });
  });
};
