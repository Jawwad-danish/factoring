import { testingRequest } from '@core/test';
import { StepsInput } from '../step';

export class DeleteFirebaseTokenSteps {
  constructor(private readonly input: StepsInput) {}

  async delete(token: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .delete(`/firebase-tokens/${token}`)
      .set('Content-type', 'application/json')
      .expect(204);
  }
}
