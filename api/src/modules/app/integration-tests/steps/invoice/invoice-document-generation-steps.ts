import { ChangeActions } from '@common';
import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { InvoiceChangeActionsExecutor } from '@module-invoices-tag-activity';
import { TagDefinitionKey } from '@module-persistence/entities';
import { InvoiceRepository } from '@module-persistence/repositories';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoiceDocumentGenerationSteps {
  constructor(private readonly input: StepsInput) {}

  async startDocumentGeneration(invoiceId: string): Promise<void> {
    await this.input.runTransactionally(async (app) => {
      const invoiceRepository = app.get(InvoiceRepository);
      const invoiceChangeActionsExecutor = app.get(
        InvoiceChangeActionsExecutor,
      );
      const invoice = await invoiceRepository.getOneById(invoiceId);
      await invoiceChangeActionsExecutor.apply(
        invoice,
        ChangeActions.addTag(TagDefinitionKey.INVOICE_PDF_IN_PROGRESS),
      );
      return invoice;
    });
  }

  async failDocumentGeneration(invoiceId: string): Promise<Invoice> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices/${invoiceId}/documents/generation-failure`)
      .set('Content-type', 'application/json')
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    return invoice;
  }
}
