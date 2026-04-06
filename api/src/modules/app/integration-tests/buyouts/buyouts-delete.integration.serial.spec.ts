import Big from 'big.js';
import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Pending buyouts delete tests', () => {
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

  it('Create buyout batch - Delete buyouts', async () => {
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
    const buyouts = await steps.buyout.getAll();
    for (const buyout of buyouts) {
      await steps.buyout.delete(buyout.id);
      await steps.buyout.getOneDeleted(buyout.id);
    }
  }, 60000);
});
