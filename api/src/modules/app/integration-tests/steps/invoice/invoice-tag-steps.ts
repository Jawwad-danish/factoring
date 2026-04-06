import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { AssignInvoiceActivityRequest } from '@module-invoices/data';
import { AssignInvoiceTagRequestBuilder } from '@module-invoices/test';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoiceTagSteps {
  constructor(private readonly input: StepsInput) {}

  async assign(
    invoiceId: string,
    data?: Partial<AssignInvoiceActivityRequest>,
  ): Promise<Invoice> {
    const payload = new AssignInvoiceTagRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .patch(`/invoices/${invoiceId}/activity`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    expect(invoice.client).toBeDefined();
    return invoice;
  }

  async delete(invoiceId: string, activityId: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .delete(`/invoices/${invoiceId}/activity/${activityId}`)
      .set('Content-type', 'application/json')
      .send({})
      .expect(204);
  }
}
