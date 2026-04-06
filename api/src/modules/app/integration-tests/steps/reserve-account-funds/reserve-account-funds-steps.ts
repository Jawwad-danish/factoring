import { PageResult, QueryCriteria } from '@core/data';
import {
  CreateReserveAccountFundsRequest,
} from '@module-reserve-account-funds/data';
import { HttpStatus } from '@nestjs/common';
import { StepsInput } from '../step';
import { ReserveAccountFundsCreateSteps } from './reserve-account-funds-create-steps';
import { ReserveAccountFundsFetchSteps } from './reserve-account-funds-fetch-steps';
import { ReserveAccountFunds } from '@fs-bobtail/factoring/data';

export class ReserveAccountFundsSteps {
  private readonly createSteps: ReserveAccountFundsCreateSteps;
  private readonly fetchSteps: ReserveAccountFundsFetchSteps;

  constructor(input: StepsInput) {
    this.createSteps = new ReserveAccountFundsCreateSteps(input);
    this.fetchSteps = new ReserveAccountFundsFetchSteps(input);
  }

  create(
    clientId: string,
    data: Partial<CreateReserveAccountFundsRequest>,
    expectedStatus?: HttpStatus,
  ) {
    return this.createSteps.create(clientId, data, expectedStatus);
  }

  total(clientId: string) {
    return this.fetchSteps.total(clientId);
  }

  getAll(
    clientId: string,
    query?: Partial<QueryCriteria>,
  ): Promise<PageResult<ReserveAccountFunds>> {
    return this.fetchSteps.getAll(clientId, query);
  }
}
