import { ValidationError, isNumberString } from 'class-validator';
import { PageCriteria } from '../page-criteria.model';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

// Example &page=1&limit=10
export const parsePageQuery = (
  query: Record<string, unknown>,
): PageCriteria => {
  let page = DEFAULT_PAGE;
  let limit = DEFAULT_LIMIT;
  if (query.page) {
    if (!isNumberString(query.page)) {
      const error = new ValidationError();
      error.property = 'page';
      error.value = query.page;
      error.constraints = {
        pattern: `Expected number for page`,
      };
      throw error;
    }
    page = parseInt(`${query.page}`);
  }
  if (query.limit) {
    if (!isNumberString(query.limit)) {
      const error = new ValidationError();
      error.property = 'limit';
      error.value = query.limit;
      error.constraints = {
        pattern: `Expected number for limit`,
      };
      throw error;
    }
    limit = parseInt(`${query.limit}`);
  }
  return new PageCriteria({
    page,
    limit,
  });
};
