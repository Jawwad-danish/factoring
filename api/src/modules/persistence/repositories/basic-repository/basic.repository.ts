import { EntityNotFoundError } from '@core/errors';
import {
  EntityClass,
  EntityData,
  EntityMetadata,
  EntityRepository,
  FilterQuery,
  FindOneOptions,
  FindOptions,
  FromEntityType,
  Loaded,
  ObjectQuery,
  UpsertManyOptions,
  UpsertOptions,
} from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { DatabaseService } from '@module-database';
import { IdentityEntity } from '../../entities';

export abstract class BasicRepository<E extends IdentityEntity> {
  protected repository: EntityRepository<E>;
  protected entityManager: EntityManager;
  entityName: EntityClass<E>;

  constructor(databaseService: DatabaseService, target: EntityClass<E>) {
    this.entityManager = databaseService.getMikroORM().em as EntityManager;
    this.repository = this.entityManager.getRepository(target);
    this.entityName = target;
  }

  async flush(): Promise<void> {
    return this.entityManager.flush();
  }

  persist<TEntity extends E | E[]>(entity: TEntity): TEntity {
    this.entityManager.persist(entity);
    return entity;
  }

  persistAll(entities: E[]): E[] {
    this.entityManager.persist(entities);
    return entities;
  }

  async persistAndFlush(entity: E): Promise<E> {
    await this.entityManager.persistAndFlush(entity);
    return entity;
  }

  async upsertAndFlush(entity: E, options?: UpsertOptions<E>): Promise<E> {
    await this.entityManager.upsert(this.entityName, entity, options);
    await this.entityManager.flush();
    return entity;
  }

  async upsertAndFlushAll(
    entities: E[],
    options?: UpsertManyOptions<E>,
  ): Promise<E[]> {
    const upsertedEntities = await this.entityManager.upsertMany(
      this.entityName,
      entities,
      options,
    );
    await this.entityManager.flush();
    return upsertedEntities;
  }

  async hardDelete(where: FilterQuery<E>): Promise<number> {
    return this.entityManager.nativeDelete(this.entityName, where);
  }

  async saveAll(entities: E[]): Promise<E[]> {
    entities.forEach((e) => this.entityManager.persist(e));
    await this.entityManager.flush();
    return entities;
  }

  findOneById<P extends string = never>(
    id: string | number,
    options?: FindOneOptions<E, P>,
  ): Promise<E | null> {
    const where = { id } as FilterQuery<E>;
    return this.repository.findOne(where, options);
  }

  findByIds(ids: string[] | number[]): Promise<E[]> {
    const where = { id: { $in: ids } } as unknown as FilterQuery<E>;
    return this.repository.find(where);
  }

  find<P extends string = never>(
    where: ObjectQuery<E>,
    options?: FindOptions<E, P>,
  ): Promise<Loaded<E, P>[]> {
    return this.repository.find(where, options);
  }

  findAll<P extends string = never>(
    where: FilterQuery<E> = {},
    options?: FindOptions<E, P>,
  ): Promise<[Loaded<E, P>[], number]> {
    return this.repository.findAndCount(where, options);
  }

  async getOneById<P extends string = never>(
    id: string | number,
    options?: FindOptions<E, P>,
  ): Promise<E> {
    const found = await this.findOneById(id, options);
    if (found === null) {
      throw EntityNotFoundError.byId(`${id}`);
    }
    return found;
  }

  execute(query: string, parameters?: any[]): Promise<any> {
    return this.entityManager.execute(query, parameters, 'all');
  }

  assign(entity: E, data: EntityData<FromEntityType<E>>) {
    this.entityManager.assign(entity, data, { merge: true });
  }

  count(filterQuery: FilterQuery<E> = {}): Promise<number> {
    return this.repository.count(filterQuery);
  }

  queryBuilder(alias?: string) {
    return this.entityManager.createQueryBuilder(this.entityName, alias);
  }

  readOnlyQueryBuilder(alias?: string) {
    return this.entityManager.createQueryBuilder(
      this.entityName,
      alias,
      'read',
    );
  }

  protected getRelations(): string[] {
    const metadata: EntityMetadata<E> = this.entityManager
      .getMetadata()
      .get(this.entityName.name);

    return metadata.relations.map((r) => r.name);
  }

  protected getTableName(): string {
    const metadata = this.entityManager
      .getMetadata()
      .find(this.entityName.name);
    if (!metadata) {
      throw new Error(
        `Could not find metadata for entity ${this.entityName.name}`,
      );
    }
    return metadata.tableName;
  }
}
