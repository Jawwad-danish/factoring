import {
  createParamDecorator,
  ExecutionContext,
  ValidationPipe,
} from '@nestjs/common';
import { FilterCriteria } from './filter-criteria.model';
import { parseFilterQuery, parsePageQuery, parseSortQuery } from './parsers';
import { QueryCriteria } from './query-criteria.model';

const VALIDATION_PIPE = new ValidationPipe({ validateCustomDecorators: true });
const exceptionFactory = VALIDATION_PIPE.createExceptionFactory();

const buildFilterCriteria = (
  query: Record<string, unknown>,
  options: CriteriaOptions,
): FilterCriteria[] => {
  try {
    return parseFilterQuery(query, options);
  } catch (error) {
    throw exceptionFactory([error]);
  }
};

const buildPageCriteria = (query: Record<string, unknown>) => {
  try {
    return parsePageQuery(query);
  } catch (error) {
    throw exceptionFactory([error]);
  }
};

const buildSortCriteria = (query: Record<string, unknown>) => {
  try {
    return parseSortQuery(query);
  } catch (error) {
    throw exceptionFactory([error]);
  }
};

const InternalCriteriaDecorator = createParamDecorator(
  (options: CriteriaOptions, ctx: ExecutionContext): QueryCriteria | null => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.query) {
      return null;
    }
    const query = request.query as Record<string, unknown>;
    return new QueryCriteria({
      page: buildPageCriteria(query),
      sort: buildSortCriteria(query),
      filters: buildFilterCriteria(query, options),
    });
  },
);

export interface CriteriaOptions {
  parseFilterValues: boolean;
}

export const Criteria = (
  options: CriteriaOptions = { parseFilterValues: false },
): ParameterDecorator => {
  return InternalCriteriaDecorator(options, VALIDATION_PIPE);
};
