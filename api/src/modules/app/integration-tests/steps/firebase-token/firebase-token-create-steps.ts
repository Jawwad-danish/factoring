import { testingRequest } from '@core/test';
import { CreateFirebaseTokenRequest } from '@module-firebase';
import { StepsInput } from '../step';

export class CreateFirebaseTokenSteps {
  constructor(private readonly input: StepsInput) {}

  async create(request: CreateFirebaseTokenRequest): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .post(`/firebase-tokens`)
      .set('Content-type', 'application/json')
      .send(request)
      .expect(201);
  }
}
