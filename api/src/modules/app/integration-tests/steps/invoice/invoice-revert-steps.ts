import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { RevertInvoiceRequest } from '@module-invoices';
import { RevertInvoiceRequestBuilder } from '@module-invoices/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoiceRevertSteps {
  constructor(private readonly input: StepsInput) {}

  async revert(
    id: string,
    data?: Partial<RevertInvoiceRequest>,
  ): Promise<Invoice> {
    const payload = RevertInvoiceRequestBuilder.from(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices/${id}/revert`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe(InvoiceStatus.UnderReview);
    expect(invoice.purchasedDate).toBeUndefined();
    return invoice;
  }
}
