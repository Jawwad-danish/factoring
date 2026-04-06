import { QueryCriteria } from '../query-criteria';

export class PaginationResult {
  readonly totalPages: number;

  constructor(
    readonly page: number,
    readonly itemsPerPage: number,
    readonly totalItems: number,
  ) {
    const pages = Math.floor(totalItems / itemsPerPage);
    this.totalPages = totalItems % itemsPerPage == 0 ? pages : pages + 1;
  }
}

export class PageResult<T> {
  constructor(
    readonly items: T[],
    readonly pagination: PaginationResult,
    readonly additionalAttributes?: Record<string, any>,
  ) {}

  static from<T>(items: T[], itemsCount: number, criteria: QueryCriteria) {
    return new PageResult<T>(
      items,
      new PaginationResult(criteria.page.page, criteria.page.limit, itemsCount),
    );
  }
}
