import { testingRequest } from '@core/test';
import {
  ClientFactoringConfig,
  UpdateClientFactoringConfigRequest,
} from '@module-clients/data';
import { UpdateClientFactoringConfigRequestBuilder } from '@module-clients/test';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';
export class UpdateClientFactoringConfigSteps {
  constructor(private readonly input: StepsInput) {}

  async update(
    clientId: string,
    data: UpdateClientFactoringConfigRequest,
  ): Promise<ClientFactoringConfig> {
    const request = UpdateClientFactoringConfigRequestBuilder.payload(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .patch(`/clients/${clientId}`)
      .set('Content-type', 'application/json')
      .send(request);
    return plainToInstance(ClientFactoringConfig, response.body as any);
  }
}
