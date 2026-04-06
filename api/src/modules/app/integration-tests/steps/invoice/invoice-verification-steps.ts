import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { VerifyInvoiceRequest } from '@module-invoices';
import { VerifyInvoiceRequestBuilder } from '@module-invoices/test';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class InvoiceVerificationSteps {
  constructor(private readonly input: StepsInput) {}

  async verify(
    invoiceId: string,
    data?: Partial<VerifyInvoiceRequest>,
  ): Promise<Invoice> {
    const payload = new VerifyInvoiceRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices/${invoiceId}/verify`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const invoice = plainToClass(Invoice, response.body);
    expect(invoice.id).toBeDefined();
    return invoice;
  }
}
