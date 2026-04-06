import { mockToken } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { ReleaseClientBrokerAssignmentCommand } from '@module-client-broker-assignments';
import { FeatureFlagResolver } from '@module-common';
import { Test, TestingModule } from '@nestjs/testing';
import { ClientBrokerAssignmentStatus } from '@module-persistence/entities';
import { V1Api } from '../../../api';
import { ReleaseClientBrokerAssignmentCommandHook } from './release-client-broker-assignment.command-hook';

describe('ReleaseClientBrokerAssignmentCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: ReleaseClientBrokerAssignmentCommandHook;
  let v1Api = createMock<V1Api>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReleaseClientBrokerAssignmentCommandHook, V1Api],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .overrideProvider(V1Api)
      .useValue(v1Api)
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(ReleaseClientBrokerAssignmentCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('fetch v1 assignment - release it', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = {
      clientId: 'client-id',
      brokerId: 'broker-id',
      ingestThrough: true,
      v1Payload: {},
    };

    const result = {
      status: ClientBrokerAssignmentStatus.Released,
      url: 'release-letter-url',
    };
    v1Api.getAssignment.mockResolvedValue({ id: '123' });
    await hook.afterCommand(
      new ReleaseClientBrokerAssignmentCommand(payload),
      result,
    );

    expect(v1Api.releaseAssignment).toBeCalledWith(
      '123',
      'client-id',
      'broker-id',
    );
  });
});
