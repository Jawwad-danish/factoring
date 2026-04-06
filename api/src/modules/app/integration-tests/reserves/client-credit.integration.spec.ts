import { ReserveReason } from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { HttpStatus } from '@nestjs/common';

describe('Client credit reserves', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let clientId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    clientId = appManager.client.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create positive amount Client Credit - Verify Reserve total', async () => {
    const firstTotal = await steps.reserve.total(clientId);
    const reserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(100),
    );
    const secondTotal = await steps.reserve.total(clientId);

    expect(reserve.reason).toBe(ReserveReason.ClientCredit);
    expectBigEquality(reserve.amount, 100);
    expectBigEquality(
      secondTotal.amount,
      firstTotal.amount.plus(reserve.amount),
    );
  });

  it('Create negative amount Client Credit - Receives 400 bad request - reserve total is unchanged', async () => {
    const firstTotal = await steps.reserve.total(clientId);
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.clientCredit(-100),
      HttpStatus.BAD_REQUEST,
    );
    const secondTotal = await steps.reserve.total(clientId);

    expectBigEquality(secondTotal.amount, firstTotal.amount);
  });
});
