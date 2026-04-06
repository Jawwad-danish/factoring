import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { CommandRunner } from '@module-cqrs';
import { MaintenanceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateMaintenanceModeRequest } from '../data';
import { UpdateMaintenanceModeCommand } from './commands';
import { MaintenanceService } from './maintenance.service';
import { EntityStubs } from '@module-persistence/test';

describe('Maintenance service', () => {
  const commandRunner = createMock<CommandRunner>();
  const repository = createMock<MaintenanceRepository>();
  let service: MaintenanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceService,
        CommandRunner,
        MaintenanceRepository,
        mockMikroORMProvider,
      ],
    })
      .overrideProvider(MaintenanceRepository)
      .useValue(repository)
      .overrideProvider(CommandRunner)
      .useValue(commandRunner)
      .compile();

    service = module.get(MaintenanceService);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Fetch maintenance mode', () => {
    it('When maintenance mode is turned on, return true', async () => {
      repository.getMaintenance.mockResolvedValueOnce(
        EntityStubs.buildStubMaintenance(),
      );

      const result = await service.get();
      expect(result.isEnabled).toBe(true);
      expect(repository.getMaintenance).toHaveBeenCalledTimes(1);
    });
  });

  describe('Setting maintenance mode', () => {
    it('Setting maintenance mode to true', async () => {
      const request = new UpdateMaintenanceModeRequest({
        isEnabled: true,
      });
      await service.update(request);
      expect(commandRunner.run).toBeCalledWith(
        new UpdateMaintenanceModeCommand(request),
      );
    });
  });
});
