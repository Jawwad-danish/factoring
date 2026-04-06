import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { ClientBatchPaymentEntity, Repositories } from '@module-persistence';
import { TransferData } from '@module-transfers/data';
import { Injectable, Logger } from '@nestjs/common';
import { BaseUpdateTransferStatusStrategy } from './base-update-transfer-status.strategy';

@Injectable()
export class DebitUpdateTransferStatusStrategy extends BaseUpdateTransferStatusStrategy {
  private logger: Logger = new Logger(DebitUpdateTransferStatusStrategy.name);

  constructor(
    repositories: Repositories,
    invoiceChangeActionsExecutor: InvoiceChangeActionsExecutor,
  ) {
    super(repositories, invoiceChangeActionsExecutor);
  }

  async update(
    batchPayment: ClientBatchPaymentEntity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _batchTransferData: TransferData,
  ): Promise<void> {
    this.logger.warn(
      `Batch payment ${batchPayment.id} is of type 'DEBIT ACH'. Skipped updating statuses. Not implemented`,
    );
    return;
  }
}
