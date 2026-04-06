import { ClientService } from '@module-clients';
import { QueryHandler } from '@nestjs/cqrs';
import { InvoicePrePurchaseCheck } from '../../../../data';
import { InvoicePrePurchaseCheckQuery } from '../../invoice-pre-purchase-check.query';
import { PrePurchaseCheckEngine } from '../../../engines';
import { InvoiceRepository } from '@module-persistence';

@QueryHandler(InvoicePrePurchaseCheckQuery)
export class InvoicePrePurchaseCheckQueryHandler {
  constructor(
    private readonly clientService: ClientService,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly prePurchaseCheckEngine: PrePurchaseCheckEngine,
  ) {}

  async execute(
    query: InvoicePrePurchaseCheckQuery,
  ): Promise<InvoicePrePurchaseCheck> {
    const invoice = await this.invoiceRepository.getOneById(query.id);
    const client = await this.clientService.getOneById(invoice.clientId);

    const results = await this.prePurchaseCheckEngine.run({
      payload: query.request,
      client,
      invoice,
    });

    const message =
      results.length > 0
        ? 'This invoice may require changes before purchase.'
        : 'This invoice can be safely purchased.';

    return {
      requiresAttention: results.length > 0,
      warnings: results,
      message,
    };
  }
}
