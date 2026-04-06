import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { UpdateInvoiceCommand } from '@module-invoices/commands';
import {
  buildStubCommandInvoiceContext,
  buildStubInvoiceDocument,
  buildStubUpdateInvoiceRequest,
} from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { UpdateInvoiceCommandHook } from './update-invoice.command-hook';

describe('UpdateInvoiceCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: UpdateInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(UpdateInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When documents are to be added, v1 calls are made', async () => {
    const payload = buildStubUpdateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
      documents: {
        toAdd: [buildStubInvoiceDocument()],
        toDelete: [],
        toUpdate: [],
      },
    });
    const context = buildStubCommandInvoiceContext({ payload: payload });
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new UpdateInvoiceCommand(UUID.get(), payload),
      context,
    );
    expect(jest.spyOn(v1Api, 'createInvoiceDocument')).toBeCalledTimes(1);
  });

  it('When documents are to be deleted, v1 calls are made', async () => {
    const payload = buildStubUpdateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
      documents: { toAdd: [], toDelete: [UUID.get()], toUpdate: [] },
    });
    const context = buildStubCommandInvoiceContext({ payload: payload });
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new UpdateInvoiceCommand(UUID.get(), payload),
      context,
    );
    expect(jest.spyOn(v1Api, 'deleteInvoiceDocument')).toBeCalledTimes(1);
  });
});
