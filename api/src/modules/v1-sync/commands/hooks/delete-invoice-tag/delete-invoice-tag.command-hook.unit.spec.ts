import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { DeleteInvoiceActivityCommand } from '@module-invoices/commands';
import { buildStubDeleteInvoiceTagRequest } from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { DeleteInvoiceTagCommandHook } from './delete-invoice-tag.command-hook';

describe('DeleteTagInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: DeleteInvoiceTagCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteInvoiceTagCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(DeleteInvoiceTagCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 invoice update id is present, call v1 api', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new DeleteInvoiceActivityCommand(
        UUID.get(),
        UUID.get(),
        buildStubDeleteInvoiceTagRequest({
          ingestThrough: true,
          v1Payload: { invoice_update_id: UUID.get() },
        }),
      ),
    );

    expect(jest.spyOn(v1Api, 'deleteInvoiceUpdate')).toBeCalledTimes(1);
  });
});
