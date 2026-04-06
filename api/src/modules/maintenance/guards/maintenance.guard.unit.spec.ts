import { Test, TestingModule } from '@nestjs/testing';
import { MaintenanceGuard } from './maintenance.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { MaintenanceService } from '../services';
import { createMock } from '@golevelup/ts-jest';
import { EntityStubs } from '@module-persistence/test';

describe('MaintenanceGuard', () => {
  let guard: MaintenanceGuard;
  const reflector = createMock<Reflector>();
  const maintenanceService = createMock<MaintenanceService>();
  const context = createMock<ExecutionContext>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceGuard,
        { provide: Reflector, useValue: reflector },
        {
          provide: MaintenanceService,
          useValue: maintenanceService,
        },
      ],
    }).compile();

    guard = module.get<MaintenanceGuard>(MaintenanceGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access if IS_PUBLIC_KEY is set to true', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementationOnce((key) => key === 'IS_PUBLIC_KEY');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(maintenanceService.get).not.toHaveBeenCalled();
  });

  it('should allow access if ALLOW_DURING_MAINTENANCE_KEY is set to true', async () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementationOnce((key) => key === 'ALLOW_DURING_MAINTENANCE_KEY');
    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(maintenanceService.get).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenException if maintenance is enabled', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    maintenanceService.get.mockResolvedValueOnce(
      EntityStubs.buildStubMaintenance({
        isEnabled: true,
        message: 'Scheduled maintenance',
      }),
    );

    await expect(guard.canActivate(context)).rejects.toThrow(
      new ForbiddenException(
        'API is under maintenance mode. Reason: Scheduled maintenance',
      ),
    );
    expect(maintenanceService.get).toHaveBeenCalledTimes(1);
  });

  it('should allow access if maintenance is disabled', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    maintenanceService.get.mockResolvedValue(
      EntityStubs.buildStubMaintenance({
        isEnabled: false,
      }),
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(maintenanceService.get).toHaveBeenCalledTimes(1);
  });
});
