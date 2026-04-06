import { FilterCriteria, FilterOperator } from '@core/data';
import { ObjectQuery, QBFilterQuery } from '@mikro-orm/core';
import { ErrorFactory } from '@core/errors';

export const buildWhereClauses = <E extends object>(
  clause: ObjectQuery<E>,
  filterCriteria: FilterCriteria,
): void => {
  switch (filterCriteria.operator) {
    case FilterOperator.ILIKE:
      clause[filterCriteria.name] = {
        [filterCriteria.operator]: `%${filterCriteria.value}%`,
      };
      break;
    case FilterOperator.EQ:
    case FilterOperator.GT:
    case FilterOperator.GTE:
    case FilterOperator.IN:
    case FilterOperator.LT:
    case FilterOperator.LTE:
    case FilterOperator.NE:
    case FilterOperator.NIN:
      const path = filterCriteria.name.split('.');
      if (path.length > 1) {
        const nestedCondition = buildNestedWhereClause(
          path,
          filterCriteria.operator,
          filterCriteria.value,
        );
        clause = { ...clause, ...nestedCondition };
      } else {
        clause[filterCriteria.name] = {
          [filterCriteria.operator]: filterCriteria.value,
        };
      }
      break;
    default:
      throw ErrorFactory.validateProperty(
        { filter: `${filterCriteria.operator}` },
        'filter',
        'defined filters',
      );
  }
};

const buildNestedWhereClause = <E extends object>(
  names: string[],
  operator: FilterOperator,
  value: unknown | unknown[],
): QBFilterQuery<E> => {
  const reducer = (acc: any, item: string, index: number, names: string[]) => ({
    [item]: index + 1 < names.length ? acc : { [operator]: value },
  });
  return names.reduceRight(reducer, {});
};
