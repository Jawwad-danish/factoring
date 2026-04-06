import { testingRequest } from '@core/test';
import {
  BrokerPayment,
  CreateBrokerPaymentRequest,
} from '@module-broker-payments/data';
import { CreateBrokerPaymentRequestBuilder } from '@module-broker-payments/test';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';
export class BrokerPaymentCreateSteps {
  constructor(private readonly input: StepsInput) {}

  async create(
    data?: Partial<CreateBrokerPaymentRequest>,
  ): Promise<BrokerPayment> {
    const requestBuilder = new CreateBrokerPaymentRequestBuilder(data);
    const request = requestBuilder.getRequest();
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/broker-payments`)
      .set('Content-type', 'application/json')
      .send(requestBuilder.getPayload())
      .expect(201);
    const brokerPayment = plainToClass(BrokerPayment, response.body);

    expect(brokerPayment.id).toBeDefined();
    expect(brokerPayment.amount.toNumber()).toBe(request.amount.toNumber());
    expect(brokerPayment.checkNumber).toBe(request.checkNumber);
    expect(brokerPayment.invoiceId).toBe(request.invoiceId);
    expect(brokerPayment.batchDate?.toISOString()).toBe(
      request.batchDate.toISOString(),
    );
    expect(brokerPayment.type).toBe(request.type);

    return brokerPayment;
  }
}
