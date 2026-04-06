import { AuthModule } from '@module-auth';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { CommonModule } from '../common';
import { TransfersApi } from './api';

@Module({
  controllers: [],
  providers: [TransfersApi],
  exports: [TransfersApi],
  imports: [
    BobtailConfigModule,
    CqrsModule,
    PersistenceModule,
    AuthModule,
    CommonModule,
  ],
})
export class TransfersApiModule {}
