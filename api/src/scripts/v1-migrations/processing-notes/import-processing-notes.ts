import { environment } from '@core/environment';
import { DatabaseService } from '@module-database';
import { ProcessingNotesRepository } from '@module-persistence/repositories';
import { NestFactory } from '@nestjs/core';
import * as path from 'path';
import { AppModule } from '../../../modules/app/app.module';
import {
  OnConflictStrategy,
  importEntities,
  referenceUserData,
  run,
} from '../../util';
import { ImportReport } from '../../util/report';
import { buildEntity } from './processing-notes.mapper';

const PATH = environment.util.checkAndGetForEnvVariable(
  'SCRIPT_IMPORT_PROCESSING_NOTES_PATH',
);

const report = new ImportReport();

export const importProcessingNotes = async (report = new ImportReport()) => {
  const app = await NestFactory.createApplicationContext(AppModule);
  const databaseService = app.get(DatabaseService);
  const repository = app.get(ProcessingNotesRepository);

  await importEntities({
    path: path.resolve(PATH),
    report: report.ofDomain('processing-notes'),
    mapperFn: (item, em) => {
      const entity = buildEntity(item);
      referenceUserData(entity, item, em);
      return entity;
    },
    dependencies: {
      databaseService,
      repository: repository,
    },
    saveOptions: {
      onConflict: {
        strategy: OnConflictStrategy.MERGE,
        fields: ['id'],
      },
    },
  });
};

run(importProcessingNotes, report, __dirname);
