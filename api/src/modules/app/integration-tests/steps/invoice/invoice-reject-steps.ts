import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { RejectInvoiceRequest } from '@module-invoices';
import { RejectInvoiceRequestBuilder } from '@module-invoices/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoiceRejectSteps {
  constructor(private readonly input: StepsInput) {}

  async reject(
    id: string,
    data?: Partial<RejectInvoiceRequest>,
  ): Promise<Invoice> {
    const payload = new RejectInvoiceRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices/${id}/reject`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe(InvoiceStatus.Rejected);
    return invoice;
  }
}
