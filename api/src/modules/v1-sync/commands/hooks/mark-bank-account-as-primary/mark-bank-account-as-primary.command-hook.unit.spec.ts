import { mockToken } from '@core/test';
import { MarkBankAccountAsPrimaryCommand } from '@module-clients/commands';
import { buildStubClientBankAccount } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { MarkBankAccountAsPrimaryCommandHook } from './mark-bank-account-as-primary.command-hook';

describe('MarkBankAccountAsPrimaryCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: MarkBankAccountAsPrimaryCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarkBankAccountAsPrimaryCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(MarkBankAccountAsPrimaryCommandHook);
    v1Api = module.get(V1Api);
  });

  it('should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('should call v1 api when feature flag is enabled', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const clientId = 'client-123';
    const bankAccountId = 'ba-456';
    const request = {
      ingestThrough: true,
      v1Payload: {},
    } as any;

    await hook.afterCommand(
      new MarkBankAccountAsPrimaryCommand(clientId, bankAccountId, request),
      buildStubClientBankAccount(),
    );

    expect(v1Api.updateBankAccount).toHaveBeenCalledTimes(1);
    expect(v1Api.updateBankAccount).toHaveBeenCalledWith(bankAccountId, {
      status: 'active',
      skip_sync: true,
      client_id: clientId,
    });
  });
});
