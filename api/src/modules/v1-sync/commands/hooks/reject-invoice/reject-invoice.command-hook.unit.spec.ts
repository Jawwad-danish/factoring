import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { RejectInvoiceCommand } from '@module-invoices/commands';
import {
  RejectInvoiceRequestBuilder,
  buildStubCommandInvoiceContext,
} from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { RejectInvoiceCommandHook } from './reject-invoice.command-hook';

describe('RejectInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: RejectInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RejectInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(RejectInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new RejectInvoiceRequestBuilder({
      ingestThrough: true,
      v1Payload: {},
    }).getRequest();
    const context = buildStubCommandInvoiceContext({ payload: payload });
    await hook.afterCommand(
      new RejectInvoiceCommand(UUID.get(), payload),
      context,
    );
    expect(jest.spyOn(v1Api, 'rejectInvoice')).toBeCalledTimes(1);
  });
});
