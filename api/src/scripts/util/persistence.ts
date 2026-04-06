import { EntityManager } from '@mikro-orm/core';
import { DatabaseService } from '@module-database';
import { BasicRepository, IdentityEntity } from '@module-persistence';
import { FileReport } from './report';

export enum OnConflictStrategy {
  MERGE = 'merge',
  IGNORE = 'ignore',
}

export interface SaveOptions<E extends IdentityEntity> {
  onConflict?: {
    strategy: OnConflictStrategy;
    fields: (keyof E)[];
  };
}

export const save = async <E extends IdentityEntity>(
  entities: E[],
  repository: BasicRepository<E>,
  summary: FileReport,
  options?: SaveOptions<E>,
): Promise<void> => {
  try {
    if (options?.onConflict) {
      await repository.upsertAndFlushAll(entities, {
        onConflictAction: options.onConflict.strategy,
        onConflictFields: options.onConflict.fields,
      });
    } else {
      await repository.saveAll(entities);
    }
  } catch (error) {
    console.error(`Could not save all at once. Trying individually.`, error);
    for (const entity of entities) {
      await saveIndividual(entity, repository, summary, options);
    }
  }
};

const saveIndividual = async <E extends IdentityEntity>(
  entity: E,
  repository: BasicRepository<E>,
  summary: FileReport,
  options?: SaveOptions<E>,
) => {
  try {
    if (options?.onConflict) {
      await repository.upsertAndFlush(entity, {
        onConflictAction: options.onConflict.strategy,
        onConflictFields: options.onConflict.fields,
      });
    } else {
      await repository.persistAndFlush(entity);
    }
  } catch (error) {
    if ('constraint' in error) {
      summary.addFailedSavedEntityId(String(entity.id), error.constraint);
      console.error(
        `Could not save with id ${entity.id} because of constraint '${error.constraint}'`,
      );
    } else {
      console.error(`Could not save with id ${entity.id}`, error);
      summary.addFailedSavedEntityId(String(entity.id), 'unknown-cause');
    }
  }
};

export const useRequestContext = async <T>(
  databaseService: DatabaseService,
  callback: (em: EntityManager) => Promise<T>,
): Promise<T> => {
  return await databaseService.withRequestContext(async () => {
    const em = databaseService.getMikroORM().em;
    if (!em) {
      throw new Error('Could not get request context entity manager');
    }
    return await callback(em as EntityManager);
  });
};
