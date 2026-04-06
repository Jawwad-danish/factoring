import { CreateFirebaseTokenRequestBuilder } from '@module-firebase/test';
import { RecordStatus } from '@module-persistence/entities';
import {
  IntegrationTestsAppManager,
  IntegrationTestsDataManager,
} from '../setup';
import { IntegrationTestsSteps } from '../steps';

describe('Delete all firebase tokens integration tests', () => {
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

  it('Create multiple firebase tokens - Delete all firebase tokens', async () => {
    const requests = [
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest(),
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest(),
      CreateFirebaseTokenRequestBuilder.createFirebaseTokenRequest(),
    ];
    await steps.firebaseToken.create(requests[0]);
    await steps.firebaseToken.create(requests[1]);
    await steps.firebaseToken.create(requests[2]);
    await steps.firebaseToken.deleteAll();
    const tokens = await steps.firebaseToken.getAllTokens(userId);
    expect(
      tokens.every((token) => token.recordStatus === RecordStatus.Inactive),
    ).toBe(true);
  });
});
