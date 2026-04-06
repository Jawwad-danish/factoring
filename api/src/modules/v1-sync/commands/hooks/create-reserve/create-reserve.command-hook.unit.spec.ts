import { mockToken } from '@core/test';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { CreateReserveCommand } from '@module-reserves/commands';
import { CreateReserveRequestBuilder } from '@module-reserves/test';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { CreateReserveCommandHook } from './create-reserve.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('CreateReserveCommandHook', () => {
  let databaseService: DatabaseService;
  let featureFlagResolver: FeatureFlagResolver;
  let hook: CreateReserveCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateReserveCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    databaseService = module.get(DatabaseService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(CreateReserveCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When feature flag is disabled database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    await hook.afterCommand(
      new CreateReserveCommand(
        UUID.get(),
        CreateReserveRequestBuilder.from({
          v1Payload: {},
          ingestThrough: true,
        }),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'createReserve')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is false database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new CreateReserveCommand(
        UUID.get(),
        CreateReserveRequestBuilder.from({
          ingestThrough: false,
          v1Payload: {},
        }),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'createReserve')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is true, but no v1 payload database flush is called and v1 client is not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new CreateReserveCommand(
        UUID.get(),
        CreateReserveRequestBuilder.from({
          ingestThrough: true,
        }),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'createReserve')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is true, and v1 payload, database flush is called and v1 client called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new CreateReserveCommand(
        UUID.get(),
        CreateReserveRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
      EntityStubs.buildStubReserve(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'createReserve')).toBeCalledTimes(1);
  });
});
