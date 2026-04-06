import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { PurchaseInvoiceRequest } from '@module-invoices';
import { PurchaseInvoiceRequestBuilder } from '@module-invoices/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoicePurchaseSteps {
  constructor(private readonly input: StepsInput) {}

  async purchase(
    id: string,
    data?: Partial<PurchaseInvoiceRequest>,
  ): Promise<Invoice> {
    const payload = new PurchaseInvoiceRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices/${id}/purchase`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe(InvoiceStatus.Purchased);
    return invoice;
  }
}
