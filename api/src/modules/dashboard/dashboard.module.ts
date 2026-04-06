import { Module } from '@nestjs/common';
import { InvoicesModule } from '../invoices';
import { PersistenceModule } from '@module-persistence';
import { DashboardController } from './controllers';
import { DashboardService } from './services';

@Module({
  providers: [DashboardService],
  exports: [],
  imports: [InvoicesModule, PersistenceModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
