import { ClientsModule } from '@module-clients';
import { Module } from '@nestjs/common';
import { QuickbooksModule } from '@module-quickbooks';
import { CronJobRunner } from './services';
import { TransfersModule } from '../transfers';

@Module({
  imports: [ClientsModule, QuickbooksModule, TransfersModule],
  providers: [CronJobRunner],
  exports: [CronJobRunner],
})
export class CronModule {}
