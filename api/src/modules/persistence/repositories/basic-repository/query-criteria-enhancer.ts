import { QueryCriteria } from '@core/data';
import { ObjectQuery } from '@mikro-orm/core';
import { SelectQueryBuilder } from '@mikro-orm/postgresql';
import { buildWhereClauses } from './where-clause-factory';
const applyPageCriteria = <E extends object>(
  queryCriteria: QueryCriteria,
  queryBuilder: SelectQueryBuilder<E>,
) => {
  const page = queryCriteria.page;
  queryBuilder.limit(page.limit).offset(page.getOffset());
};

const applySortCriteria = <E extends object>(
  queryCriteria: QueryCriteria,
  queryBuilder: SelectQueryBuilder<E>,
) => {
  const sort = queryCriteria.sort;
  const orderBy = sort.map((sortCriteria) => {
    return { [sortCriteria.name]: sortCriteria.order };
  });
  queryBuilder.orderBy(orderBy);
};

export const applyFilterCriteria = <E extends object>(
  queryCriteria: QueryCriteria,
  queryBuilder: SelectQueryBuilder<E>,
) => {
  const filter = queryCriteria.filters;
  const clause: ObjectQuery<E> = {};
  filter.forEach((filterCriteria) => {
    buildWhereClauses(clause, filterCriteria);
  });
  queryBuilder.where(clause);
};

export const applyQueryCriteria = <E extends object>(
  queryCriteria: QueryCriteria,
  queryBuilder: SelectQueryBuilder<E>,
): SelectQueryBuilder<E> => {
  applyPageCriteria(queryCriteria, queryBuilder);
  applySortCriteria(queryCriteria, queryBuilder);
  applyFilterCriteria(queryCriteria, queryBuilder);
  return queryBuilder;
};
