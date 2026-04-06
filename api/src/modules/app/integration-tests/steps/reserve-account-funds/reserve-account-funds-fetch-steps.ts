import { PageResult, QueryCriteria, serializeQueryCriteria } from '@core/data';
import { testingRequest } from '@core/test';
import { plainToClass, plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';
import { ReserveAccountFunds, ReserveAccountFundsTotal } from '@fs-bobtail/factoring/data';
export class ReserveAccountFundsFetchSteps {
  constructor(private readonly input: StepsInput) {}

  async total(clientId: string): Promise<ReserveAccountFundsTotal> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/reserve-account-funds/total`)
      .set('Content-type', 'application/json')
      .expect(200);
    const total = plainToClass(ReserveAccountFundsTotal, response.body);
    expect(total.amount).toBeDefined();
    return total;
  }

  async getAll(
    clientId: string,
    query?: Partial<QueryCriteria>,
  ): Promise<PageResult<ReserveAccountFunds>> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/reserve-account-funds`)
      .query(serializeQueryCriteria(query))
      .set('Content-type', 'application/json')
      .expect(200);
    const items = plainToInstance(
      ReserveAccountFunds,
      response.body.items as any[],
    );
    expect(items.length).toBeDefined();
    return new PageResult(items, response.body.pagination);
  }
}
