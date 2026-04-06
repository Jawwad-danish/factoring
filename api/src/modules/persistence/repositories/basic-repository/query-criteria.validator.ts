import {
  FilterCriteria,
  FilterOperator,
  QueryCriteria,
  SortCriteria,
} from '@core/data';
import { UnexpectedQueryParamValueError } from '@core/errors';
import { isEmpty } from 'lodash';
import { QueryCriteriaConfiguration } from './query-criteria.configuration';

export class QueryCriteriaSanitizer<E extends Record<string, any>> {
  constructor(private readonly configuration: QueryCriteriaConfiguration<E>) {}

  private validatePageCriteria(queryCriteria: QueryCriteria) {
    const { page } = queryCriteria;
    const { maxItemsPerPage } = this.configuration.pagination;
    if (page.limit > maxItemsPerPage) {
      throw new UnexpectedQueryParamValueError(
        'page',
        page.limit,
        `Maximum items per page ${maxItemsPerPage}`,
      );
    }
  }

  private validateAndGetSortCriteria(
    queryCriteria: QueryCriteria,
  ): SortCriteria[] {
    if (queryCriteria.sort.length === 0) {
      return Object.entries(this.configuration.defaultSortableColumns).map(
        ([column, order]) => {
          return new SortCriteria({
            name: column,
            order: order,
          });
        },
      );
    }

    return queryCriteria.sort.map((sort) => {
      const foundSortColumn = Object.entries(
        this.configuration.sortableColumns,
      ).find((entry) => entry[0] === sort.name);

      if (!foundSortColumn) {
        throw new UnexpectedQueryParamValueError(
          'sort',
          sort.name,
          'Cannot order by this sort',
        );
      }
      if (!foundSortColumn[1]?.has(sort.order)) {
        throw new UnexpectedQueryParamValueError(
          'sort',
          sort.name,
          'Cannot use this order direction',
        );
      }
      return sort;
    });
  }

  private validateFilterCriteriaValueCount(filterCriteria: FilterCriteria) {
    const nullOperators = [FilterOperator.NULL, FilterOperator.NOTNULL];
    if (
      nullOperators.includes(filterCriteria.operator) &&
      !isEmpty(filterCriteria.value)
    ) {
      throw new UnexpectedQueryParamValueError(
        'filter',
        filterCriteria.name,
        'Expected no values',
      );
    }

    if (
      [
        FilterOperator.EQ,
        FilterOperator.GT,
        FilterOperator.GTE,
        FilterOperator.LT,
        FilterOperator.LTE,
        FilterOperator.ILIKE,
      ].includes(filterCriteria.operator) &&
      Array.isArray(filterCriteria.value)
    ) {
      throw new UnexpectedQueryParamValueError(
        'filter',
        filterCriteria.name,
        'Expected only one value',
      );
    }
  }

  private validateAndGetFilterCriteria(
    queryCriteria: QueryCriteria,
  ): FilterCriteria[] {
    return queryCriteria.filters.map((filterCriteria) => {
      const name = filterCriteria.name.split('.')[0];
      const foundSearchableColumnOperators =
        this.configuration.searchableColumns[name];
      if (!foundSearchableColumnOperators) {
        throw new UnexpectedQueryParamValueError(
          'filter',
          filterCriteria.name,
          'Cannot search values for this filter',
        );
      }
      this.validateFilterCriteriaValueCount(filterCriteria);
      if (!foundSearchableColumnOperators.has(filterCriteria.operator)) {
        throw new UnexpectedQueryParamValueError(
          'filter',
          filterCriteria.name,
          'Cannot use this operator for this filter',
        );
      }
      return new FilterCriteria({
        name: filterCriteria.name,
        operator: filterCriteria.operator,
        value: filterCriteria.value,
      });
    });
  }

  validateAndGet(queryCriteria: QueryCriteria): QueryCriteria {
    if (this.configuration === null) {
      return queryCriteria;
    }

    this.validatePageCriteria(queryCriteria);
    return new QueryCriteria({
      page: queryCriteria.page,
      sort: this.validateAndGetSortCriteria(queryCriteria),
      filters: this.validateAndGetFilterCriteria(queryCriteria),
    });
  }
}
