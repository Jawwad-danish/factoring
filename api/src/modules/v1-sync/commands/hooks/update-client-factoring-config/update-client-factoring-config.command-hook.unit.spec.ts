import { mockToken } from '@core/test';
import { UpdateClientFactoringConfigCommand } from '@module-clients';
import { ClientFactoringConfigRequestBuilder } from '@module-clients/test';
import { FeatureFlagResolver } from '@module-common';
import { DatabaseService } from '@module-database';
import { Test, TestingModule } from '@nestjs/testing';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { UpdateClientFactoringConfigCommandHook } from './update-client-factoring-config.command-hook';
import { EntityStubs } from '@module-persistence/test';

describe('UpdateClientFactoringConfigCommandHook', () => {
  let databaseService: DatabaseService;
  let featureFlagResolver: FeatureFlagResolver;
  let hook: UpdateClientFactoringConfigCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateClientFactoringConfigCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    databaseService = module.get(DatabaseService);
    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(UpdateClientFactoringConfigCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When feature flag is disabled database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(false);
    await hook.afterCommand(
      new UpdateClientFactoringConfigCommand(
        UUID.get(),
        ClientFactoringConfigRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
      EntityStubs.buildClientFactoringConfig(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'updateClient')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is false database flush and v1 are not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new UpdateClientFactoringConfigCommand(
        UUID.get(),
        ClientFactoringConfigRequestBuilder.from({
          ingestThrough: false,
          v1Payload: {},
        }),
      ),
      EntityStubs.buildClientFactoringConfig(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(0);
    expect(jest.spyOn(v1Api, 'updateClient')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is true, but no v1 payload database flush is called and v1 client is not called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new UpdateClientFactoringConfigCommand(
        UUID.get(),
        ClientFactoringConfigRequestBuilder.from({
          ingestThrough: true,
        }),
      ),
      EntityStubs.buildClientFactoringConfig(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'updateClient')).toBeCalledTimes(0);
  });

  it('When feature flag is enabled and ingest through is true, and v1 payload, database flush is called and v1 client called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    await hook.afterCommand(
      new UpdateClientFactoringConfigCommand(
        UUID.get(),
        ClientFactoringConfigRequestBuilder.from({
          ingestThrough: true,
          v1Payload: {},
        }),
      ),
      EntityStubs.buildClientFactoringConfig(),
    );

    expect(jest.spyOn(databaseService, 'flush')).toBeCalledTimes(1);
    expect(jest.spyOn(v1Api, 'updateClient')).toBeCalledTimes(1);
  });
});
