import { testingRequest } from '@core/test';
import {
  CreateReserveAccountFundsRequest,
} from '@module-reserve-account-funds/data';
import { CreateReserveAccountFundsRequestBuilder } from '@module-reserve-account-funds/test';
import { Reserve, ReserveAccountFunds } from '@fs-bobtail/factoring/data';
import { HttpStatus } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { StepsInput } from '../step';

export class ReserveAccountFundsCreateSteps {
  constructor(private readonly input: StepsInput) {}

  async create(
    clientId: string,
    data: Partial<CreateReserveAccountFundsRequest>,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<ReserveAccountFunds> {
    const payload = CreateReserveAccountFundsRequestBuilder.payload(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/clients/${clientId}/reserve-account-funds`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(expectedStatus);
    let reserve: ReserveAccountFunds = new ReserveAccountFunds();
    if (expectedStatus === HttpStatus.CREATED) {
      reserve = plainToClass(Reserve, response.body);
      expect(reserve.id).toBeDefined();
    } else {
      expect(reserve.id).toBeUndefined();
    }
    return reserve;
  }
}
