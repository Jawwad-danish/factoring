import { mockToken } from '@core/test';
import { CreateBrokerPaymentCommand } from '@module-broker-payments/commands';
import { buildStubCreateBrokerPaymentRequest } from '@module-broker-payments/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { CreateBrokerPaymentCommandHook } from './create-broker-payment.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('CreateBrokerPaymentCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: CreateBrokerPaymentCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateBrokerPaymentCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(CreateBrokerPaymentCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = buildStubCreateBrokerPaymentRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    await hook.afterCommand(
      new CreateBrokerPaymentCommand(payload),
      EntityStubs.buildStubBrokerPayment(),
    );

    expect(jest.spyOn(v1Api, 'createBrokerPayment')).toBeCalledTimes(1);
  });
});
