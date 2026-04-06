import { serializeQueryCriteria } from '@core/data';
import { testingRequest } from '@core/test';
import { Reserve } from '@fs-bobtail/factoring/data';
import {
  CreateReserveFromReferralRockRequest,
  CreateReserveRequest,
} from '@module-reserves/data';
import {
  CreateReserveRequestBuilder,
  CreateRewardReserveRequestBuilder,
} from '@module-reserves/test';
import { HttpStatus } from '@nestjs/common';
import { plainToClass, plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';
export class ReserveCreateSteps {
  constructor(private readonly input: StepsInput) {}

  async create(
    clientId: string,
    data: Partial<CreateReserveRequest>,
    expectedStatus = HttpStatus.CREATED,
  ): Promise<Reserve> {
    const payload = CreateReserveRequestBuilder.payload(data);
    const response = await testingRequest(this.input.app.getHttpServer())
      .post(`/clients/${clientId}/reserves`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(expectedStatus);
    let reserve: Reserve = new Reserve();
    if (expectedStatus === HttpStatus.CREATED) {
      reserve = plainToClass(Reserve, response.body);
      expect(reserve.id).toBeDefined();
    } else {
      expect(reserve.id).toBeUndefined();
    }
    return reserve;
  }

  async createRewardReserve(
    data: Partial<CreateReserveFromReferralRockRequest>,
    clientId: string,
  ): Promise<void> {
    const payload = CreateRewardReserveRequestBuilder.payload(data) as any;
    payload.EventType = payload.EventType ?? 'RewardIssue';

    await testingRequest(this.input.app.getHttpServer())
      .post(`/reserves/referral-rock-reward`)
      .set('Content-type', 'application/json')
      .send(payload)
      .expect(HttpStatus.CREATED);

    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/reserves/`)
      .query(serializeQueryCriteria())
      .set('Content-type', 'application/json')
      .expect(200);
    const reserves = plainToInstance(Reserve, response.body.items as any[]);
    expect(reserves[0].amount.toString()).toStrictEqual('50000');
  }
}
