import { ValidationError, Validator } from '@core/validation';
import {
  BrokerPaymentStatus,
  ClientBrokerAssignmentEntity,
  InvoiceStatus,
  RecordStatus,
} from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotPaidByBrokerValidator
  implements Validator<ClientBrokerAssignmentEntity>
{
  constructor(private invoiceRepository: InvoiceRepository) {}

  async validate(assignment: ClientBrokerAssignmentEntity): Promise<void> {
    const count = await this.invoiceRepository.count({
      clientId: assignment.clientId,
      brokerId: assignment.brokerId,
      status: InvoiceStatus.Purchased,
      brokerPaymentStatus: BrokerPaymentStatus.NotReceived,
      recordStatus: RecordStatus.Active,
    });

    if (count != 0) {
      throw new ValidationError(
        'not-paid',
        `Found a total of ${count} purchased invoices that are not paid by the broker`,
      );
    }
  }
}
