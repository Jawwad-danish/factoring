import { CreateRewardReserveRequestBuilder } from '@module-reserves/test';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Create Referral Rock reward reserve', () => {
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

  it('Create Referral Rock reward reserve - Verify Reserve created', async () => {
    const rewardReserveRequest =
      CreateRewardReserveRequestBuilder.rewardReserveRequest();

    await steps.reserve.createRewardReserve(rewardReserveRequest, clientId);
  });
});
