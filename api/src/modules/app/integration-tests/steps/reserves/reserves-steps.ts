import { PageResult, QueryCriteria } from '@core/data';
import {
  CreateReserveFromReferralRockRequest,
  CreateReserveRequest,
} from '@module-reserves/data';
import { HttpStatus } from '@nestjs/common';
import { StepsInput } from '../step';
import { ReserveCreateSteps } from './reserve-create-steps';
import { ReserveFetchSteps } from './reserve-fetch-steps';
import { Reserve } from '@fs-bobtail/factoring/data';

export class ReserveSteps {
  private readonly createSteps: ReserveCreateSteps;
  private readonly fetchSteps: ReserveFetchSteps;

  constructor(input: StepsInput) {
    this.createSteps = new ReserveCreateSteps(input);
    this.fetchSteps = new ReserveFetchSteps(input);
  }

  total(clientId: string) {
    return this.fetchSteps.total(clientId);
  }

  create(
    clientId: string,
    data: Partial<CreateReserveRequest>,
    expectedStatus?: HttpStatus,
  ) {
    return this.createSteps.create(clientId, data, expectedStatus);
  }

  createRewardReserve(
    data: Partial<CreateReserveFromReferralRockRequest>,
    clientId: string,
  ) {
    return this.createSteps.createRewardReserve(data, clientId);
  }

  async getOne(clientId: string, reserveId: string): Promise<Reserve> {
    return this.fetchSteps.getOne(clientId, reserveId);
  }

  async getAll(
    clientId: string,
    query?: Partial<QueryCriteria>,
  ): Promise<PageResult<Reserve>> {
    return this.fetchSteps.getAll(clientId, query);
  }
}
