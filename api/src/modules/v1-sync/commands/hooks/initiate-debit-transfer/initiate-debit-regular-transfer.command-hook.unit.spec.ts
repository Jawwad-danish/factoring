import { mockToken } from '@core/test';
import { EntityStubs } from '@module-persistence/test';
import { FeatureFlagResolver } from '@module-common';
import { InitiateDebitRegularTransferCommand } from '@module-transfers';
import { InitiateDebitRegularTransferRequest } from '@module-transfers/data';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { InitiateDebitRegularTransferCommandHook } from './initiate-debit-regular-transfer.command-hook';
import { PaymentType } from '@module-persistence';

describe('InitiateDebitRegularTransferCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: InitiateDebitRegularTransferCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InitiateDebitRegularTransferCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(InitiateDebitRegularTransferCommandHook);
    v1Api = module.get(V1Api);
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new InitiateDebitRegularTransferRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    await hook.afterCommand(
      new InitiateDebitRegularTransferCommand(payload),
      EntityStubs.buildClientBatchPayment({ type: PaymentType.DEBIT }),
    );
    expect(jest.spyOn(v1Api, 'initiateDebitTransfer')).toBeCalledTimes(1);
  });
});
