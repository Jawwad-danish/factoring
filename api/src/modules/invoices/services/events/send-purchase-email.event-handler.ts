import { EmailEvents } from '@common';
import { Observability } from '@core/observability';
import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { DatabaseService, Transactional } from '@module-database';
import { InvoicePurchaseEmail } from '@module-email';
import { SendPurchaseEmailEvent } from '@module-invoices/data';
import { InvoiceRepository } from '@module-persistence';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SendPurchaseEmailEventHandler {
  private logger: Logger = new Logger(SendPurchaseEmailEventHandler.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private clientService: ClientService,
    private brokerService: BrokerService,
    private purchaseEmail: InvoicePurchaseEmail,
    private invoiceRepository: InvoiceRepository,
  ) {}

  @OnEvent(EmailEvents.Purchase, { async: true })
  @Observability.WithScope('send-purchase-email')
  async handleSendPurchaseEmail(event: SendPurchaseEmailEvent) {
    await this.databaseService.withRequestContext(async () => {
      try {
        await this.handle(event);
      } catch (error) {
        this.logger.error(
          `Could not send purchase email event to broker`,
          error,
        );
      }
    });
  }

  @Transactional('send-purchase-email')
  async handle({ invoiceId }: SendPurchaseEmailEvent) {
    const invoice = await this.invoiceRepository.getOneById(invoiceId);
    if (invoice.brokerId) {
      const [client, broker] = await Promise.all([
        this.clientService.getOneById(invoice.clientId),
        this.brokerService.findOneById(invoice.brokerId),
      ]);
      if (broker) {
        await this.purchaseEmail.send({
          client,
          broker,
          invoice,
        });
      }
    }
    return invoice;
  }
}
