import { UpdateClientFactoringConfigRequestBuilder } from '@module-clients/test';
import Big from 'big.js';
import { expectBigEquality } from '../expects';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Update client factoring config integration tests', () => {
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

  it('Update client limits', async () => {
    const request = UpdateClientFactoringConfigRequestBuilder.from({
      clientLimitNote: 'Update client limits',
      clientLimitAmount: new Big(500000),
    });

    const clientConfig = await steps.clients.updateClientFactoringConfig(
      clientId,
      request,
    );

    expect(clientConfig.clientLimitAmount).not.toBeNull();
    expectBigEquality(new Big(clientConfig.clientLimitAmount || 0), 500000);
  });
});
