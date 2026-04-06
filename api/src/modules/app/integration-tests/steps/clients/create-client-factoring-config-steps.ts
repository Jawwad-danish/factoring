import { testingRequest } from '@core/test';
import {
  ClientFactoringConfig,
  CreateClientFactoringConfigRequest,
} from '@module-clients/data';
import { CreateClientFactoringConfigRequestBuilder } from '@module-clients/test';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';

export class CreateClientFactoringConfigSteps {
  constructor(private readonly input: StepsInput) {}

  async create(
    data: CreateClientFactoringConfigRequest,
  ): Promise<ClientFactoringConfig> {
    const request = CreateClientFactoringConfigRequestBuilder.payload(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/clients`)
      .set('Content-type', 'application/json')
      .send(request)
      .expect(201);
    return plainToInstance(ClientFactoringConfig, response.body as any);
  }
}
