import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { InvoicesTagActivityModule } from '@module-invoices-tag-activity';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { DatabaseModule } from '../database/database.module';
import { TagDefinitionsModule } from '../tag-definitions';
import { BrokerApi } from './api';
import {
  BrokerFactoringConfigMapper,
  BrokerFactoringStatsMapper,
  BrokerMapper,
} from './data';
import {
  BrokerFactoringConfigDataAccess,
  BrokerFactoringStatsEventHandler,
  BrokerLimitTagInvoicesCommandHandler,
  BrokerService,
  BrokerStatsDataAccess,
  CreateBrokerCommandHandler,
  UpdateBrokerCommandHandler,
  CreateBrokerContactCommandHandler,
  UpdateBrokerContactCommandHandler,
  UpdateBrokerFactoringConfigCommandHandler,
  UpdateBrokerFactoringStatsCommandHandler,
  BrokerDocumentsService,
  CreateBrokerDocumentCommandHandler,
  UpdateBrokerDocumentCommandHandler,
  DeleteBrokerDocumentCommandHandler,
} from './services';
import { BrokerDocumentsController, BrokersController } from './controllers';
import { BrokerDocumentsMapper } from './data/mappers/broker-documents.mapper';

const commandHandlers = [
  UpdateBrokerFactoringConfigCommandHandler,
  UpdateBrokerFactoringStatsCommandHandler,
  UpdateBrokerCommandHandler,
  BrokerLimitTagInvoicesCommandHandler,
  UpdateBrokerFactoringConfigCommandHandler,
  CreateBrokerCommandHandler,
  CreateBrokerContactCommandHandler,
  UpdateBrokerContactCommandHandler,
  CreateBrokerDocumentCommandHandler,
  UpdateBrokerDocumentCommandHandler,
  DeleteBrokerDocumentCommandHandler,
];

const eventHandlers = [
  BrokerFactoringStatsEventHandler,
  BrokerLimitTagInvoicesCommandHandler,
];
@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    TagDefinitionsModule,
    BobtailConfigModule,
    InvoicesTagActivityModule,
    PersistenceModule,
    CommonModule,
    CqrsModule,
  ],
  providers: [
    BrokerService,
    BrokerDocumentsService,
    BrokerMapper,
    BrokerDocumentsMapper,
    BrokerApi,
    BrokerFactoringStatsMapper,
    BrokerFactoringConfigDataAccess,
    BrokerFactoringConfigMapper,
    BrokerStatsDataAccess,
    ...eventHandlers,
    ...commandHandlers,
  ],
  exports: [BrokerApi, BrokerService, BrokerStatsDataAccess],
  controllers: [BrokersController, BrokerDocumentsController],
})
export class BrokersModule {}
