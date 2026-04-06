import { Module } from '@nestjs/common';
import { DatabaseModule } from '@module-database';
import {
  ClientBatchPaymentController,
  ClientPaymentsController,
} from './controllers';
import { ClientBatchPaymentService, ClientPaymentService } from './services';
import {
  ClientBatchPaymentMapper,
  ClientPaymentMapper,
  InvoiceClientPaymentMapper,
  ReserveClientPaymentMapper,
} from './mappers';
import { AuthModule } from '../auth/auth.module';
import { BobtailLoggingModule } from '../logging/logging.module';
import {
  CreateClientBatchPaymentOperation,
  CreateClientBatchPaymentRule,
  CreateClientBatchPaymentRuleService,
  CreateClientBatchPaymentValidationService,
  UpdateClientFactoringConfigRule,
  UpdateInvoiceRule,
} from './operations';
import { InvoicesModule } from '@module-invoices';
import { ClientsModule } from '@module-clients';
import { TagDefinitionsModule } from '@module-tag-definitions';
import { PersistenceModule } from '@module-persistence';
import { AWSModule } from '@module-aws';
import { CommonModule } from '@module-common';
import { CqrsModule } from '@module-cqrs';
import {
  FindClientPaymentQueryHandler,
  FindClientPaymentsQueryHandler,
} from './queries';
import { ReservesModule } from '../reserves/reserves.modules';

const operations = [CreateClientBatchPaymentOperation];
const validations = [CreateClientBatchPaymentValidationService];
const mappers = [
  ClientBatchPaymentMapper,
  ClientPaymentMapper,
  ReserveClientPaymentMapper,
  InvoiceClientPaymentMapper,
];
const rules = [
  CreateClientBatchPaymentRule,
  CreateClientBatchPaymentRuleService,
  UpdateInvoiceRule,
  UpdateClientFactoringConfigRule,
];
const queryHandlers = [
  FindClientPaymentQueryHandler,
  FindClientPaymentsQueryHandler,
];

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    BobtailLoggingModule,
    InvoicesModule,
    ReservesModule,
    ClientsModule,
    TagDefinitionsModule,
    PersistenceModule,
    AWSModule,
    CommonModule,
    CqrsModule,
  ],
  providers: [
    ClientBatchPaymentService,
    ClientPaymentService,
    ...operations,
    ...validations,
    ...mappers,
    ...rules,
    ...queryHandlers,
  ],
  controllers: [ClientBatchPaymentController, ClientPaymentsController],
  exports: [...mappers],
})
export class ClientPaymentsModule {}
