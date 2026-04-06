import { testingRequest } from '@core/test';
import { Invoice } from '@fs-bobtail/factoring/data';
import { CreateInvoiceRequestBuilder } from '@module-invoices/test';
import { InvoiceStatus } from '@module-persistence/entities';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';
import { CreateInvoiceRequest } from '@fs-bobtail/factoring/data';

export interface InvoiceCreateExpects {
  status?: InvoiceStatus;
}

export class InvoiceCreateSteps {
  constructor(private readonly input: StepsInput) {}

  async create(
    data?: Partial<CreateInvoiceRequest>,
    expected?: InvoiceCreateExpects,
  ): Promise<Invoice> {
    const request = CreateInvoiceRequestBuilder.payload(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices`)
      .set('Content-type', 'application/json')
      .send(request);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
    const invoice = plainToClass(Invoice, response.body);
    console.log('Transformed invoice:', invoice);
    console.log('Invoice id:', invoice.id);
    expect(invoice.id).toBeDefined();
    expect(invoice.status).toBe(expected?.status ?? InvoiceStatus.UnderReview);
    expect(invoice.loadNumber).toBe(request.loadNumber);
    return invoice;
  }

  async failCreate(data?: Partial<CreateInvoiceRequest>): Promise<void> {
    const request = CreateInvoiceRequestBuilder.payload(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/invoices`)
      .set('Content-type', 'application/json')
      .send(request);
    expect(response.body.message).toBe('Could not create invoice');
  }
}
