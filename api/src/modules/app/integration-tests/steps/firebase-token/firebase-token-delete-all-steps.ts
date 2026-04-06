import { testingRequest } from '@core/test';
import { StepsInput } from '../step';

export class DeleteAllFirebaseTokensSteps {
  constructor(private readonly input: StepsInput) {}

  async deleteAll(): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .delete(`/firebase-tokens`)
      .set('Content-type', 'application/json')
      .expect(204);
  }
}
