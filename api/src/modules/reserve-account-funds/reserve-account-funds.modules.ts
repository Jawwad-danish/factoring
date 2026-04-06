import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common';
import { ReserveAccountFundsController } from './controllers';
import { ReserveAccountFundsMapper } from './data';
import {
  CreateReserveAccountFundsCommandHandler,
  FindReserveQueryHandler,
  ReserveAccountFundsService,
} from './services';

@Module({
  imports: [
    BobtailConfigModule,
    CommonModule,
    CqrsModule,
    DatabaseModule,
    PersistenceModule,
  ],
  controllers: [ReserveAccountFundsController],
  providers: [
    ReserveAccountFundsService,
    ReserveAccountFundsMapper,
    CreateReserveAccountFundsCommandHandler,
    FindReserveQueryHandler,
  ],
})
export class ReserveAccountFundsModule {}
