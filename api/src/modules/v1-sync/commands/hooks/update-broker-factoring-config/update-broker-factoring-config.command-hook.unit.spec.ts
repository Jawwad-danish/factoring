import { mockToken } from '@core/test';
import { UpdateBrokerFactoringConfigCommand } from '@module-brokers';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import Big from 'big.js';
import { UUID } from '@core/uuid';
import { V1Api } from '../../../api';
import { UpdateBrokerFactoringConfigCommandHook } from './update-broker-factoring-config.command-hook';
import { UpdateBrokerFactoringConfigRequest } from '@module-brokers/data';
import { EntityStubs } from '@module-persistence/test';

describe('UpdateBrokerFactoringConfigCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: UpdateBrokerFactoringConfigCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateBrokerFactoringConfigCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(UpdateBrokerFactoringConfigCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('V1 is called with proper payload', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload: UpdateBrokerFactoringConfigRequest = {
      limitAmount: Big(2000),
      limitNote: 'Increased limit',
      ingestThrough: true,
    };
    const brokerId = UUID.get();
    const entity = EntityStubs.buildBrokerFactoringConfigStub({
      brokerId: brokerId,
    });
    await hook.afterCommand(
      new UpdateBrokerFactoringConfigCommand(brokerId, payload),
      entity,
    );
    expect(jest.spyOn(v1Api, 'updateBroker')).toHaveBeenCalledWith(
      entity.brokerId,
      expect.objectContaining({
        id: entity.brokerId,
        debtor_limit: payload.limitAmount,
        changelog_notes: payload.limitNote,
      }),
    );
  });
});
