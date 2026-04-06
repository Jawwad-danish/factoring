import { AWSModule } from '@module-aws';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import {
  AnalyticsClientReleasedEventHandler,
  AnalyticsInvoiceCreateEventHandler,
  AnalyticsInvoicePurchaseEventHandler,
} from './events';
import {
  SegmentCredentialsService,
  SegmentService,
  segmentAnalyticsProvider,
} from './services';
import { DatabaseModule } from '../database';

@Module({
  imports: [
    BobtailConfigModule,
    AWSModule,
    CommonModule,
    PersistenceModule,
    DatabaseModule,
  ],
  providers: [
    segmentAnalyticsProvider,
    SegmentService,
    SegmentCredentialsService,
    AnalyticsInvoicePurchaseEventHandler,
    AnalyticsInvoiceCreateEventHandler,
    AnalyticsClientReleasedEventHandler,
  ],
  exports: [SegmentService],
})
export class AnalyticsModule {}
