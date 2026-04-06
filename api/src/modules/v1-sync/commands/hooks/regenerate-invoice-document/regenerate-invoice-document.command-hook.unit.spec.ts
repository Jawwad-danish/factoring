import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { RegenerateInvoiceDocumentCommand } from '@module-invoices/commands';
import { RegenerateInvoiceDocumentRequestBuilder } from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { RegenerateInvoiceDocumentCommandHook } from './regenerate-invoice-document.command-hook';

describe('RegenerateInvoiceDocumentCommandHook', () => {
  let databaseService: DatabaseService;
  let featureFlagResolver: FeatureFlagResolver;
  let hook: RegenerateInvoiceDocumentCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RegenerateInvoiceDocumentCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    databaseService = module.get(DatabaseService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(RegenerateInvoiceDocumentCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When feature flag is disabled database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    await hook.afterCommand(
      new RegenerateInvoiceDocumentCommand(
        UUID.get(),
        RegenerateInvoiceDocumentRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'regenerateInvoiceDocument')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is false database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new RegenerateInvoiceDocumentCommand(
        UUID.get(),
        RegenerateInvoiceDocumentRequestBuilder.from({
          ingestThrough: false,
          v1Payload: {},
        }),
      ),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'regenerateInvoiceDocument')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is true, database flush is called and v1 client called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new RegenerateInvoiceDocumentCommand(
        UUID.get(),
        RegenerateInvoiceDocumentRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'regenerateInvoiceDocument')).toBeCalledTimes(1);
  });
});
