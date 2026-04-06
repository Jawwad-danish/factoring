import { InvoiceEvents } from '@common/events';
import { Observability } from '@core/observability';
import { BrokerPaymentCreatedEvent } from '@module-broker-payments/data';
import { CommandRunner } from '@module-cqrs';
import { DatabaseService, Transactional } from '@module-database';
import {
  CreateInvoiceEvent,
  PurchaseInvoiceEvent,
} from '@module-invoices/data';
import { BrokerPaymentEntity } from '@module-persistence/entities';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UpdateBrokerFactoringStatsCommand } from '../../commands';

@Injectable()
export class BrokerFactoringStatsEventHandler {
  private logger: Logger = new Logger(BrokerFactoringStatsEventHandler.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly commandRunner: CommandRunner,
  ) {}

  @OnEvent(BrokerPaymentCreatedEvent.EVENT_NAME, { async: true })
  @Observability.WithScope('broker-factoring-stats-broker-payment-create-event')
  async handleBrokerPaymentCreate(event: BrokerPaymentCreatedEvent) {
    await this.databaseService.withRequestContext(async () => {
      const brokerPayment = await this.databaseService
        .getEntityManager()
        .findOneOrFail(
          BrokerPaymentEntity,
          {
            id: event.brokerPaymentId,
          },
          {
            populate: ['invoice.brokerId'],
          },
        );
      if (brokerPayment.invoice.brokerId) {
        await this.updateStats(brokerPayment.invoice.brokerId);
      }
    });
  }

  @OnEvent(InvoiceEvents.CreateInvoice, { async: true })
  @Observability.WithScope('broker-factoring-stats-invoice-create-event')
  async handleInvoiceCreate(event: CreateInvoiceEvent) {
    await this.databaseService.withRequestContext(async () => {
      if (!event.invoice.brokerId) {
        this.logger.log(
          `Skiping updating stats because invoice ${event.invoice.id} does not have a broker assigned`,
        );
        return;
      }
      await this.updateStats(event.invoice.brokerId);
    });
  }

  @OnEvent(InvoiceEvents.PurchaseInvoice, { async: true })
  @Observability.WithScope('broker-factoring-stats-invoice-purchase-event')
  async handleInvoicePurchase({ brokerId }: PurchaseInvoiceEvent) {
    await this.databaseService.withRequestContext(async () => {
      if (brokerId) {
        await this.updateStats(brokerId);
      }
    });
  }

  @Transactional('update-broker-factoring-stats')
  private async updateStats(brokerId: string) {
    try {
      await this.commandRunner.run(
        new UpdateBrokerFactoringStatsCommand(brokerId),
      );
    } catch (error) {
      this.logger.error('Could not update broker factoring statistics', error);
    }
  }
}
