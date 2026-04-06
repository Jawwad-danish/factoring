import { ChangeActions } from '@common';
import { Assignment, Note } from '@core/data';
import { Arrays } from '@core/util';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import {
  ClientBatchPaymentEntity,
  ClientBatchPaymentStatus,
  ClientPaymentStatus,
  InvoiceEntity,
  PaymentStatus,
  Repositories,
  TagDefinitionKey,
} from '@module-persistence';
import { TransferData, TransferState } from '@module-transfers/data';

export abstract class BaseUpdateTransferStatusStrategy {
  constructor(
    protected readonly repositories: Repositories,
    protected readonly invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {}

  abstract update(
    batchPayment: ClientBatchPaymentEntity,
    batchTransferData: TransferData,
  ): Promise<void>;

  protected determineBatchPaymentStatus(
    state: TransferState,
  ): ClientBatchPaymentStatus {
    switch (state) {
      case TransferState.Completed:
        return ClientBatchPaymentStatus.Done;
      case TransferState.Failed:
        return ClientBatchPaymentStatus.Failed;
      default:
        return ClientBatchPaymentStatus.InProgress;
    }
  }

  protected determineClientPaymentStatus(state: TransferState): PaymentStatus {
    switch (state) {
      case TransferState.Processing:
      case TransferState.Sent:
        return PaymentStatus.PENDING;
      case TransferState.Completed:
        return PaymentStatus.DONE;
      case TransferState.Failed:
        return PaymentStatus.FAILED;
    }
  }

  protected determineInvoiceClientPaymentStatus(
    state: TransferState,
  ): ClientPaymentStatus {
    switch (state) {
      case TransferState.Completed:
        return ClientPaymentStatus.Completed;
      case TransferState.Sent:
      case TransferState.Processing:
        return ClientPaymentStatus.Sent;
      case TransferState.Failed:
        return ClientPaymentStatus.Failed;
    }
  }

  protected async getInvoices(
    clientPaymentId: string,
  ): Promise<InvoiceEntity[]> {
    const [invoiceClientPayments] =
      await this.repositories.invoiceClientPayment.findAll(
        {
          clientPayment: clientPaymentId,
        },
        {
          populate: ['invoice'],
        },
      );
    return invoiceClientPayments.map(
      (invoiceClientPayment) => invoiceClientPayment.invoice,
    );
  }

  protected async updateInvoices(
    invoices: InvoiceEntity[],
    status: ClientPaymentStatus,
  ) {
    const result = invoices.map((invoice) => {
      const assignmentResult = Assignment.assign(
        invoice,
        'clientPaymentStatus',
        status,
      );

      const invoicesActions = {
        invoice,
        changeActions: ChangeActions.addActivity(
          TagDefinitionKey.CLIENT_PAYMENT_UPDATE,
          Note.from({
            payload: assignmentResult.getPayload(),
            text: `Payment status changed to ${status}`,
          }),
        ),
      };
      return invoicesActions;
    });

    await Arrays.mapAsync(result, async ({ invoice, changeActions }) => {
      await this.invoiceChangeActionsExecutor.apply(invoice, changeActions);
    });
    this.repositories.invoice.persist(invoices);
  }
}
