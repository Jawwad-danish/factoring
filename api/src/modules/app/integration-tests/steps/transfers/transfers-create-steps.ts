import { testingRequest } from '@core/test';
import { ClientBatchPayment } from '@fs-bobtail/factoring/data';
import { ClientBatchPaymentStatus, PaymentType } from '@module-persistence';
import {
  InitiateDebitRegularTransferRequest,
  InitiateExpediteTransferRequest,
  InitiateRegularTransferRequest,
} from '@module-transfers/data';
import { HttpStatus } from '@nestjs/common';
import { instanceToPlain, plainToClass } from 'class-transformer';
import { StepsInput } from '../step';
export class TransfersCreateSteps {
  constructor(private readonly input: StepsInput) {}

  async initiateExpedite(
    payload: InitiateExpediteTransferRequest,
  ): Promise<ClientBatchPayment> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/transfers/initiate-expedite`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(200);
    const batchPayment = plainToClass(ClientBatchPayment, response.body);
    expect(batchPayment.id).toBeDefined();
    expect(batchPayment.status).toBe(ClientBatchPaymentStatus.InProgress);
    expect(batchPayment.type).toBe(PaymentType.WIRE);
    return batchPayment;
  }

  async initiateRegular(
    payload?: InitiateRegularTransferRequest,
    expectedStatus = HttpStatus.ACCEPTED,
  ): Promise<ClientBatchPayment | null> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/transfers/initiate-regular`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(expectedStatus);
    if (expectedStatus === HttpStatus.ACCEPTED) {
      const batchPayment = plainToClass(ClientBatchPayment, response.body);
      expect(batchPayment.id).toBeDefined();
      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.InProgress);
      expect(batchPayment.type).toBe(PaymentType.ACH);
      return batchPayment;
    }
    return null;
  }

  async initiateDebitRegular(
    payload?: InitiateDebitRegularTransferRequest,
    expectedStatus = HttpStatus.OK,
  ): Promise<ClientBatchPayment | null> {
    const plainPayload = instanceToPlain(payload);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/transfers/initiate-debit-regular`)
      .set('Content-type', 'application/json')
      .send(plainPayload)
      .expect(expectedStatus);

    if (expectedStatus === HttpStatus.OK) {
      const batchPayment = plainToClass(ClientBatchPayment, response.body);
      expect(batchPayment.id).toBeDefined();
      expect(batchPayment.status).toBe(ClientBatchPaymentStatus.Pending);
      expect(batchPayment.type).toBe(PaymentType.DEBIT);
      return batchPayment;
    }
    return null;
  }
}
