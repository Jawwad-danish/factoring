import { AWSModule } from '@module-aws';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { FeatureTogglesModule } from '@module-feature-toggles';
import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients';
import { CqrsModule } from '../cqrs';
import { DatabaseModule } from '../database';
import { PersistenceModule } from '../persistence';
import { WorkerApiModule } from '../worker';
import {
  QuickbooksApi,
  QuickbooksJournalEntryApiMapper,
  quickbooksClientProvider,
} from './api';
import { QuickbooksController } from './controllers/quickbooks.controller';
import { JournalEntryMapper } from './data';
import {
  QuickbooksCredentialsService,
  QuickbooksService,
  SyncQuickbooksClientsCronJob,
} from './services';
import {
  SyncAccountsCommandHandler,
  SyncJournalEntryCommandHandler,
  SyncQuickbooksClientsCommandHandler,
} from './services/commands';
import { JournalEntryEventOrchestrator } from './services/events';
import {
  BatchPaymentsJournalEntryStrategy,
  BrokerPaymentsJournalEntryStrategy,
  JournalEntryStrategyFactory,
  ReservesJournalEntryStrategy,
} from './services/journal-entries';
import { FindJournalEntriesQueryHandler } from './services/queries';

const handlers = [
  FindJournalEntriesQueryHandler,
  SyncAccountsCommandHandler,
  SyncQuickbooksClientsCommandHandler,
  SyncJournalEntryCommandHandler,
];

const eventHandlers = [JournalEntryEventOrchestrator];

const strategies = [
  ReservesJournalEntryStrategy,
  BrokerPaymentsJournalEntryStrategy,
  BatchPaymentsJournalEntryStrategy,
];
@Module({
  imports: [
    BobtailConfigModule,
    AWSModule,
    CommonModule,
    PersistenceModule,
    CqrsModule,
    DatabaseModule,
    ClientsModule,
    WorkerApiModule,
    FeatureTogglesModule,
  ],
  controllers: [QuickbooksController],
  providers: [
    QuickbooksCredentialsService,
    QuickbooksService,
    quickbooksClientProvider,
    QuickbooksApi,
    JournalEntryMapper,
    QuickbooksJournalEntryApiMapper,
    JournalEntryStrategyFactory,
    SyncQuickbooksClientsCronJob,
    ...strategies,
    ...eventHandlers,
    ...handlers,
  ],
  exports: [QuickbooksService],
})
export class QuickbooksModule {}
