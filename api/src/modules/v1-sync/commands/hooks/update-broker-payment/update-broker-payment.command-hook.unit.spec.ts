import { mockToken } from '@core/test';
import { UpdateBrokerPaymentCommand } from '@module-broker-payments/commands';
import { buildStubUpdateBrokerPaymentRequest } from '@module-broker-payments/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { UpdateBrokerPaymentCommandHook } from './update-broker-payment.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('UpdateBrokerPaymentCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: UpdateBrokerPaymentCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateBrokerPaymentCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(UpdateBrokerPaymentCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = buildStubUpdateBrokerPaymentRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    await hook.afterCommand(
      new UpdateBrokerPaymentCommand(UUID.get(), payload),
      EntityStubs.buildStubBrokerPayment(),
    );

    expect(jest.spyOn(v1Api, 'updateBrokerPayment')).toBeCalledTimes(1);
  });
});
