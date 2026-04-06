import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { VerifyInvoiceCommand } from '@module-invoices/commands';
import {
  VerifyInvoiceRequestBuilder,
  buildStubCommandInvoiceContext,
} from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { VerifyInvoiceCommandHook } from './verify-invoice.command-hook';

describe('VerifyInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: VerifyInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerifyInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(VerifyInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new VerifyInvoiceRequestBuilder({
      ingestThrough: true,
      v1Payload: {},
    }).getRequest();
    const context = buildStubCommandInvoiceContext({ payload: payload });
    await hook.afterCommand(
      new VerifyInvoiceCommand(UUID.get(), payload),
      context,
    );
    expect(jest.spyOn(v1Api, 'verifyInvoice')).toBeCalledTimes(1);
  });
});
