import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import Big from 'big.js';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Pending buyouts create tests', () => {
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

  it('Create buyout batch', async () => {
    await steps.buyout.createBatch({
      batch: [
        new CreateBuyoutsRequest({
          clientId,
          brokerName: '',
          buyoutDate: new Date(),
          loadNumber: 'l01',
          mc: 'mc',
          rate: new Big(100),
        }),
      ],
    });
  }, 60000);
});
