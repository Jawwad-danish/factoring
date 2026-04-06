import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { DeleteFirebaseTokenCommandHook } from './delete-firebase-token.command-hook';
import { DeleteFirebaseTokenRequestBuilder } from '@module-firebase/test';
import { DeleteFirebaseTokenCommand } from '@module-firebase/commands';

describe('DeleteFirebaseTokenCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: DeleteFirebaseTokenCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteFirebaseTokenCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(DeleteFirebaseTokenCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new DeleteFirebaseTokenCommand(
        'token-123',
        UUID.get(),
        DeleteFirebaseTokenRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
    );
    expect(jest.spyOn(v1Api, 'deleteFirebaseToken')).toBeCalledTimes(1);
  });
});
