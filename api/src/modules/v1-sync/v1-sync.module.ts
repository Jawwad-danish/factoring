import { AuthModule } from '@module-auth';
import { CommonModule } from '@module-common';
import { BobtailConfigModule } from '@module-config';
import { DatabaseModule } from '@module-database';
import { InvoicesTagActivityModule } from '@module-invoices-tag-activity';
import { PersistenceModule } from '@module-persistence';
import { Module } from '@nestjs/common';
import { V1Api } from './api';
import {
  AssignTagInvoiceCommandHook,
  CreateBrokerPaymentCommandHook,
  CreateProcessingNotesCommandHook,
  CreateInvoiceCommandHook,
  CreateReserveAccountFundsCommandHook,
  CreateReserveCommandHook,
  CreateFirebaseTokenCommandHook,
  DeleteBrokerPaymentCommandHook,
  DeleteProcessingNotesCommandHook,
  DeleteInvoiceCommandHook,
  DeleteInvoiceTagCommandHook,
  DeleteReserveCommandHook,
  InitiateExpediteTransferCommandHook,
  InitiateRegularTransferCommandHook,
  CreateClientBrokerAssignmentCommandHook,
  MarkBankAccountAsPrimaryCommandHook,
  PurchaseInvoiceCommandHook,
  RegenerateInvoiceDocumentCommandHook,
  RejectInvoiceCommandHook,
  RevertInvoiceCommandHook,
  UpdateBrokerFactoringConfigCommandHook,
  UpdateBrokerPaymentCommandHook,
  UpdateProcessingNotesCommandHook,
  UpdateClientFactoringConfigCommandHook,
  UpdateInvoiceCommandHook,
  UpdateMaintenanceModeCommandHook,
  VerifyInvoiceCommandHook,
  UpdateClientDocumentCommandHook,
  CreateBuyoutsBatchCommandHook,
  CreateEmployeeCommandHook,
  ReleaseClientBrokerAssignmentCommandHook,
  BulkPurchaseCommandHook,
  UpdateBuyoutCommandHook,
} from './commands';
import {
  DocumentsSyncronizer,
  SyncDocumentOnInvoiceCreateEventHandler,
  SyncDocumentOnInvoiceCreateUpdateHandler,
  SyncDocumentOnRegenerateInvoiceDocumentHandler,
} from './events';
import { DeleteFirebaseTokenCommandHook } from './commands/hooks/delete-firebase-token';
import { InitiateDebitRegularTransferCommandHook } from './commands/hooks/initiate-debit-transfer';

const hooks = [
  CreateReserveCommandHook,
  DeleteReserveCommandHook,
  InitiateExpediteTransferCommandHook,
  InitiateRegularTransferCommandHook,
  InitiateDebitRegularTransferCommandHook,
  AssignTagInvoiceCommandHook,
  DeleteInvoiceTagCommandHook,
  CreateInvoiceCommandHook,
  UpdateInvoiceCommandHook,
  UpdateClientFactoringConfigCommandHook,
  DeleteInvoiceCommandHook,
  RevertInvoiceCommandHook,
  PurchaseInvoiceCommandHook,
  RejectInvoiceCommandHook,
  VerifyInvoiceCommandHook,
  CreateBrokerPaymentCommandHook,
  CreateClientBrokerAssignmentCommandHook,
  UpdateBrokerPaymentCommandHook,
  DeleteBrokerPaymentCommandHook,
  RegenerateInvoiceDocumentCommandHook,
  CreateReserveAccountFundsCommandHook,
  UpdateMaintenanceModeCommandHook,
  CreateProcessingNotesCommandHook,
  UpdateProcessingNotesCommandHook,
  DeleteProcessingNotesCommandHook,
  UpdateBrokerFactoringConfigCommandHook,
  UpdateClientDocumentCommandHook,
  CreateBuyoutsBatchCommandHook,
  CreateEmployeeCommandHook,
  ReleaseClientBrokerAssignmentCommandHook,
  BulkPurchaseCommandHook,
  UpdateBuyoutCommandHook,
  CreateFirebaseTokenCommandHook,
  DeleteFirebaseTokenCommandHook,
  MarkBankAccountAsPrimaryCommandHook,
];

const handlers = [
  SyncDocumentOnInvoiceCreateEventHandler,
  SyncDocumentOnInvoiceCreateUpdateHandler,
  SyncDocumentOnRegenerateInvoiceDocumentHandler,
  DocumentsSyncronizer,
];

@Module({
  imports: [
    AuthModule,
    BobtailConfigModule,
    CommonModule,
    DatabaseModule,
    PersistenceModule,
    InvoicesTagActivityModule,
  ],
  controllers: [],
  providers: [V1Api, ...handlers, ...hooks],
  exports: [],
})
export class V1SyncModule {}
