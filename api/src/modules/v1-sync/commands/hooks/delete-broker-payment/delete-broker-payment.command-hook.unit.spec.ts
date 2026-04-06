import { mockToken } from '@core/test';
import { DeleteBrokerPaymentCommand } from '@module-broker-payments/commands';
import { DeleteBrokerPaymentRequestBuilder } from '@module-broker-payments/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { DeleteBrokerPaymentCommandHook } from './delete-broker-payment.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('DeleteBrokerPaymentCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: DeleteBrokerPaymentCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteBrokerPaymentCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(DeleteBrokerPaymentCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new DeleteBrokerPaymentRequestBuilder({
      ingestThrough: true,
      v1Payload: {},
    }).getRequest();
    await hook.afterCommand(
      new DeleteBrokerPaymentCommand(UUID.get(), payload),
      EntityStubs.buildStubBrokerPayment(),
    );

    expect(jest.spyOn(v1Api, 'deleteBrokerPayment')).toBeCalledTimes(1);
  });
});
