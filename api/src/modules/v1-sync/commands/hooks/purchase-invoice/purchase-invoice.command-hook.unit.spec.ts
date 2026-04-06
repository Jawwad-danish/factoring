import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { PurchaseInvoiceCommand } from '@module-invoices/commands';
import {
  PurchaseInvoiceRequestBuilder,
  buildStubCommandInvoiceContext,
} from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { PurchaseInvoiceCommandHook } from './purchase-invoice.command-hook';

describe('PurchaseInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: PurchaseInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PurchaseInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(PurchaseInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new PurchaseInvoiceRequestBuilder({
      ingestThrough: true,
      v1Payload: {},
    }).getRequest();
    const context = buildStubCommandInvoiceContext({ payload });
    await hook.afterCommand(
      new PurchaseInvoiceCommand(UUID.get(), payload),
      context,
    );
    expect(jest.spyOn(v1Api, 'purchaseInvoice')).toBeCalledTimes(1);
  });
});
