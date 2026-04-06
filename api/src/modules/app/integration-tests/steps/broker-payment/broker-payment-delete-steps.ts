import { testingRequest } from '@core/test';
import {
  BrokerPayment,
  DeleteBrokerPaymentRequest,
} from '@module-broker-payments/data';
import { DeleteBrokerPaymentRequestBuilder } from '@module-broker-payments/test';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class BrokerPaymentDeleteSteps {
  constructor(private readonly input: StepsInput) {}

  async delete(
    id: string,
    data?: Partial<DeleteBrokerPaymentRequest>,
  ): Promise<BrokerPayment> {
    const payload = new DeleteBrokerPaymentRequestBuilder(data).getPayload();
    const response = await testingRequest(this.input.app.getHttpServer())
      .delete(`/broker-payments/${id}`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const brokerPayment = plainToClass(BrokerPayment, response.body);

    expect(brokerPayment.id).toBe(id);

    return brokerPayment;
  }
}
