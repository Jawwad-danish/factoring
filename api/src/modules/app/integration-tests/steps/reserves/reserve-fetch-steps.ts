import { PageResult, QueryCriteria, serializeQueryCriteria } from '@core/data';
import { testingRequest } from '@core/test';
import { Reserve, ReserveTotal } from '@fs-bobtail/factoring/data';
import { plainToClass, plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';

export class ReserveFetchSteps {
  constructor(private readonly input: StepsInput) {}

  async total(clientId: string): Promise<ReserveTotal> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/reserves/total`)
      .set('Content-type', 'application/json')
      .expect(200);
    const reserveTotal = plainToClass(ReserveTotal, response.body);
    expect(reserveTotal.amount).toBeDefined();
    return reserveTotal;
  }

  async getAll(
    clientId: string,
    query?: Partial<QueryCriteria>,
  ): Promise<PageResult<Reserve>> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/reserves/`)
      .query(serializeQueryCriteria(query))
      .set('Content-type', 'application/json')
      .expect(200);
    const reserves = plainToInstance(Reserve, response.body.items as any[]);
    expect(reserves.length).toBeDefined();
    return new PageResult(reserves, response.body.pagination);
  }

  async getOne(clientId: string, reserveId: string): Promise<Reserve> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/reserves/${reserveId}`)
      .set('Content-type', 'application/json')
      .expect(200);
    const reserves = plainToInstance(Reserve, response.body);
    expect(reserves).toBeDefined();
    return reserves;
  }
}
