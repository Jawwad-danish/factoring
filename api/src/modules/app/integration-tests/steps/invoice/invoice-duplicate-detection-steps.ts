import { testingRequest } from '@core/test';
import { InvoiceDuplicate } from '@module-invoices';
import { CreateInvoiceRequestBuilder } from '@module-invoices/test';
import { StepsInput } from '../step';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';

export class InvoiceDuplicateDetectionSteps {
  constructor(private readonly input: StepsInput) {}

  async checkPossibleDuplicate(
    request: CreateInvoiceRequest,
  ): Promise<InvoiceDuplicate> {
    const payload = CreateInvoiceRequestBuilder.from(request);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices/possible-duplicate-check`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    return response.body;
  }
}
