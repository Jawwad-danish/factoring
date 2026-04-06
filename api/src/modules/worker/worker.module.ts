import { BobtailConfigModule } from '@module-config';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { ReportsEngineModule } from '../reports/engine/reports-engine.module';
import { messageConsumerProvider } from './consumers';
import { JobWorker } from './workers/job-worker';
import { CqrsModule } from '@module-cqrs';
import { BobtailLoggingModule } from '@module-logger';
import { CronModule } from '@module-cron';

// Do not import this module in any module from the main application
@Module({
  imports: [
    DatabaseModule,
    BobtailConfigModule,
    PersistenceModule,
    ReportsEngineModule,
    CqrsModule,
    BobtailLoggingModule,
    CronModule,
  ],
  providers: [JobWorker, messageConsumerProvider],
  exports: [],
})
export class WorkerModule {}
