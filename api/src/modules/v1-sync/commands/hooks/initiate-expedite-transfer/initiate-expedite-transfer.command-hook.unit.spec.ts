import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { InitiateExpediteTransferRequest } from '@module-transfers/data';
import { Test, TestingModule } from '@nestjs/testing';
import { InitiateExpediteTransferCommand } from '@module-transfers';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { InitiateExpediteTransferCommandHook } from './initiate-expedite-transfer.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('InitiateExpediteTransferCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: InitiateExpediteTransferCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InitiateExpediteTransferCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(InitiateExpediteTransferCommandHook);
    v1Api = module.get(V1Api);
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new InitiateExpediteTransferRequest({
      clientId: UUID.get(),
      ingestThrough: true,
      v1Payload: {},
    });
    await hook.afterCommand(
      new InitiateExpediteTransferCommand(payload),
      EntityStubs.buildStubClientBatchPayment(),
    );
    expect(jest.spyOn(v1Api, 'initiateExpediteTransfer')).toBeCalledTimes(1);
  });
});
