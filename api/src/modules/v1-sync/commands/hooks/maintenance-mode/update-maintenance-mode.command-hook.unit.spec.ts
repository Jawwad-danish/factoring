import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import {
  UpdateMaintenanceModeCommand,
  UpdateMaintenanceModeRequest,
} from '@module-maintenance';
import { Test, TestingModule } from '@nestjs/testing';
import { V1Api } from '../../../api';
import { UpdateMaintenanceModeCommandHook } from './update-maintenance-mode.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('UpdateMaintenanceModeCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: UpdateMaintenanceModeCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateMaintenanceModeCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(UpdateMaintenanceModeCommandHook);
    v1Api = module.get(V1Api);
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = new UpdateMaintenanceModeRequest({
      ingestThrough: true,
      v1Payload: {},
    });
    const result = EntityStubs.buildStubMaintenance({
      isEnabled: true,
      message: 'test 123',
    });
    await hook.afterCommand(new UpdateMaintenanceModeCommand(payload), result);

    expect(jest.spyOn(v1Api, 'updateMaintenanceMode')).toBeCalledWith(
      expect.objectContaining({
        maintenance_mode: result.isEnabled,
        maintenance_reason: result.message,
      }),
    );
  });
});
