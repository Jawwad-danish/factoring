import { AWSModule } from '@module-aws';
import { BrokersModule } from '@module-brokers';
import { ClientsModule } from '@module-clients';
import { BobtailConfigModule } from '@module-config';
import { DatabaseModule } from '@module-database';
import { EmailModule } from '@module-email';
import { BobtailLoggingModule } from '@module-logger';
import { ReservesModule } from '@module-reserves';
import {
  TagDefinitionMapper,
  TagDefinitionsModule,
} from '@module-tag-definitions';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth';
import { InvoiceController, InvoiceDocumentController } from './controllers';
import {
  ActivityLogMapper,
  InvoiceDocumentMapper,
  InvoiceMapper,
} from './data';
import {
  AgeDilutionReserveCheck,
  ClientLimitCheck,
  ClientOnHoldCheck,
  ClientRequiresVerificationCheck,
  ClientReservesCheck,
  ClientUnreportedFuelAdvanceCheck,
  DocumentHashRule,
  DocumentsProcessor,
  DuplicateDetectionEngine,
  FirstInvoiceCheck,
  InvoiceDataAccess,
  InvoiceDocumentMetricService,
  InvoiceDocumentService,
  InvoiceMetricService,
  InvoiceRejectedNotifyClientEventHandler,
  InvoiceService,
  InvoiceTaggedNotifyClientEventHandler,
  LoadNumberSimilarityRule,
  LoadNumberSplitRule,
  MonetarySimilarityRule,
  PrePurchaseCheckEngine,
  SendNoaEmailEventHandler,
  SendPurchaseEmailEventHandler,
  TagInvoicesBrokerLimitChangeEventHandler,
  TagInvoicesClientLimitChangeEventHandler,
  TagResolutionService,
  ThresholdCheck,
  VerificationEngine,
} from './services';
import {
  ClientBrokerAssignmentRule,
  ClientFactoringStatusRule,
  InvoiceAssigner,
  LowBrokerCreditRatingTagRule,
  MissingDeliveryOptionsRule,
  PossibleDuplicateRule,
  TagOnholdClientInvoiceRule,
  VerificationRequiredRule,
} from './services/commands/handlers/common';
import {
  CreateInvoiceActivityRule,
  CreateInvoiceBrokerNotFoundActivityRule,
  CreateInvoiceRuleService,
  CreateInvoiceValidationService,
  ExistingInvoiceIdValidator,
  TagBrokerLimitRule,
  TagClientLimitRule,
} from './services/commands/handlers/create-invoice';
import {
  ChargebackValidator,
  CheckBrokerDeliveryOptionsValidator,
  CheckClientNoaValidator,
  CheckClientStatus,
  ClientBankAccountValidator,
  ConvertToExpeditedRule,
  PurchaseDeductionRule,
  PurchaseInvoiceRuleService,
  PurchaseInvoiceValidationService,
  ReserveFeeRule,
  ResolveTagsRule,
  TagUploadToPortalRule,
  VerificationStatusValidator,
  WireAmountValidator,
  WireDeadlineRule,
} from './services/commands/handlers/purchase-invoice';

import {
  BrokerPaymentMapper,
  BrokerPaymentsModule,
} from '@module-broker-payments';

import { CommonModule } from '@module-common';
import { CqrsModule } from '@module-cqrs';
import { FirebaseModule } from '@module-firebase';
import { NotificationsModule } from '@module-notifications';
import { PersistenceModule } from '@module-persistence';
import { InvoicesTagActivityModule } from '../invoices-tag-activity';
import {
  AssignInvoiceActivityCommandHandler,
  BrokerPaymentScheduledRule,
  ClientLimitTagInvoicesCommandHandler,
  CreateInvoiceCommandHandler,
  DeleteInvoiceActivityCommandHandler,
  DeleteInvoiceCommandHandler,
  DeleteInvoiceTagValidationService,
  FailInvoiceDocumentGenerationCommandHandler,
  PurchaseInvoiceCommandHandler,
  RegenerateInvoiceDocumentCommandHandler,
  RevertInvoiceCommandHandler,
  SendPurchaseEmailCommandHandler,
  ShareInvoiceCommandHandler,
  UpdateInvoiceCommandHandler,
  UpdateInvoiceDocumentCommandHandler,
  UpdateInvoiceExpeditedCommandHandler,
} from './services/commands/handlers';
import { AssignInvoiceActivityRuleService } from './services/commands/handlers/assign-invoice-activity';
import {
  InvoiceExpeditedValidator,
  InvoiceNotLockedValidator,
} from './services/commands/handlers/common/validation/validators';
import {
  InvoiceStatusToRejectedValidator,
  RejectInvoiceCommandHandler,
  RejectInvoiceRuleService,
  RejectInvoiceValidationService,
  TagRejectedInvoiceRule,
} from './services/commands/handlers/reject-invoice';
import {
  RevertDeductionReserveRule,
  RevertInvoiceReserveFeeRule,
  RevertInvoiceRuleService,
  RevertInvoiceUpdateClientPaymentStatusRule,
  RevertInvoiceValidationService,
} from './services/commands/handlers/revert-invoice';
import {
  BrokerUpdateOnPurchasedValidator,
  ClientUpdateOnPurchasedValidator,
  RejectedToUnderReviewRule,
  ResolveTagsOnUpdateRule,
  TransferTypeUpdateValidator,
  UpdateInvoiceBrokerNotFoundActivityRule,
  UpdateInvoiceRuleService,
  UpdateInvoiceValidationService,
} from './services/commands/handlers/update-invoice';
import {
  InvoiceUnderReviewValidator,
  VerifyInvoiceCommandHandler,
  VerifyInvoiceRuleService,
  VerifyInvoiceValidationService,
} from './services/commands/handlers/verify-invoice';
import {
  CheckPossibleDuplicateQueryHandler,
  FindBrokerClientQueryHandler,
  FindInvoiceQueryHandler,
  FindInvoiceRiskQueryHandler,
  FindInvoicesQueryHandler,
  GetPurchaseVolumeQueryHandler,
  InvoicePrePurchaseCheckQueryHandler,
} from './services/queries/handlers';
import { RtpModule } from '@module-rtp';

const commandHandlers = [
  AssignInvoiceActivityCommandHandler,
  CreateInvoiceCommandHandler,
  DeleteInvoiceActivityCommandHandler,
  DeleteInvoiceCommandHandler,
  FailInvoiceDocumentGenerationCommandHandler,
  PurchaseInvoiceCommandHandler,
  RegenerateInvoiceDocumentCommandHandler,
  RejectInvoiceCommandHandler,
  RevertInvoiceCommandHandler,
  SendPurchaseEmailCommandHandler,
  UpdateInvoiceCommandHandler,
  UpdateInvoiceDocumentCommandHandler,
  UpdateInvoiceExpeditedCommandHandler,
  VerifyInvoiceCommandHandler,
  ClientLimitTagInvoicesCommandHandler,
  TagInvoicesClientLimitChangeEventHandler,
  TagInvoicesBrokerLimitChangeEventHandler,
  InvoiceTaggedNotifyClientEventHandler,
  InvoiceRejectedNotifyClientEventHandler,
  SendPurchaseEmailEventHandler,
  SendNoaEmailEventHandler,
  ShareInvoiceCommandHandler,
];

const queryHandlers = [
  CheckPossibleDuplicateQueryHandler,
  FindBrokerClientQueryHandler,
  FindInvoiceQueryHandler,
  FindInvoicesQueryHandler,
  GetPurchaseVolumeQueryHandler,
  InvoicePrePurchaseCheckQueryHandler,
  FindInvoiceRiskQueryHandler,
];
const mappers = [
  ActivityLogMapper,
  BrokerPaymentMapper,
  InvoiceDocumentMapper,
  InvoiceMapper,
  TagDefinitionMapper,
];
const verificationRequiredChecks = [
  AgeDilutionReserveCheck,
  ClientOnHoldCheck,
  ClientReservesCheck,
  ClientUnreportedFuelAdvanceCheck,
  FirstInvoiceCheck,
  ThresholdCheck,
  ClientRequiresVerificationCheck,
  VerificationEngine,
  VerificationRequiredRule,
];
const rules = [
  ClientBrokerAssignmentRule,
  ClientFactoringStatusRule,
  CreateInvoiceActivityRule,
  CreateInvoiceBrokerNotFoundActivityRule,
  CreateInvoiceRuleService,
  LowBrokerCreditRatingTagRule,
  MissingDeliveryOptionsRule,
  PossibleDuplicateRule,
  PurchaseDeductionRule,
  PurchaseInvoiceRuleService,
  RejectedToUnderReviewRule,
  RejectInvoiceRuleService,
  ReserveFeeRule,
  TagBrokerLimitRule,
  RevertDeductionReserveRule,
  RevertInvoiceReserveFeeRule,
  RevertInvoiceRuleService,
  RevertInvoiceUpdateClientPaymentStatusRule,
  TagClientLimitRule,
  TagBrokerLimitRule,
  TagOnholdClientInvoiceRule,
  TagRejectedInvoiceRule,
  TagUploadToPortalRule,
  UpdateInvoiceBrokerNotFoundActivityRule,
  UpdateInvoiceRuleService,
  VerifyInvoiceRuleService,
  WireDeadlineRule,
  ResolveTagsRule,
  BrokerPaymentScheduledRule,
  AssignInvoiceActivityRuleService,
  ResolveTagsOnUpdateRule,
  ConvertToExpeditedRule,
];
const validationComponents = [
  BrokerUpdateOnPurchasedValidator,
  ChargebackValidator,
  CheckClientStatus,
  ClientUpdateOnPurchasedValidator,
  CreateInvoiceValidationService,
  DeleteInvoiceTagValidationService,
  ExistingInvoiceIdValidator,
  InvoiceExpeditedValidator,
  InvoiceNotLockedValidator,
  InvoiceStatusToRejectedValidator,
  InvoiceUnderReviewValidator,
  PurchaseInvoiceValidationService,
  RejectInvoiceValidationService,
  RevertInvoiceValidationService,
  TransferTypeUpdateValidator,
  UpdateInvoiceValidationService,
  VerificationStatusValidator,
  VerifyInvoiceValidationService,
  WireAmountValidator,
  ClientBankAccountValidator,
  CheckClientNoaValidator,
  CheckBrokerDeliveryOptionsValidator,
];

@Module({
  imports: [
    AuthModule,
    BobtailLoggingModule,
    BobtailConfigModule,
    AWSModule,
    DatabaseModule,
    BrokersModule,
    ClientsModule,
    TagDefinitionsModule,
    ReservesModule,
    EmailModule,
    PersistenceModule,
    BrokerPaymentsModule,
    InvoicesTagActivityModule,
    CqrsModule,
    CommonModule,
    ReservesModule,
    NotificationsModule,
    FirebaseModule,
    RtpModule,
  ],
  controllers: [InvoiceController, InvoiceDocumentController],
  providers: [
    InvoiceService,
    InvoiceDocumentService,
    TagResolutionService,
    DocumentsProcessor,
    InvoiceMetricService,
    InvoiceDocumentMetricService,
    DuplicateDetectionEngine,
    PrePurchaseCheckEngine,
    LoadNumberSimilarityRule,
    LoadNumberSplitRule,
    MonetarySimilarityRule,
    DocumentHashRule,
    ClientLimitCheck,
    InvoiceAssigner,
    InvoiceDataAccess,
    ...commandHandlers,
    ...queryHandlers,
    ...validationComponents,
    ...mappers,
    ...rules,
    ...verificationRequiredChecks,
  ],
  exports: [...mappers, InvoiceService, InvoiceDataAccess],
})
export class InvoicesModule {}
