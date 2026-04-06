import { QueryCriteria } from '@core/data';
import { ClientPayment } from '@fs-bobtail/factoring/data';
import { StepsInput } from '../step';
import { ClientPaymentsFetchSteps } from './client-payments-fetch-steps';

export class ClientPaymentsSteps {
  private readonly fetchSteps: ClientPaymentsFetchSteps;

  constructor(input: StepsInput) {
    this.fetchSteps = new ClientPaymentsFetchSteps(input);
  }

  async getOne(clientId: string, paymentId: string): Promise<ClientPayment> {
    return this.fetchSteps.getOne(clientId, paymentId);
  }

  async getAll(clientId: string, query?: Partial<QueryCriteria>) {
    return this.fetchSteps.getAll(clientId, query);
  }
}
