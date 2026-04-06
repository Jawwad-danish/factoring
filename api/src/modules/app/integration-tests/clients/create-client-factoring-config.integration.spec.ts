import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';
import { CreateClientFactoringConfigRequestBuilder } from '@module-clients/test';

describe('Client factoring config integration tests', () => {
  let appManager: IntegrationTestsAppManager;
  let steps: IntegrationTestsSteps;
  let userId: string;

  beforeAll(async () => {
    appManager = await IntegrationTestsAppManager.init();
    steps = new IntegrationTestsSteps(appManager);
    await new IntegrationTestsDataManager(appManager).setup();
    userId = appManager.user.id;
  });

  afterAll(async () => {
    if (appManager) {
      await appManager.close();
    }
  });

  it('Create client factoring config', async () => {
    const clientSuccessTeamId = await steps.clients.getClientSuccessteamId();
    const salesRepId = await steps.clients.getSalesRepId();

    const createRequest =
      CreateClientFactoringConfigRequestBuilder.createClientFactoringConfigAndUser(
        userId,
        clientSuccessTeamId,
        salesRepId,
      );

    const clientConfig = await steps.clients.createClientFactoringConfig(
      createRequest,
    );

    expect(clientConfig.createdBy?.id).toBe(userId);
  });
});
