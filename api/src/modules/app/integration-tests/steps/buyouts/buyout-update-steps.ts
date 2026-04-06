import { testingRequest } from '@core/test';
import { PendingBuyout, UpdateBuyoutRequest } from '@fs-bobtail/factoring/data';
import { plainToInstance } from 'class-transformer';
import { StepsInput } from '../step';

export class BuyoutUpdateSteps {
  constructor(private readonly input: StepsInput) {}

  async update(
    id: string,
    data: Partial<UpdateBuyoutRequest>,
  ): Promise<PendingBuyout> {
    const response = await testingRequest(this.input.app.getHttpServer())
      .patch(`/buyouts/${id}`)
      .set('Content-type', 'application/json')
      .send(data)
      .expect(200);
    return plainToInstance(PendingBuyout, response.body);
  }
}
