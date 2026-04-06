import { AuthModule } from '@module-auth';
import { AWSModule } from '@module-aws';
import { ClientsModule } from '@module-clients';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import {
  FeatureTogglesModule,
  LaunchDarklyModule,
} from '@module-feature-toggles';
import { InvoicesTagActivityModule } from '@module-invoices-tag-activity';
import { PersistenceModule } from '@module-persistence';
import { RtpModule } from '@module-rtp';
import { Module } from '@nestjs/common';
import { ClientPaymentsModule } from '../client-payments/client-payments.module';
import { WorkerApiModule } from '../worker';
import { TransfersApi } from './api';
import { TransfersController } from './controllers';
import { TransfersMapper } from './data';
import {
  FindCompletedTransfersQueryHandler,
  FindUpcomingExpediteTransfersQueryHandler,
  FindUpcomingRegularTransfersQueryHandler,
  ListTransfersQueryHandler,
  TransferConfigurer,
  TransferService,
  VerifyRtpForClientsQueryHandler,
} from './services';
import {
  AchUpdateTransferStatusStrategy,
  CreatePaymentOrderCommandHandler,
  DebitUpdateTransferStatusStrategy,
  InitiateDebitRegularTransferCommandHandler,
  InitiateExpediteTransferCommandHandler,
  InitiateRegularTransferCommandHandler,
  TransferDataAccess,
  UpdateTransferStatusCommandHandler,
  UpdateTransferStatusStrategyFactory,
  WireUpdateTransferStatusStrategy,
} from './services/commands';
import { ScheduledRegularCronJob } from './services/cron-jobs';
@Module({
  controllers: [TransfersController],
  providers: [
    FindUpcomingExpediteTransfersQueryHandler,
    FindUpcomingRegularTransfersQueryHandler,
    ListTransfersQueryHandler,
    InitiateExpediteTransferCommandHandler,
    InitiateDebitRegularTransferCommandHandler,
    UpdateTransferStatusCommandHandler,
    InitiateRegularTransferCommandHandler,
    CreatePaymentOrderCommandHandler,
    TransferConfigurer,
    TransferService,
    TransferDataAccess,
    TransfersApi,
    TransfersMapper,
    FindCompletedTransfersQueryHandler,
    AchUpdateTransferStatusStrategy,
    WireUpdateTransferStatusStrategy,
    DebitUpdateTransferStatusStrategy,
    UpdateTransferStatusStrategyFactory,
    ScheduledRegularCronJob,
    VerifyRtpForClientsQueryHandler,
  ],
  exports: [TransferService],
  imports: [
    BobtailConfigModule,
    CqrsModule,
    PersistenceModule,
    InvoicesTagActivityModule,
    AuthModule,
    AWSModule,
    ClientPaymentsModule,
    CommonModule,
    DatabaseModule,
    FeatureTogglesModule,
    LaunchDarklyModule,
    RtpModule,
    ClientsModule,
    WorkerApiModule,
  ],
})
export class TransfersModule {}
