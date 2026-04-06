import { CreateFirebaseTokenRequestBuilder } from '@module-firebase/test';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Client firebase token integration tests', () => {
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

  it('Create firebase token', async () => {
    const request =
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest();
    await steps.firebaseToken.create(request);
    const token = await steps.firebaseToken.getUserTokenByToken(
      request.firebaseDeviceToken,
      userId,
    );
    expect(token).toBeDefined();
  });
});
