import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { RevertInvoiceCommand } from '@module-invoices/commands';
import {
  RevertInvoiceRequestBuilder,
  buildStubCommandInvoiceContext,
} from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { RevertInvoiceCommandHook } from './revert-invoice.command-hook';

describe('RevertInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: RevertInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevertInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(RevertInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When feature flag is enabled and ingest through is true, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = RevertInvoiceRequestBuilder.from({
      ingestThrough: true,
      v1Payload: {},
    });
    const context = buildStubCommandInvoiceContext({ payload: payload });
    await hook.afterCommand(
      new RevertInvoiceCommand(UUID.get(), payload),
      context,
    );
    expect(jest.spyOn(v1Api, 'revertInvoice')).toBeCalledTimes(1);
  });
});
