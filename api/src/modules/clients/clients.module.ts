import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { EmailModule } from '@module-email';
import { NotificationsModule } from '@module-notifications';
import { PersistenceModule } from '@module-persistence';
import { RtpModule } from '@module-rtp';
import { WorkerApiModule } from '@module-worker';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth';
import { TagDefinitionsModule } from '../tag-definitions';
import { UsersModule } from '../users';
import { ClientApi } from './api';
import {
  ClientBankAccountsController,
  ClientsController,
  ClientSuccessTeamController,
} from './controller';
import {
  ClientFactoringConfigMapper,
  ClientMapper,
  ClientSuccessTeamMapper,
} from './data';
import {
  ClientBankAccountService,
  ClientEmailChangeValidator,
  ClientOverviewQueryHandler,
  ClientService,
  ClientStatusChangeValidator,
  ClientSuccessTeamChangeValidator,
  CreateClientBankAccountCommandHandler,
  CreateClientCommandHandler,
  CreateClientFactoringConfigCommandHandler,
  FindClientsByIdsQueryHandler,
  MarkBankAccountAsPrimaryCommandHandler,
  NotifyClientStatusChangeEventHandler,
  SyncClientStatusCronJob,
  UpdateClientDocumentCommandHandler,
  UpdateClientFactoringConfigCommandHandler,
  UpdateClientFactoringConfigValidationService,
  UpdateClientsFromFmcsaCommandHandler,
  UpdateClientsFromInactivityCommandHandler,
} from './services';
import { UpdateClientCommandHandler } from './services/commands/handlers/update-client';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    TagDefinitionsModule,
    BobtailConfigModule,
    PersistenceModule,
    ScheduleModule.forRoot(),
    CqrsModule,
    CommonModule,
    WorkerApiModule,
    EmailModule,
    NotificationsModule,
    RtpModule,
    UsersModule,
  ],
  providers: [
    ClientService,
    ClientBankAccountService,
    ClientApi,
    SyncClientStatusCronJob,
    ClientFactoringConfigMapper,
    UpdateClientFactoringConfigCommandHandler,
    CreateClientFactoringConfigCommandHandler,
    UpdateClientsFromInactivityCommandHandler,
    UpdateClientDocumentCommandHandler,
    UpdateClientFactoringConfigValidationService,
    ClientStatusChangeValidator,
    ClientSuccessTeamChangeValidator,
    ClientOverviewQueryHandler,
    ClientSuccessTeamMapper,
    CreateClientCommandHandler,
    ClientMapper,
    ClientEmailChangeValidator,
    UpdateClientCommandHandler,
    NotifyClientStatusChangeEventHandler,
    UpdateClientsFromFmcsaCommandHandler,
    CreateClientBankAccountCommandHandler,
    MarkBankAccountAsPrimaryCommandHandler,
    FindClientsByIdsQueryHandler,
  ],
  exports: [
    ClientService,
    ClientBankAccountService,
    ClientFactoringConfigMapper,
    ClientApi,
  ],
  controllers: [
    ClientsController,
    ClientSuccessTeamController,
    ClientBankAccountsController,
  ],
})
export class ClientsModule {}
