import { CauseAwareError } from '@core/errors';
import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { CreateInvoiceCommand } from '@module-invoices/commands';
import {
  buildStubCommandInvoiceContext,
  buildStubCreateInvoiceRequest,
} from '@module-invoices/test';
import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { CreateInvoiceCommandHook } from './create-invoice.command-hook';

describe('CreateInvoiceCommandHook', () => {
  let hook: CreateInvoiceCommandHook;
  let featureFlagResolver: FeatureFlagResolver;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    hook = module.get(CreateInvoiceCommandHook);
    featureFlagResolver = module.get(FeatureFlagResolver);
    v1Api = module.get(V1Api);
  });

  const mockV1CreateResponse = (data?: { display_id?: string }) => {
    jest.spyOn(v1Api, 'createInvoice').mockResolvedValueOnce({
      ...data,
    });
  };

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload is present, v1Api.createInvoice is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    mockV1CreateResponse();
    const payload = buildStubCreateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    await hook.afterCommand(
      new CreateInvoiceCommand(payload),
      buildStubCommandInvoiceContext({ payload }),
    );

    expect(v1Api.createInvoice).toBeCalledTimes(1);
  });

  it('Should update display id with the value from v1', async () => {
    const displayId = 'display_id_mock';
    const payload = buildStubCreateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    const context = buildStubCommandInvoiceContext({ payload });
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    mockV1CreateResponse({ display_id: displayId });
    await hook.afterCommand(new CreateInvoiceCommand(payload), context);
    expect(context.entity.displayId).toBe(displayId);
  });

  it('Should call handleCreateInvoiceError when v1Api throws an error', async () => {
    const payload = buildStubCreateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    const context = buildStubCommandInvoiceContext({ payload });
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    jest
      .spyOn(v1Api, 'createInvoice')
      .mockRejectedValueOnce(new Error('API error'));
    const errorSpy = jest.spyOn(hook as any, 'handleCreateInvoiceError');

    await expect(
      hook.afterCommand(new CreateInvoiceCommand(payload), context),
    ).rejects.toThrow(CauseAwareError);

    expect(errorSpy).toBeCalledTimes(1);
  });

  it('Should retry calling getInvoice on Gateway Timeout', async () => {
    const payload = buildStubCreateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    const context = buildStubCommandInvoiceContext({ payload });

    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const gatewayTimeoutError = new HttpException('Gateway Timeout', 504);
    jest
      .spyOn(v1Api, 'createInvoice')
      .mockRejectedValueOnce({ cause: gatewayTimeoutError });
    jest.spyOn(v1Api, 'getInvoice').mockResolvedValueOnce({
      display_id: 'retry_display_id_mock',
    });

    await hook.afterCommand(new CreateInvoiceCommand(payload), context);

    expect(context.entity.displayId).toBe('retry_display_id_mock');
    expect(v1Api.getInvoice).toBeCalledTimes(1);
  }, 30000);

  it('Display id is updated with the value from v1', async () => {
    const displayId = 'display_id_mock';
    const payload = buildStubCreateInvoiceRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    const context = buildStubCommandInvoiceContext({ payload: payload });
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    mockV1CreateResponse({ display_id: displayId });
    await hook.afterCommand(new CreateInvoiceCommand(payload), context);
    expect(context.entity.displayId).toBe(displayId);
  });
});
