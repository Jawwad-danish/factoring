import { QueryCriteria } from '@core/data';
import { ClassConstructor, Paths } from '@core/types';
import {
  EntityClass,
  FilterQuery,
  FindOptions,
  LoadStrategy,
  ObjectQuery,
} from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import { BasicEntity } from '@module-persistence/entities';
import merge from 'ts-deepmerge';
import { BasicRepository } from './basic.repository';
import { QueryCriteriaConfiguration } from './query-criteria.configuration';
import {
  mapKnownFilterCriteriaToFilterQuery,
  mapKnownFindOptions,
  mapToFilterQuery,
  mapToFindOptions,
} from './query-criteria.mapper';
import { QueryCriteriaSanitizer } from './query-criteria.validator';
export interface KnownFilterCriteriaOptions<
  T extends object,
  E extends BasicEntity,
> {
  constructor: ClassConstructor<T>;
  whereClauseGenerator: (input: T) => Promise<ObjectQuery<E>>;
}

export interface KnownFindOptions<T extends object, E extends BasicEntity> {
  constructor: ClassConstructor<T>;
  findOptionsGenerator: (input: T) => Promise<FindOptions<E, any>>;
}

export interface QueryCriteriaOptions<
  TFilter extends object,
  TSort extends object,
  E extends BasicEntity,
> {
  additionalWhereClause?: FilterQuery<E>;
  knownFilterCriteriaOptions?: KnownFilterCriteriaOptions<TFilter, E>;
  knownFindOptions?: KnownFindOptions<TSort, E>;
  populate?: Paths<E>[];
  strategy?: LoadStrategy;
}

export interface QueryConstraints<E> {
  whereClause: ObjectQuery<E>;
  findOptions: FindOptions<E, any>;
}

export abstract class QueryCriteriaRepository<
  E extends BasicEntity,
> extends BasicRepository<E> {
  private queryCriteriaSanitizer: QueryCriteriaSanitizer<E>;

  constructor(databaseService: DatabaseService, target: EntityClass<E>) {
    super(databaseService, target);

    this.queryCriteriaSanitizer = new QueryCriteriaSanitizer<E>(
      this.getQueryCriteriaConfiguration(),
    );
  }

  async findByQueryCriteria<T extends object, P extends object>(
    queryCriteria: QueryCriteria,
    options?: QueryCriteriaOptions<T, P, E>,
  ): Promise<[E[], number]> {
    const { whereClause, findOptions } = await this.buildQueryConstraints(
      queryCriteria,
      options,
    );
    const items = await this.repository.find(whereClause, findOptions);
    const count = await this.repository.count(whereClause);
    return [items, count];
  }

  async buildQueryConstraints<T extends object, P extends object>(
    queryCriteria: QueryCriteria,
    options?: QueryCriteriaOptions<T, P, E>,
  ): Promise<QueryConstraints<E>> {
    let whereClause: ObjectQuery<E> = {} as ObjectQuery<E>;
    let customFindOptions: FindOptions<E, any> = {
      strategy: options?.strategy,
    };
    if (options?.knownFilterCriteriaOptions) {
      whereClause = await mapKnownFilterCriteriaToFilterQuery<T, E>(
        queryCriteria,
        options.knownFilterCriteriaOptions,
      );
    }

    if (options?.knownFindOptions) {
      customFindOptions = await mapKnownFindOptions(
        queryCriteria,
        options.knownFindOptions,
      );
    }
    const sanitizedQueryCriteria =
      this.queryCriteriaSanitizer.validateAndGet(queryCriteria);
    const filterQuery = mapToFilterQuery<E>(sanitizedQueryCriteria);
    const baseFindOptions = mapToFindOptions<E>(
      sanitizedQueryCriteria,
      options?.populate,
    );
    const findOptions = merge(
      customFindOptions,
      baseFindOptions,
    ) as FindOptions<E, any>;
    Object.assign(whereClause, filterQuery);
    Object.assign(whereClause, options?.additionalWhereClause);
    return { whereClause, findOptions };
  }

  protected abstract getQueryCriteriaConfiguration(): QueryCriteriaConfiguration<E>;
}
