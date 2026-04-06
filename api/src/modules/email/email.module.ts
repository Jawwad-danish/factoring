import { AWSModule, SESService } from '@module-aws';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { EmailConfiguration, EmailService } from './services';
import {
  ClientToActiveEmail,
  ClientToOnHoldEmail,
  InvoicePurchaseEmail,
  InvoiceShareEmail,
  NoticeOfAssignmentEmail,
} from './templates';

@Module({
  providers: [
    EmailConfiguration,
    EmailService,
    SESService,
    NoticeOfAssignmentEmail,
    InvoicePurchaseEmail,
    InvoiceShareEmail,
    ClientToActiveEmail,
    ClientToOnHoldEmail,
  ],
  exports: [
    EmailService,
    NoticeOfAssignmentEmail,
    InvoicePurchaseEmail,
    InvoiceShareEmail,
    ClientToActiveEmail,
    ClientToOnHoldEmail,
  ],
  imports: [AWSModule, BobtailConfigModule, CommonModule, PersistenceModule],
  controllers: [],
})
export class EmailModule {}
