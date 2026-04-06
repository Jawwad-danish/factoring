import { ClientPayment } from '@fs-bobtail/factoring/data';
import { StepsInput } from '../step';
import { testingRequest } from '@core/test';
import { plainToInstance } from 'class-transformer';
import { QueryCriteria, serializeQueryCriteria } from '@core/data';

export class ClientPaymentsFetchSteps {
  constructor(private readonly input: StepsInput) {}

  async getOne(clientId: string, paymentId: string): Promise<ClientPayment> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/payments/${paymentId}`)
      .set('Content-type', 'application/json')
      .expect(200);
    const clientPayment = plainToInstance(ClientPayment, response.body);
    expect(clientPayment.id).toBeDefined();
    return clientPayment;
  }

  async getAll(
    clientId: string,
    query?: Partial<QueryCriteria>,
  ): Promise<ClientPayment[]> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/clients/${clientId}/payments`)
      .query(serializeQueryCriteria(query))
      .set('Content-type', 'application/json')
      .expect(200);
    const clientPayments = plainToInstance(
      ClientPayment,
      response.body.items as any[],
    );
    expect(clientPayments.length).toBeDefined();
    return clientPayments;
  }
}
