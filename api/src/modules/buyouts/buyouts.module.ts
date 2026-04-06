import { AuthModule } from '@module-auth';
import { BrokersModule } from '@module-brokers';
import { CommonModule } from '@module-common';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices';
import { BuyoutsController } from './controllers';
import { PendingBuyoutMapper, PendingBuyoutsBatchMapper } from './data';
import {
  BulkPurchaseCommandHandler,
  BuyoutsService,
  CreateBuyoutsBatchCommandHandler,
  DeleteBuyoutCommandHandler,
  UpdateBuyoutCommandHandler,
} from './services';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    PersistenceModule,
    CqrsModule,
    CommonModule,
    BrokersModule,
    InvoicesModule,
  ],
  providers: [
    BuyoutsService,
    PendingBuyoutMapper,
    PendingBuyoutsBatchMapper,
    UpdateBuyoutCommandHandler,
    CreateBuyoutsBatchCommandHandler,
    DeleteBuyoutCommandHandler,
    BulkPurchaseCommandHandler,
  ],
  controllers: [BuyoutsController],
  exports: [],
})
export class BuyoutsModule {}
