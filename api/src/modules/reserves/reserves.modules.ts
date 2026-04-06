import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { CommonModule, ReferralRockWebhookGuard } from '../common';
import { ReservesController, RewardReservesController } from './controllers';
import { ReserveMapper } from './data';
import {
  ClientStatusValidator,
  CreateReserveCommandHandler,
  CreateReserveValidationService,
  DeleteReserveCommandHandler,
  DeleteReserveValidationService,
  ExistingReserveIdValidator,
  FindReserveQueryHandler,
  FindReservesQueryHandler,
  ReleaseOfFundsValidator,
  ReservesService,
} from './services';

@Module({
  imports: [
    BobtailConfigModule,
    CommonModule,
    CqrsModule,
    DatabaseModule,
    PersistenceModule,
  ],
  controllers: [ReservesController, RewardReservesController],
  providers: [
    ClientStatusValidator,
    CreateReserveCommandHandler,
    CreateReserveValidationService,
    DeleteReserveCommandHandler,
    DeleteReserveValidationService,
    ExistingReserveIdValidator,
    FindReserveQueryHandler,
    FindReservesQueryHandler,
    ReleaseOfFundsValidator,
    ReserveMapper,
    ReservesService,
    ReferralRockWebhookGuard,
  ],
  exports: [ReserveMapper],
})
export class ReservesModule {}
