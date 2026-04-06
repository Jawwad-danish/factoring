import { testingRequest } from '@core/test';
import { PendingBuyout } from '@fs-bobtail/factoring/data';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';
export class BuyoutsFetchSteps {
  constructor(private readonly input: StepsInput) {}

  async getAll(): Promise<PendingBuyout[]> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .get(`/buyouts`)
      .set('Content-type', 'application/json')
      .expect(200);
    const pendingBuyouts = plainToInstance(
      PendingBuyout,
      response.body as any[],
    );
    expect(pendingBuyouts.length).toBeDefined();
    return pendingBuyouts;
  }

  async getOneDeleted(buyoutId: string): Promise<void> {
    await testingRequest(this.input.app.getHttpServer())
      .get(`/buyouts/${buyoutId}`)
      .set('Content-type', 'application/json')
      .expect(404);
  }
}
