import { batch } from '@core/util';
import { EntityManager, RequestContext } from '@mikro-orm/core';
import { AbstractSqlDriver } from '@mikro-orm/postgresql';
import { DatabaseService } from '@module-database';
import {
  IdentityEntity,
  PrimitiveEntity,
  UserEntity,
} from '@module-persistence/entities';
import * as async from 'async';
import { BasicRepository } from '../../modules/persistence';
import { getSystemID } from './checks';
import { getFiles, parseJSON } from './file';
import { SaveOptions, save } from './persistence';
import { DomainReport } from './report';

type ImportInput<E extends IdentityEntity> = {
  path: string;
  report: DomainReport;
  mapperFn: (item: any, em: EntityManager) => null | E | E[];
  afterMapperFn?: (item: any[], entities: E[]) => void;
  dependencies: {
    databaseService: DatabaseService;
    repository: BasicRepository<E>;
  };
  concurrent?: number;
  saveOptions?: SaveOptions<E>;
};

type WorkerInput<E extends IdentityEntity> = {
  file: string;
  importInput: ImportInput<E>;
};

const worker = async <E extends IdentityEntity>(input: WorkerInput<E>) => {
  const { report, mapperFn } = input.importInput;
  const { databaseService, repository } = input.importInput.dependencies;
  await databaseService.withRequestContext(async () => {
    const em =
      RequestContext.getEntityManager() as EntityManager<AbstractSqlDriver>;
    if (!em) {
      throw new Error('Could not get request context entity manager');
    }
    const fileReport = report.ofFile(input.file);
    const items = parseJSON(input.file, report);
    const entities = items
      .flatMap((item) => {
        try {
          fileReport.incrementCountItemsForMapping();
          return mapperFn(item, em);
        } catch (error) {
          fileReport.addFailedMappedItemId(item.id, error.message);
          return null;
        }
      })
      .filter((item) => item != null) as E[];

    if (input.importInput.afterMapperFn) {
      input.importInput.afterMapperFn(items, entities);
    }
    const entityBatches = batch(entities, 200);
    for (const entityBatch of entityBatches) {
      await save(
        entityBatch,
        repository,
        fileReport,
        input.importInput.saveOptions,
      );
    }
  });
};

export const importEntities = async <E extends IdentityEntity>(
  input: ImportInput<E>,
) => {
  const queue = async.queue<WorkerInput<E>>(async (task) => {
    try {
      await worker(task);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, input?.concurrent || 5);

  const files = getFiles(input.path);
  input.report.setTotalFilesForParsing(files.length);
  if (files.length === 0) {
    return;
  }
  for (const file of files) {
    queue.push({
      file,
      importInput: input,
    });
  }
  await queue.drain();
};

export const referenceUserData = async <E extends PrimitiveEntity>(
  entity: E,
  item: any,
  em: EntityManager,
) => {
  entity.createdBy = item.created_by
    ? em.getReference(UserEntity, item.created_by)
    : em.getReference(UserEntity, getSystemID());
  entity.updatedBy = item.updated_by
    ? em.getReference(UserEntity, item.updated_by)
    : em.getReference(UserEntity, getSystemID());
};
