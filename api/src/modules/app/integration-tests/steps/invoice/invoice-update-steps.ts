import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { UpdateInvoiceRequest } from '@module-invoices';
import { UpdateInvoiceRequestBuilder } from '@module-invoices/test';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';
export class InvoiceUpdateSteps {
  constructor(private readonly input: StepsInput) {}

  async update(
    id: string,
    data?: Partial<UpdateInvoiceRequest>,
  ): Promise<Invoice> {
    const payload = new UpdateInvoiceRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .patch(`/invoices/${id}`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    return invoice;
  }

  async failUpdate(
    id: string,
    data?: Partial<UpdateInvoiceRequest>,
  ): Promise<void> {
    const payload = new UpdateInvoiceRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .patch(`/invoices/${id}`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(400);
    expect(response.body.message).toContain('Could not update invoice');
  }
}
