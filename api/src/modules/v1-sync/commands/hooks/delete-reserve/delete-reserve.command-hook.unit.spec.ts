import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { DeleteReserveCommand } from '@module-reserves/commands';
import { DeleteReserveRequestBuilder } from '@module-reserves/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { DeleteReserveCommandHook } from './delete-reserve.command-hook';
import { ReserveReason } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';

describe('DeleteReserveCommandHook', () => {
  let databaseService: DatabaseService;
  let featureFlagResolver: FeatureFlagResolver;
  let hook: DeleteReserveCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteReserveCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    databaseService = module.get(DatabaseService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(DeleteReserveCommandHook);
    v1Api = module.get(V1Api);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When feature flag is disabled database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    await hook.afterCommand(
      new DeleteReserveCommand(
        UUID.get(),
        UUID.get(),
        DeleteReserveRequestBuilder.from(),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'deleteReserve')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is false database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new DeleteReserveCommand(
        UUID.get(),
        UUID.get(),
        DeleteReserveRequestBuilder.from({
          ingestThrough: false,
        }),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'deleteReserve')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is true, database flush is called and v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new DeleteReserveCommand(
        UUID.get(),
        UUID.get(),
        DeleteReserveRequestBuilder.from({
          ingestThrough: true,
        }),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'deleteReserve')).toBeCalledTimes(1);
  });

  it('Skippable reasons are skipped', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const entity = EntityStubs.buildStubReserve();
    entity.reason = ReserveReason.ChargebackRemoved;

    await hook.afterCommand(
      new DeleteReserveCommand(
        UUID.get(),
        UUID.get(),
        DeleteReserveRequestBuilder.from({
          ingestThrough: true,
        }),
      ),
      entity,
    );

    expect(jest.spyOn(v1Api, 'deleteReserve')).toBeCalledTimes(0);
  });
});
