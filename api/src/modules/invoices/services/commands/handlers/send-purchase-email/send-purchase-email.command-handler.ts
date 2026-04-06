import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoicePurchaseEmail } from '@module-email';
import { InvoiceEntity } from '@module-persistence/entities';
import { CommandHandler } from '@nestjs/cqrs';
import { SendPurchaseEmailCommand } from '../../send-purchase-email.command';

@CommandHandler(SendPurchaseEmailCommand)
export class SendPurchaseEmailCommandHandler
  implements BasicCommandHandler<SendPurchaseEmailCommand>
{
  constructor(
    private clientService: ClientService,
    private brokerService: BrokerService,
    private purchaseEmail: InvoicePurchaseEmail,
  ) {}

  async execute(command: SendPurchaseEmailCommand): Promise<InvoiceEntity> {
    const { invoice } = command;
    if (invoice.brokerId) {
      const client = await this.clientService.getOneById(invoice.clientId);
      const broker = await this.brokerService.findOneById(invoice.brokerId);
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
