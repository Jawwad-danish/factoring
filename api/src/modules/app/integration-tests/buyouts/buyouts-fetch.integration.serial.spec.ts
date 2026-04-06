import Big from 'big.js';
import { CreateBuyoutsRequest } from '@fs-bobtail/factoring/data';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Pending buyouts fetch tests', () => {
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

  it('Create buyout batch - fetch buyouts', async () => {
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
    expect(buyouts.length).toBeGreaterThan(0);
  }, 60000);

  it('Create buyout batch - fetch sorted buyouts - buyouts are sorted by creation time', async () => {
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
    expect(buyouts.length).toBeGreaterThan(0);

    for (let i = 0; i < buyouts.length - 1; i++) {
      expect(new Date(buyouts[i].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(buyouts[i + 1].createdAt).getTime(),
      );
    }
  }, 60000);
});
