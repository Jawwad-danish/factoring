import { testingRequest } from '@core/test';
import { StepsInput } from '../step';

export class InvoiceDeleteSteps {
  constructor(private readonly input: StepsInput) {}

  async delete(id: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .delete(`/invoices/${id}`)
      .set('Content-type', 'application/json')
      .expect(204);
  }
}
