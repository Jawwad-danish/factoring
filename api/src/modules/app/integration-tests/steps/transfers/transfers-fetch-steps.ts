import { PageResult, QueryCriteria, serializeQueryCriteria } from '@core/data';
import { testingRequest } from '@core/test';
import {
  CompleteTransfer,
  UpcomingExpediteTransfer,
  UpcomingRegularTransfer,
} from '@module-transfers/data';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';
export class TransfersFetchSteps {
  constructor(private readonly input: StepsInput) {}

  async upcomingExpedites(): Promise<UpcomingExpediteTransfer[]> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/transfers/upcoming-expedites`)
      .set('Content-type', 'application/json')
      .expect(200);
    return plainToInstance(UpcomingExpediteTransfer, response.body as any[]);
  }

  async upcomingRegulars(): Promise<UpcomingRegularTransfer> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/transfers/upcoming-regulars`)
      .set('Content-type', 'application/json')
      .expect(200);
    return plainToInstance(UpcomingRegularTransfer, response.body);
  }

  async completedTransfers(query?: Partial<QueryCriteria>) {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/transfers/completed`)
      .query(serializeQueryCriteria(query))
      .set('Content-type', 'application/json')
      .expect(200);

    const items = plainToInstance(
      CompleteTransfer,
      response.body.items as any[],
    );
    expect(items.length).toBeDefined();

    return new PageResult(items, response.body.pagination);
  }
}
