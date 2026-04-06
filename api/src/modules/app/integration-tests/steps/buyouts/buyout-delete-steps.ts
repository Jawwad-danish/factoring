import { testingRequest } from '@core/test';
import { expectEmptyBody } from '../../expects';
import { StepsInput } from '../step';

export class BuyoutDeleteSteps {
  constructor(private readonly input: StepsInput) {}

  async delete(id: string): Promise<void> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .delete(`/buyouts/${id}`)
      .set('Content-type', 'application/json')
      .expect(204);
    expectEmptyBody(response);
  }
}
