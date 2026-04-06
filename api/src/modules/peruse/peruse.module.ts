import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import {
  PeruseClient,
  peruseClientProvider,
  PeruseClassifyDocumentsOnInvoiceCreateEventHandler,
  PeruseService,
  PeruseSyncJob,
} from './services';

@Module({
  providers: [
    peruseClientProvider,
    PeruseClassifyDocumentsOnInvoiceCreateEventHandler,
    PeruseService,
    PeruseSyncJob,
  ],
  exports: [PeruseClient],
  imports: [
    CommonModule,
    DatabaseModule,
    PersistenceModule,
    BobtailConfigModule,
  ],
  controllers: [],
})
export class PeruseModule {}
