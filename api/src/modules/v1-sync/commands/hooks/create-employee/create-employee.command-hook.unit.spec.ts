import { FeatureFlagResolver } from '@module-common';
import { CreateEmployeeCommandHook } from './create-employee.command-hook';
import { V1Api } from '../../../api';
import { Test, TestingModule } from '@nestjs/testing';
import { mockToken } from '@core/test';
import { CreateEmployeeCommand } from '@module-users';
import { EmployeeRole } from '@module-persistence/entities';
import { EntityStubs } from '@module-persistence/test';

describe('CreateEmployeeCommandHook', () => {
  let featureFlagResolver: FeatureFlagResolver;
  let hook: CreateEmployeeCommandHook;
  let v1Api: V1Api;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CreateEmployeeCommandHook],
    })
      .useMocker((token) => {
        return mockToken(token);
      })
      .compile();

    featureFlagResolver = module.get(FeatureFlagResolver);
    hook = module.get(CreateEmployeeCommandHook);
    v1Api = module.get(V1Api);
  });

  it('Should be defined', () => {
    expect(hook).toBeDefined();
  });

  it('When v1 payload, v1 client is called', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = {
      role: EmployeeRole.Underwriter,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      ingestThrough: true,
      v1Payload: {},
      extension: '123',
    };
    await hook.afterCommand(
      new CreateEmployeeCommand(payload),
      EntityStubs.buildEmployee(),
    );

    expect(jest.spyOn(v1Api, 'createEmployee')).toBeCalledTimes(1);
  });

  it('Should not run without v1 payload', async () => {
    jest.spyOn(featureFlagResolver, 'isEnabled').mockReturnValueOnce(true);
    const payload = {
      role: EmployeeRole.Underwriter,
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      ingestThrough: true,
      v1Payload: undefined,
      extension: '123',
    };
    await hook.afterCommand(
      new CreateEmployeeCommand(payload),
      EntityStubs.buildEmployee(),
    );

    expect(jest.spyOn(v1Api, 'createEmployee')).toBeCalledTimes(0);
  });
});
