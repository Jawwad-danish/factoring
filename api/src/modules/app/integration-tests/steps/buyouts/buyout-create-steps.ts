import { testingRequest } from '@core/test';
import { CreateBuyoutsBatchRequest } from '@fs-bobtail/factoring/data';
import { CreateBuyoutsBatchRequestBuilder } from '@module-buyouts/test';
import { StepsInput } from '../step';
import { Invoice } from '@fs-bobtail/factoring/data';
import { plainToInstance } from 'class-transformer';
export class BuyoutCreateSteps {
  constructor(private readonly input: StepsInput) {}

  async create(data?: Partial<CreateBuyoutsBatchRequest>): Promise<void> {
    const requestBuilder = new CreateBuyoutsBatchRequestBuilder(data);
    await testingRequest(this.input.app.getHttpServer())
      .post('/buyouts')
      .set('Content-type', 'application/json')
      .send(requestBuilder.getPayload())
      .expect(201);
  }

  async bulkPurchase(): Promise<Invoice[]> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .post('/buyouts/bulk-purchase')
      .set('Content-type', 'application/json')
      .expect(201);
    const invoices = plainToInstance(Invoice, response.body as any[]);
    expect(invoices.length).toBeDefined();
    return invoices;
  }
}
