import { ReserveReason } from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { HttpStatus } from '@nestjs/common';

describe('Release of funds reserves', () => {
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

  it('Create positive amount Release of funds - Verify Reserve total', async () => {
    const releaseOfFundsAmount = 100;
    let initialTotal = await steps.reserve.total(clientId);
    if (initialTotal.amount.lt(releaseOfFundsAmount)) {
      await steps.reserve.create(
        clientId,
        CreateReserveRequestBuilder.clientCredit(releaseOfFundsAmount * 2),
      );
      initialTotal = await steps.reserve.total(clientId);
    }
    const reserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.releaseOfFunds(100),
    );
    const secondTotal = await steps.reserve.total(clientId);

    expect(reserve.reason).toBe(ReserveReason.ReleaseOfFunds);
    expectBigEquality(reserve.amount, -100);
    expectBigEquality(
      secondTotal.amount,
      initialTotal.amount.plus(reserve.amount),
    );
  });

  it('Create negative amount Release of funds - Receive 400 Bad Request - Verify Reserve total', async () => {
    const firstTotal = await steps.reserve.total(clientId);
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.releaseOfFunds(-100),
      HttpStatus.BAD_REQUEST,
    );
    const secondTotal = await steps.reserve.total(clientId);

    expectBigEquality(secondTotal.amount, firstTotal.amount);
  });

  it('Create Release of funds reserve bigger than total - Receive 400 Bad Request - Verify Reserve total', async () => {
    const releaseOfFundsAmount = 100;
    let initialTotal = await steps.reserve.total(clientId);
    if (initialTotal.amount.lt(releaseOfFundsAmount)) {
      await steps.reserve.create(
        clientId,
        CreateReserveRequestBuilder.clientCredit(100),
      );
      initialTotal = await steps.reserve.total(clientId);
    }
    await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.releaseOfFunds(
        initialTotal.amount.plus(releaseOfFundsAmount),
      ),
      HttpStatus.BAD_REQUEST,
    );
    const secondTotal = await steps.reserve.total(clientId);

    expectBigEquality(secondTotal.amount, initialTotal.amount);
  });
});
