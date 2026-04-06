import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { AssignInvoiceActivityCommand } from '@module-invoices/commands';
import { AssignInvoiceTagRequestBuilder } from '@module-invoices/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { AssignTagInvoiceCommandHook } from './assign-tag-invoice.command-hook';
import { EntityStubs } from '@module-persistence/test';
import { ChangeActions } from '@common';

describe('AssignTagInvoiceCommandHook', () => {
  let databaseService: DatabaseService;
  let featureFlagResolver: FeatureFlagResolver;
  let hook: AssignTagInvoiceCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssignTagInvoiceCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    databaseService = module.get(DatabaseService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(AssignTagInvoiceCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload is present, call v1 api', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new AssignInvoiceActivityCommand(
        UUID.get(),
        new AssignInvoiceTagRequestBuilder({
          ingestThrough: true,
          v1Payload: {},
        }).getRequest(),
      ),
      {
        invoice: EntityStubs.buildStubInvoice(),
        changeActions: ChangeActions.empty(),
      },
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'assignTagInvoice')).toBeCalledTimes(1);
  });
});
