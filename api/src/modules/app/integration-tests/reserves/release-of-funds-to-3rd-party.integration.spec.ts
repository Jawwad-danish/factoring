import { ReserveReason } from '@module-persistence/entities';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Release of funds to 3rd party reserves', () => {
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

  it('Create positive amount Release of funds to 3rd party - Verify Reserve total', async () => {
    const firstTotal = await steps.reserve.total(clientId);
    const reserve = await steps.reserve.create(
      clientId,
      CreateReserveRequestBuilder.releaseOfFundsTo3rdParty(100),
    );
    const secondTotal = await steps.reserve.total(clientId);

    expect(reserve.reason).toBe(ReserveReason.ReleaseToThirdParty);
    expectBigEquality(reserve.amount, -100);
    expectBigEquality(
      secondTotal.amount,
      firstTotal.amount.plus(reserve.amount),
    );
  });
});
