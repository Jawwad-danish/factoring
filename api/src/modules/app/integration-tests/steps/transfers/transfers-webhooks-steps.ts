import { testingRequest } from '@core/test';
import { UpdateTransferStatusWebhookRequest } from '@module-transfers/data';
import { UpdateTransferStatusWebhookRequestBuilder } from '@module-transfers/test';
import { StepsInput } from '../step';
export class TransfersWebhookSteps {
  constructor(private readonly input: StepsInput) {}

  async updateTransferStatus(
    data?: UpdateTransferStatusWebhookRequest,
  ): Promise<void> {
    const builder = new UpdateTransferStatusWebhookRequestBuilder(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/transfers/update-status`)
      .set('Content-type', 'application/json')
      .send(builder.getPayload());
    response;
  }
}
