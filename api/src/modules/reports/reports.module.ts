import { ClientsModule } from '@module-clients';
import { BobtailConfigModule } from '@module-config';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { AWSModule } from '../aws';
import { WorkerApiModule } from '../worker/worker.api.module';
import { ReportsController, XlsxFileValidator } from './controllers';
import { ReportsService } from './services';

@Module({
  imports: [
    BobtailConfigModule,
    PersistenceModule,
    WorkerApiModule,
    AWSModule,
    ClientsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, XlsxFileValidator],
  exports: [],
})
export class ReportsModule {}
