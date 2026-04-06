import { CreateReserveAccountFundsRequestBuilder } from '@module-reserve-account-funds/test';
import Big from 'big.js';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Create reserve account funds', () => {
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

  it('Create reserve account funds - Verify reserve account funds', async () => {
    const reserveAccountFunds = await steps.reserveAccountFunds.create(
      clientId,
      CreateReserveAccountFundsRequestBuilder.from({
        amount: new Big(100),
        note: 'note',
      }),
    );
    expectBigEquality(reserveAccountFunds.amount, 100);
  });
});
