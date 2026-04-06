import { mockMikroORMProvider } from '@core/test';
import { createMock } from '@golevelup/ts-jest';
import { MaintenanceRepository } from '@module-persistence/repositories';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateMaintenanceModeCommandHandler } from './update-maintenance-mode.command-handler';
import { UpdateMaintenanceModeCommand } from '../update-maintenance-mode.command';
import { UpdateMaintenanceModeRequest } from '../../../data';

describe('Update maintenance mode command handler', () => {
  const repository = createMock<MaintenanceRepository>();
  let handler: UpdateMaintenanceModeCommandHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateMaintenanceModeCommandHandler,
        MaintenanceRepository,
        mockMikroORMProvider,
      ],
    })
      .overrideProvider(MaintenanceRepository)
      .useValue(repository)
      .compile();

    handler = module.get(UpdateMaintenanceModeCommandHandler);
  }, 60000);

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Update maintenance mode', () => {
    it('Should call repo with correct value', async () => {
      const request = new UpdateMaintenanceModeRequest({
        isEnabled: true,
      });

      await handler.execute(new UpdateMaintenanceModeCommand(request));
      expect(repository.updateMaintenance).toBeCalledWith(true, undefined);
    });

    it('Update message as well', async () => {
      const request = new UpdateMaintenanceModeRequest({
        isEnabled: true,
        message: 'test 123',
      });

      await handler.execute(new UpdateMaintenanceModeCommand(request));
      expect(repository.updateMaintenance).toBeCalledWith(true, 'test 123');
    });
  });
});
