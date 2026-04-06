import { mockToken } from '@core/test';
import { CreateBuyoutsBatchCommand } from '@module-buyouts';
import { buildStubCreateBuyoutsBatchRequest } from '@module-buyouts/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { CreateBuyoutsBatchCommandHook } from './create-buyouts-batch.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('CreateBuyoutsBatchCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: CreateBuyoutsBatchCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateBuyoutsBatchCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(CreateBuyoutsBatchCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = buildStubCreateBuyoutsBatchRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    await hook.afterCommand(
      new CreateBuyoutsBatchCommand(payload),
      EntityStubs.buildStubBuyoutsBatch(),
    );
    expect(jest.spyOn(v1Api, 'createBuyoutsBatch')).toBeCalledTimes(1);
  });
});
