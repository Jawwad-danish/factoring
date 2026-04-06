import { FeatureFlagResolver } from '@module-common';
import { V1Api } from '../../../api';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { CreateFirebaseTokenCommandHook } from './create-firebase-token.command-hook';
import { CreateFirebaseTokenCommand } from '@module-firebase';

describe('CreateFirebaseTokenCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: CreateFirebaseTokenCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateFirebaseTokenCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(CreateFirebaseTokenCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = {
      firebaseDeviceToken: 'test-token',
      ingestThrough: true,
      v1Payload: {},
    };
    await hook.afterCommand(
      new CreateFirebaseTokenCommand('user-id', payload),
      '',
    );

    expect(jest.spyOn(v1Api, 'createFirebaseToken')).toBeCalledTimes(1);
  });
});
