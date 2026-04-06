import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { DeleteInvoiceCommand } from '@module-invoices/commands';
import { DeleteInvoiceRequestBuilder } from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { DeleteInvoiceCommandHook } from './delete-invoice.command-hook';

describe('DeleteInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: DeleteInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(DeleteInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new DeleteInvoiceCommand(
        UUID.get(),
        DeleteInvoiceRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
    );
    expect(jest.spyOn(v1Api, 'deleteInvoice')).toBeCalledTimes(1);
  });
});
