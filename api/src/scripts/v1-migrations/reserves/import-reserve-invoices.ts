import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import {
  InvoiceEntity,
  ReserveEntity,
  ReserveInvoiceEntity,
} from '@module-persistence/entities';
import { ReserveInvoiceRepository } from '@module-persistence/repositories';
import { INestApplicationContext } from '@nestjs/common';
import * as path from 'path';
import { ImportReport, OnConflictStrategy, importEntities } from '../../util';
import { buildReserveInvoiceEntity } from './reserve-mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_RESERVES_PATH',
);

export const importReserveInvoices = async (
  clientId: null | string,
  report: ImportReport,
  app: INestApplicationContext,
) => {
  const databaseService = app.get(DatabaseService);
  const repository = app.get(ReserveInvoiceRepository);

  await importEntities<ReserveInvoiceEntity>({
    path: path.resolve(PATH, clientId ?? ''),
    report: report.ofDomain('reserve-invoice'),
    mapperFn: (item, em) => {
      if (item.invoice_id) {
        const entity = buildReserveInvoiceEntity(item, em);
        entity.reserve = em.getReference(ReserveEntity, item.id);
        entity.invoice = em.getReference(InvoiceEntity, item.invoice_id);

        return entity;
      }

      return null;
    },
    dependencies: { databaseService, repository: repository },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.IGNORE,
        fields: ['reserve'],
      },
    },
  });
};

// run(
//   () => importReserves('8f4895dc-6bef-47e6-b1d9-b7d134952e49'),
//   RESULT,
//   __dirname,
// );
