import { testingRequest } from '@core/test';
import { ClientOverview } from '@module-clients/data';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';
export class ClientOverviewSteps {
  constructor(private readonly input: StepsInput) {}

  async get(clientId: string): Promise<ClientOverview> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/overview`)
      .set('Content-type', 'application/json')
      .expect(200);
    return plainToInstance(ClientOverview, response.body as any);
  }
}
