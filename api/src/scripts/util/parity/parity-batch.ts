import { AbstractSqlDriver, EntityManager } from '@mikro-orm/postgresql';
import { DatabaseService } from '@module-database';
import { BasicEntity } from '@module-persistence/entities';
import { BasicRepository } from '@module-persistence/repositories';
import * as async from 'async';
import {
  getFiles,
  logExecutionTime,
  parseJSON,
  useRequestContext,
} from '../../util';
import { ParityChecker } from './parity-checker';
import { ParityItemProvider } from './parity-item-provider';
import { ParityReport } from './parity-report';

interface VerifyParityInput<E extends BasicEntity> {
  path: string;
  checker: ParityChecker<E>;
  itemProvider: ParityItemProvider<E>;
  afterCheckHook?: (file: string, v1Item: E, v2Item: E) => Promise<void>;
  mapperFn: (item: any, em: EntityManager) => null | E | E[];
  dependencies: {
    databaseService: DatabaseService;
    repository: BasicRepository<E>;
  };
}

interface WorkerInput<E extends BasicEntity> {
  file: string;
  verifyParityInput: VerifyParityInput<E>;
}

export const verifyParity = async <E extends BasicEntity>(
  input: VerifyParityInput<E>,
) => {
  input.checker.report.startProcessing();
  const queue = async.queue<WorkerInput<E>>(async (task) => {
    try {
      await worker(task);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, 5);

  const files = getFiles(input.path);
  reportSetEstimatedTotal(input.checker.report, files);
  for (const file of files) {
    queue.push({
      file,
      verifyParityInput: input,
    });
  }
  await queue.drain();
  input.checker.report.stopProcessing();
};

const reportSetEstimatedTotal = <E extends BasicEntity>(
  report: ParityReport<E>,
  files: string[],
) => {
  if (files.length > 0) {
    try {
      const items = parseJSON(files[0]);
      if (Array.isArray(items)) {
        const estimated = items.length * files.length;
        report.setEstimatedTotal(estimated);
      }
    } catch (error) {
      const estimated = 50 * files.length;
      console.error(
        `Cannot set an accurate estimate total of items. Will use a default one of ${estimated}`,
      );
      report.setEstimatedTotal(estimated);
    }
  }
};

const worker = async <E extends BasicEntity>(input: WorkerInput<E>) => {
  const { file, verifyParityInput } = input;
  const { mapperFn, dependencies, checker, afterCheckHook, itemProvider } =
    verifyParityInput;
  const { report } = checker;
  const { databaseService, repository } = dependencies;
  await useRequestContext(databaseService, async (em) => {
    const rawV1Items = parseJSON(file, report).flat();

    const v1Items = rawV1Items
      .map((item) => {
        try {
          report.incrementCountItemsForMapping();
          return mapperFn(item, em as EntityManager<AbstractSqlDriver>);
        } catch (error) {
          report.addFailedMappedItemId(item.id, error.message);
          return null;
        }
      })
      .filter((item) => item != null) as E[];
    const timedV2Retrieval = logExecutionTime(itemProvider.retrieveV2Entities);
    const v2Items = await timedV2Retrieval(repository, v1Items);

    const processItems = async () => {
      for (const rawV1Item of rawV1Items) {
        const v1Item = await itemProvider.getV1Item(rawV1Item, v1Items);
        if (!v1Item) {
          console.log(
            `V1 Item ${rawV1Item.id} could not be mapped. Skipping from checking parity`,
          );
          continue;
        }

        const v2Item = await itemProvider.getV2Item(v1Item, rawV1Item, v2Items);

        if (v2Item == null) {
          report.addMissing(file, v1Item);
          continue;
        }
        try {
          await checker.checkEquality(v1Item, v2Item);
          await checker.checkRawEquality(rawV1Item, v2Item);
          if (afterCheckHook) {
            await afterCheckHook(file, v1Item, v2Item);
          }
          report.incrementCountCheckedItems();
        } catch (error) {
          console.log(error);
        }
      }
    };
    await logExecutionTime(processItems)();
  });
};
