import { ValidationError } from '@core/validation';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { ClientBatchPaymentEntity, Repositories } from '@module-persistence';
import {
  BatchState,
  TransferData,
  TransferPaymentType,
} from '@module-transfers/data';
import { Injectable, Logger } from '@nestjs/common';
import { BaseUpdateTransferStatusStrategy } from './base-update-transfer-status.strategy';

@Injectable()
export class WireUpdateTransferStatusStrategy extends BaseUpdateTransferStatusStrategy {
  private logger: Logger = new Logger(WireUpdateTransferStatusStrategy.name);

  constructor(
    repositories: Repositories,
    invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {
    super(repositories, invoiceChangeActionsExecutor);
  }

  async update(
    batchPayment: ClientBatchPaymentEntity,
    batchTransferData: TransferData,
  ): Promise<void> {
    if (batchTransferData.state !== BatchState.Completed) {
      this.logger.log('Expedite transfer not completed. Skipping update');
      return;
    }

    const transfer = batchTransferData.transfers.find((transfer) =>
      [TransferPaymentType.RTP, TransferPaymentType.Wire].includes(
        transfer.paymentType,
      ),
    );
    if (!transfer) {
      const message = `No wire transfer was found on batch transfer ${batchTransferData.externalId}`;
      this.logger.error(message);
      throw new ValidationError('expedite-transfer-update-status', message);
    }

    batchPayment.status = this.determineBatchPaymentStatus(transfer.state);

    for (const clientPayment of batchPayment.clientPayments) {
      clientPayment.status = this.determineClientPaymentStatus(transfer.state);

      const invoices = await this.getInvoices(clientPayment.id);
      const invoiceClientPaymentStatus =
        this.determineInvoiceClientPaymentStatus(transfer.state);
      await this.updateInvoices(invoices, invoiceClientPaymentStatus);
    }

    this.repositories.clientBatchPayment.persist(batchPayment);
  }
}
