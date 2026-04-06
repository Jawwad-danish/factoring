import { BrokerService } from '@module-brokers';
import { ClientService } from '@module-clients';
import { BasicCommandHandler } from '@module-cqrs';
import { InvoiceRepository } from '@module-persistence/repositories';
import { CommandHandler } from '@nestjs/cqrs';
import { InvoiceMapper } from '../../../../data';
import { DocumentsProcessor } from '../../../documents-processing.service';
import { RegenerateInvoiceDocumentCommand } from '../../regenerate-invoice-document.command';

@CommandHandler(RegenerateInvoiceDocumentCommand)
export class RegenerateInvoiceDocumentCommandHandler
  implements BasicCommandHandler<RegenerateInvoiceDocumentCommand>
{
  constructor(
    private readonly brokerService: BrokerService,
    private readonly clientService: ClientService,
    private readonly documentProcessor: DocumentsProcessor,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly mapper: InvoiceMapper,
  ) {}

  async execute(command: RegenerateInvoiceDocumentCommand): Promise<void> {
    const { invoiceId } = command;
    const entity = await this.invoiceRepository.getOneById(invoiceId);
    const invoice = await this.mapper.entityToModel(entity);
    invoice.client = await this.clientService.getOneById(invoice.clientId);
    if (invoice.brokerId) {
      const broker = await this.brokerService.findOneById(invoice.brokerId);
      if (broker !== null) {
        invoice.broker = broker;
      }
    }
    await this.documentProcessor.sendToProcess({
      entity: entity,
      client: invoice.client,
      broker: invoice.broker,
    });
  }
}
