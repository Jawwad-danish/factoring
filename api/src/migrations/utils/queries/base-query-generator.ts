import { Query } from '@mikro-orm/migrations';
import {
  AbstractSqlDriver,
  QueryBuilder,
  RunQueryBuilder,
} from '@mikro-orm/postgresql';

export abstract class BaseQueryGenerator {
  constructor(protected readonly driver: AbstractSqlDriver) {}

  // The only way to get a properly formatted query (text arrays are troublesome)
  protected getQuery<T extends object>(
    qb: QueryBuilder<T> | RunQueryBuilder<T>,
  ): Query {
    return qb.getKnexQuery().toQuery();
  }
}
