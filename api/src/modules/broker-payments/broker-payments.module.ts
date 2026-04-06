import { AuthModule } from '@module-auth';
import { BrokersModule } from '@module-brokers';
import { ClientsModule } from '@module-clients';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { CqrsModule } from '@module-cqrs';
import { DatabaseModule } from '@module-database';
import { InvoicesTagActivityModule } from '@module-invoices-tag-activity';
import { PersistenceModule } from '@module-persistence';
import { BrokerPaymentRepository } from '@module-persistence/repositories';
import { ReservesModule } from '@module-reserves';
import { TagDefinitionsModule } from '@module-tag-definitions';
import { Module } from '@nestjs/common';
import { BobtailLoggingModule } from '../logging/logging.module';
import { BrokerPaymentController } from './controllers';
import { BrokerPaymentMapper } from './data';
import {
  BrokerPaymentDeletedAuditLogEventHandler,
  BrokerPaymentService,
  BrokerPaymentUpdatedAuditLogEventHandler,
  CreateBrokerPaymentCommandHandler,
  CreateBrokerPaymentReserveRule,
  CreateBrokerPaymentRuleService,
  CreateBrokerPaymentUpdateAssignmentRule,
  CreateBrokerPaymentUpdateInvoiceRule,
  CreateBrokerPaymentValidationService,
  DeleteBrokerPaymentCommandHandler,
  DeleteBrokerPaymentReserveRule,
  DeleteBrokerPaymentRuleService,
  DeleteBrokerPaymentUpdateAssignmentRule,
  DeleteBrokerPaymentUpdateInvoiceRule,
  DeleteBrokerPaymentValidationService,
  InvoiceClientPaymentStatusValidator,
  InvoiceStatusPurchasedValidator,
  InvoiceStatusRejectedValidator,
  NonFactoredPaymentCommandHandler,
  NonFactoredPaymentPaymentRuleService,
  NonFactoredPaymentReserveRule,
  NonFactoredPaymentUpdateInvoiceRule,
  NonFactoredPaymentValidationService,
  NonPaymentReasonValidator,
  UpdateBrokerPaymentCommandHandler,
  UpdateBrokerPaymentRuleService,
  UpdateBrokerPaymentUpdateInvoiceActivityRule,
  UpdateBrokerPaymentValidationService,
} from './services';

const eventHandlers = [
  BrokerPaymentUpdatedAuditLogEventHandler,
  BrokerPaymentDeletedAuditLogEventHandler,
];
const commandHandlers = [
  CreateBrokerPaymentCommandHandler,
  UpdateBrokerPaymentCommandHandler,
  DeleteBrokerPaymentCommandHandler,
  NonFactoredPaymentCommandHandler,
];
const mappers = [BrokerPaymentMapper];
const validations = [
  CreateBrokerPaymentValidationService,
  InvoiceStatusPurchasedValidator,
  UpdateBrokerPaymentValidationService,
  DeleteBrokerPaymentValidationService,
  NonPaymentReasonValidator,
  InvoiceClientPaymentStatusValidator,
  InvoiceStatusRejectedValidator,
  NonFactoredPaymentValidationService,
];
const rules = [
  CreateBrokerPaymentReserveRule,
  CreateBrokerPaymentRuleService,
  CreateBrokerPaymentUpdateInvoiceRule,
  CreateBrokerPaymentUpdateAssignmentRule,
  DeleteBrokerPaymentRuleService,
  DeleteBrokerPaymentUpdateInvoiceRule,
  DeleteBrokerPaymentReserveRule,
  NonFactoredPaymentPaymentRuleService,
  NonFactoredPaymentReserveRule,
  DeleteBrokerPaymentUpdateAssignmentRule,
  UpdateBrokerPaymentRuleService,
  UpdateBrokerPaymentUpdateInvoiceActivityRule,
  NonFactoredPaymentUpdateInvoiceRule,
];

@Module({
  imports: [
    BobtailLoggingModule,
    BobtailConfigModule,
    DatabaseModule,
    AuthModule,
    ClientsModule,
    BrokersModule,
    ReservesModule,
    TagDefinitionsModule,
    PersistenceModule,
    InvoicesTagActivityModule,
    CqrsModule,
    CommonModule,
  ],
  controllers: [BrokerPaymentController],
  providers: [
    BrokerPaymentService,
    BrokerPaymentRepository,
    ...validations,
    ...eventHandlers,
    ...commandHandlers,
    ...mappers,
    ...rules,
  ],
  exports: [],
})
export class BrokerPaymentsModule {}
