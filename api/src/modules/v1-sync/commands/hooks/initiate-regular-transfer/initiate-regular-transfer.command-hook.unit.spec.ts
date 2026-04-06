import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { InitiateRegularTransferCommand } from '@module-transfers';
import { InitiateRegularTransferRequest } from '@module-transfers/data';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { InitiateRegularTransferCommandHook } from './initiate-regular-transfer.command-hook';

describe('InitiateRegularTransferCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: InitiateRegularTransferCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InitiateRegularTransferCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(InitiateRegularTransferCommandHook);
    v1Api = module.get(V1Api);
  });

  it('When ingesting through, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new InitiateRegularTransferRequest({
      ingestThrough: true,
    });
    await hook.beforeCommand(new InitiateRegularTransferCommand(payload));
    expect(jest.spyOn(v1Api, 'initiateRegularTransfer')).toBeCalledTimes(1);
  });
});
