import { FilterCriteria, FilterOperator, QueryCriteria } from '@core/data';
import { validationExceptionFactory } from '@core/errors';
import { Paths } from '@core/types';
import { FilterQuery, FindOptions, ObjectQuery } from '@mikro-orm/core';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { BasicEntity } from '../../entities';
import {
  KnownFilterCriteriaOptions,
  KnownFindOptions,
} from './query-criteria.repository';

type ConditionField = {
  [key in FilterOperator]?: any;
};

const buildConditionField = (filter: FilterCriteria): ConditionField => {
  if (filter.operator === FilterOperator.NULL) {
    return { $eq: null };
  }

  if (filter.operator === FilterOperator.NOTNULL) {
    return { $ne: null };
  }

  if (filter.operator === FilterOperator.ILIKE) {
    return { [filter.operator]: `%${filter.value}%` };
  }

  return { [filter.operator]: filter.value };
};

export const mapKnownFilterCriteriaToFilterQuery = async <
  T extends object,
  E extends BasicEntity,
>(
  queryCriteria: QueryCriteria,
  options: KnownFilterCriteriaOptions<T, E>,
): Promise<ObjectQuery<E>> => {
  const plain = queryCriteria.filters.reduce((previous, filter) => {
    let accumulatorFilter = previous[filter.name];
    if (accumulatorFilter) {
      if (!Array.isArray(accumulatorFilter)) {
        accumulatorFilter = [accumulatorFilter];
      }
      accumulatorFilter.push({
        operator: filter.operator,
        value: filter.value,
      });
    } else {
      accumulatorFilter = {
        operator: filter.operator,
        value: filter.value,
      };
    }
    previous[filter.name] = accumulatorFilter;
    return previous;
  }, {});
  const instance = plainToInstance(options.constructor, plain, {
    excludeExtraneousValues: true,
  });
  removeCustomFieldsFromKnownFields(instance, queryCriteria.filters);
  try {
    await validateOrReject(instance);
  } catch (error) {
    throw validationExceptionFactory(error);
  }
  return options.whereClauseGenerator(instance);
};

export const mapKnownFindOptions = async <
  T extends object,
  E extends BasicEntity,
>(
  queryCriteria: QueryCriteria,
  options: KnownFindOptions<T, E>,
): Promise<FindOptions<E, any>> => {
  const plain = queryCriteria.sort.reduce((previous, sort) => {
    let sortAccumulator = previous[sort.name];
    if (sortAccumulator) {
      if (!Array.isArray(sortAccumulator)) {
        sortAccumulator = [sortAccumulator];
      }
      sortAccumulator.push({
        name: sort.name,
        order: sort.order,
      });
    } else {
      sortAccumulator = {
        name: sort.name,
        order: sort.order,
      };
    }
    previous[sort.name] = sortAccumulator;
    return previous;
  }, {});
  const instance = plainToInstance(options.constructor, plain, {});

  removeCustomFieldsFromKnownFields(instance, queryCriteria.sort);
  try {
    await validateOrReject(instance);
  } catch (error) {
    throw validationExceptionFactory(error);
  }
  return options.findOptionsGenerator(instance);
};
export const mapToFilterQuery = <T>(
  criteria: QueryCriteria,
): FilterQuery<T> => {
  const filterQuery: FilterQuery<T> = {};
  criteria.filters.forEach((filter) => {
    const result = filter.name.split('.').reduceRight(
      (acc: any, item: string, index: number, names: string[]) => ({
        [item]: index + 1 < names.length ? acc : buildConditionField(filter),
      }),
      {},
    );
    if (filterQuery[filter.name]) {
      filterQuery[filter.name] = {
        ...filterQuery[filter.name],
        ...result[filter.name],
      };
    } else {
      Object.assign(filterQuery, result);
    }
  });

  return filterQuery as FilterQuery<T>;
};

export const mapToFindOptions = <T>(
  criteria: QueryCriteria,
  populate?: Paths<T>[],
): FindOptions<T> => {
  const findOptions: FindOptions<T> = {
    offset: criteria.page.getOffset(),
    limit: criteria.page.limit,
  };
  if (populate) {
    findOptions.populate = populate as any;
  }
  if (criteria.sort.length > 0) {
    findOptions.orderBy = criteria.sort.reduce((previous, current) => {
      previous[current.name] = current.order;
      return previous;
    }, {});
  }
  return findOptions;
};

const removeCustomFieldsFromKnownFields = (
  customFieldsSource: any,
  target: any[],
) => {
  Object.getOwnPropertyNames(customFieldsSource).forEach((key) => {
    let index = -1;
    while ((index = target.findIndex((sort) => sort.name === key)) != -1) {
      target.splice(index, 1);
    }
  });
};
