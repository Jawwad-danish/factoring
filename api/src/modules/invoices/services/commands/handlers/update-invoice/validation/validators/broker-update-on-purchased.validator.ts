import { isValidClientPaymentStatusForEditing } from '@common';
import { ValidationError } from '@core/validation';
import { Broker, BrokerEmailType, BrokerService } from '@module-brokers';
import {
  CommandInvoiceContext,
  UpdateInvoiceRequest,
} from '@module-invoices/data';
import { InvoiceStatus } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { UpdateInvoiceValidator } from './update-invoice-validator';

@Injectable()
export class BrokerUpdateOnPurchasedValidator<P extends UpdateInvoiceRequest>
  implements UpdateInvoiceValidator
{
  private logger = new Logger(BrokerUpdateOnPurchasedValidator.name);

  constructor(private readonly brokerService: BrokerService) {}

  async validate({ payload, entity }: CommandInvoiceContext<P>): Promise<void> {
    if (
      payload.brokerId &&
      payload.brokerId != entity.brokerId &&
      entity.status == InvoiceStatus.Purchased &&
      isValidClientPaymentStatusForEditing(entity.clientPaymentStatus)
    ) {
      const updateBroker = await this.brokerService.findOneById(
        payload.brokerId,
      );
      if (updateBroker == null) {
        this.logger.error(
          `Can't find broker by id to update already purchased invoice id ${entity.id}`,
          {
            invoiceId: entity.id,
            brokerId: payload.brokerId,
          },
        );
        throw new ValidationError(
          'broker-update-on-purchased',
          `Can't find broker by id to update already purchased invoice`,
        );
      }
      if (!this.hasActiveEmails(updateBroker)) {
        this.logger.error(
          `Can't update a broker without emails for an already purchased invoice id ${entity.id}`,
          {
            invoiceId: entity.id,
            brokerId: updateBroker.id,
            brokerEmails: updateBroker.emails,
          },
        );
        throw new ValidationError(
          'broker-update-on-purchased',
          `Can't update a broker without emails for an already purchased invoice`,
        );
      }
    }
    if (
      payload.brokerId === null &&
      entity.status === InvoiceStatus.Purchased
    ) {
      this.logger.error(
        `Can't update invoice with broker not found because it's purchased`,
        {
          invoiceId: entity.id,
        },
      );
      throw new ValidationError(
        'broker-update-on-purchased',
        `Can't update invoice ${entity.id} with broker not found because it's purchased`,
      );
    }
  }

  private hasActiveEmails({ emails }: Broker): boolean {
    for (const type of [BrokerEmailType.NOA, BrokerEmailType.InvoiceDelivery]) {
      const activeEmails = emails.filter((email) => email.type === type).length;

      if (activeEmails === 0) {
        return false;
      }
    }
    return true;
  }
}
